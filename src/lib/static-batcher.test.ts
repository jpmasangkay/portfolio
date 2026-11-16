import * as THREE from "three";
import { describe, expect, it } from "vitest";
import {
  batchStaticMeshes,
  markDynamicSubtree,
  markSharedDynamicMaterial,
} from "./static-batcher";

describe("static-batcher", () => {
  it("merges differently colored static voxel meshes into spatially batched vertex-color draw calls", () => {
    const root = new THREE.Group();
    const g1 = new THREE.BoxGeometry(1, 2, 1);
    const g2 = new THREE.CylinderGeometry(0.4, 0.5, 1.5, 6);
    const m1 = new THREE.Mesh(g1, new THREE.MeshLambertMaterial({ color: 0xff4422 }));
    m1.position.set(2, 1, 2);
    m1.castShadow = true;
    m1.receiveShadow = true;

    const m2 = new THREE.Mesh(g2, new THREE.MeshLambertMaterial({ color: 0x33aa55 }));
    m2.position.set(4, 0.75, 3);
    m2.castShadow = true;
    m2.receiveShadow = true;

    const dyn = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshLambertMaterial({ color: 0xffffff }));
    markDynamicSubtree(dyn);

    root.add(m1, m2, dyn);
    const result = batchStaticMeshes(root, root, 18);

    expect(result.sourceMeshesMerged).toBe(2);
    expect(result.mergedBatches).toHaveLength(1);
    expect(result.mergedBatches[0].geometry.attributes.color).toBeDefined();
    expect(dyn.parent).toBe(root);
    expect(m1.parent).toBeNull();
    expect(m2.parent).toBeNull();
  });

  it("merges shared dynamic-material meshes into one batch preserving material reference", () => {
    const root = new THREE.Group();
    const sharedMat = markSharedDynamicMaterial(new THREE.MeshBasicMaterial({ color: 0xffcc44 }));
    for (let i = 0; i < 5; i++) {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.3), sharedMat);
      mesh.position.set(i * 2, 1, 0);
      root.add(mesh);
    }

    const result = batchStaticMeshes(root, root, 18);
    expect(result.sourceMeshesMerged).toBe(5);
    expect(result.mergedBatches).toHaveLength(1);
    expect(result.mergedBatches[0].material).toBe(sharedMat);
  });
});
