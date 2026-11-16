import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/** Tag a Three.js object (and its descendants) to skip static batching. */
export function markDynamicSubtree<T extends THREE.Object3D>(obj: T): T {
  obj.userData.keepDynamic = true;
  return obj;
}

/** Tag a Material so all static meshes sharing it merge into one draw call retaining the dynamic material instance. */
export function markSharedDynamicMaterial<T extends THREE.Material>(mat: T): T {
  mat.userData.sharedDynamicMat = true;
  return mat;
}

function isInsideDynamicSubtree(obj: THREE.Object3D): boolean {
  let cur: THREE.Object3D | null = obj;
  while (cur) {
    if (cur.userData?.keepDynamic) return true;
    cur = cur.parent;
  }
  return false;
}

interface PendingBucket {
  kind: "lambert-vc" | "basic-vc" | "shared-mat";
  sharedMat?: THREE.Material;
  castShadow: boolean;
  receiveShadow: boolean;
  geometries: THREE.BufferGeometry[];
}

function normalizeGeometry(
  mesh: THREE.Mesh,
  vertexColor?: THREE.Color
): THREE.BufferGeometry | null {
  const src = mesh.geometry;
  if (!src || !src.attributes?.position) return null;

  const geo = src.index ? src.toNonIndexed() : src.clone();
  for (const attrName of Object.keys(geo.attributes)) {
    if (attrName !== "position" && attrName !== "normal") {
      geo.deleteAttribute(attrName);
    }
  }
  geo.applyMatrix4(mesh.matrixWorld);
  if (!geo.attributes.normal) {
    geo.computeVertexNormals();
  }

  if (vertexColor) {
    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    for (let i = 0; i < pos.count; i++) {
      colors[i * 3] = vertexColor.r;
      colors[i * 3 + 1] = vertexColor.g;
      colors[i * 3 + 2] = vertexColor.b;
    }
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  }
  return geo;
}

export interface BatchStaticResult {
  mergedBatches: THREE.Mesh[];
  sourceMeshesMerged: number;
}

/**
 * Merge static opaque voxel meshes under `root` into spatially partitioned vertex-colored
 * (or shared dynamic material) BufferGeometry batches to slash WebGL draw calls while
 * preserving frustum culling, lighting colors, and shadow maps.
 */
export function batchStaticMeshes(
  root: THREE.Object3D,
  attachTarget: THREE.Object3D = root,
  cellSize: number = 18
): BatchStaticResult {
  root.updateMatrixWorld(true);

  const buckets = new Map<string, PendingBucket>();
  const toRemove: THREE.Mesh[] = [];
  const box = new THREE.Box3();
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();

  root.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return;
    if (obj instanceof THREE.InstancedMesh) return;
    if (isInsideDynamicSubtree(obj)) return;
    if (Array.isArray(obj.material)) return;

    const mat = obj.material;
    if (!mat || mat.transparent || mat.side !== THREE.FrontSide) return;

    const isSharedDyn = Boolean(mat.userData?.sharedDynamicMat);
    const isBasicStatic =
      !isSharedDyn &&
      mat instanceof THREE.MeshBasicMaterial &&
      !mat.map;
    const isLambertStatic =
      !isSharedDyn &&
      mat instanceof THREE.MeshLambertMaterial &&
      !mat.map &&
      mat.emissive.getHex() === 0;

    if (!isSharedDyn && !isBasicStatic && !isLambertStatic) return;

    box.setFromObject(obj);
    box.getSize(size);
    box.getCenter(center);

    const maxSpan = Math.max(size.x, size.z);
    const cellKey =
      maxSpan > cellSize * 1.2 || isSharedDyn
        ? "global"
        : `${Math.floor(center.x / cellSize)}_${Math.floor(center.z / cellSize)}`;

    const kind: PendingBucket["kind"] = isSharedDyn
      ? "shared-mat"
      : isLambertStatic
      ? "lambert-vc"
      : "basic-vc";

    const key = isSharedDyn
      ? `shared:${mat.uuid}:${obj.castShadow ? 1 : 0}:${obj.receiveShadow ? 1 : 0}`
      : `${kind}:${cellKey}:${obj.castShadow ? 1 : 0}:${obj.receiveShadow ? 1 : 0}`;

    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = {
        kind,
        sharedMat: isSharedDyn ? mat : undefined,
        castShadow: obj.castShadow,
        receiveShadow: obj.receiveShadow,
        geometries: [],
      };
      buckets.set(key, bucket);
    }

    const vertexColor = isSharedDyn ? undefined : (mat as THREE.MeshLambertMaterial).color;
    const normalized = normalizeGeometry(obj, vertexColor);
    if (!normalized) return;

    bucket.geometries.push(normalized);
    toRemove.push(obj);
  });

  if (toRemove.length === 0) {
    return { mergedBatches: [], sourceMeshesMerged: 0 };
  }

  const sharedLambertVcMat = new THREE.MeshLambertMaterial({ vertexColors: true });
  const sharedBasicVcMat = new THREE.MeshBasicMaterial({ vertexColors: true });

  // Remove old static meshes & dispose unused single-use materials/geometries cleanly
  const sharedGeosUsed = new Set<THREE.BufferGeometry>();
  const sharedMatsUsed = new Set<THREE.Material>();
  for (const bucket of buckets.values()) {
    if (bucket.sharedMat) sharedMatsUsed.add(bucket.sharedMat);
  }
  root.traverse((obj) => {
    if (obj instanceof THREE.InstancedMesh || isInsideDynamicSubtree(obj)) {
      if (obj instanceof THREE.Mesh) {
        sharedGeosUsed.add(obj.geometry);
        if (!Array.isArray(obj.material)) sharedMatsUsed.add(obj.material);
      }
    }
  });

  const removedSet = new Set(toRemove);
  root.traverse((obj) => {
    if (obj instanceof THREE.Mesh && !removedSet.has(obj)) {
      sharedGeosUsed.add(obj.geometry);
      if (!Array.isArray(obj.material)) sharedMatsUsed.add(obj.material);
    }
  });

  for (const m of toRemove) {
    m.parent?.remove(m);
    if (!sharedGeosUsed.has(m.geometry)) {
      m.geometry.dispose();
    }
    if (!Array.isArray(m.material) && !sharedMatsUsed.has(m.material)) {
      m.material.dispose();
    }
  }

  const mergedBatches: THREE.Mesh[] = [];
  for (const [key, bucket] of buckets.entries()) {
    if (bucket.geometries.length === 0) continue;
    const mergedGeo =
      bucket.geometries.length === 1
        ? bucket.geometries[0]
        : mergeGeometries(bucket.geometries, false);

    if (bucket.geometries.length > 1) {
      for (const g of bucket.geometries) g.dispose();
    }
    if (!mergedGeo) continue;

    mergedGeo.computeBoundingSphere();
    mergedGeo.computeBoundingBox();

    const mat =
      bucket.kind === "shared-mat"
        ? bucket.sharedMat!
        : bucket.kind === "lambert-vc"
        ? sharedLambertVcMat
        : sharedBasicVcMat;

    const batchMesh = new THREE.Mesh(mergedGeo, mat);
    batchMesh.name = `static-batch-${key}`;
    batchMesh.castShadow = bucket.castShadow;
    batchMesh.receiveShadow = bucket.receiveShadow;
    batchMesh.frustumCulled = true;
    attachTarget.add(batchMesh);
    mergedBatches.push(batchMesh);
  }

  return { mergedBatches, sourceMeshesMerged: toRemove.length };
}
