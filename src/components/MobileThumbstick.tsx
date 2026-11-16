import { useEffect, useRef, useState } from "react";
import { computeThumbstickVector, setMobileDir } from "@/lib/mobile-input";

const BASE_SIZE = 112;
const KNOB_SIZE = 46;

const MobileThumbstick = () => {
  const padRef = useRef<HTMLDivElement>(null);
  const activePointerRef = useRef<number | null>(null);
  const [knob, setKnob] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);

  const resetStick = () => {
    activePointerRef.current = null;
    setDragging(false);
    setKnob({ x: 0, y: 0 });
    setMobileDir(0, 0);
  };

  useEffect(() => {
    return () => {
      setMobileDir(0, 0);
    };
  }, []);

  const updateFromPointer = (clientX: number, clientY: number) => {
    const pad = padRef.current;
    if (!pad) return;
    const rect = pad.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const { kx, ky, dx, dz } = computeThumbstickVector(clientX - cx, clientY - cy);
    setKnob({ x: kx, y: ky });
    setMobileDir(dx, dz);
  };

  return (
    <div
      ref={padRef}
      id="mobile-thumbstick"
      role="application"
      aria-label="Virtual movement thumbstick"
      onPointerDown={(e) => {
        if (activePointerRef.current !== null) return;
        e.preventDefault();
        activePointerRef.current = e.pointerId;
        setDragging(true);
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
          // Ignore environments without pointer capture
        }
        updateFromPointer(e.clientX, e.clientY);
      }}
      onPointerMove={(e) => {
        if (activePointerRef.current !== e.pointerId) return;
        e.preventDefault();
        updateFromPointer(e.clientX, e.clientY);
      }}
      onPointerUp={(e) => {
        if (activePointerRef.current !== e.pointerId) return;
        e.preventDefault();
        resetStick();
      }}
      onPointerCancel={(e) => {
        if (activePointerRef.current !== e.pointerId) return;
        resetStick();
      }}
      onLostPointerCapture={() => {
        if (activePointerRef.current !== null) {
          resetStick();
        }
      }}
      onContextMenu={(e) => e.preventDefault()}
      style={{
        width: BASE_SIZE,
        height: BASE_SIZE,
        borderRadius: "50%",
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: dragging
          ? "hsla(255, 20%, 12%, 0.78)"
          : "hsla(255, 20%, 9%, 0.65)",
        border: dragging
          ? "1px solid hsla(38, 85%, 55%, 0.8)"
          : "1px solid hsla(38, 85%, 55%, 0.42)",
        boxShadow:
          "inset 0 0 18px rgba(0,0,0,0.55), 0 4px 16px rgba(0,0,0,0.45)",
        touchAction: "none",
        userSelect: "none",
        WebkitUserSelect: "none",
        cursor: "grab",
      }}
    >
      {/* Subtle inner guide ring */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          width: BASE_SIZE * 0.56,
          height: BASE_SIZE * 0.56,
          borderRadius: "50%",
          border: "1px dashed hsla(38, 85%, 55%, 0.25)",
          pointerEvents: "none",
        }}
      />
      {/* Directional notches */}
      {[0, 90, 180, 270].map((deg) => (
        <span
          key={deg}
          aria-hidden="true"
          style={{
            position: "absolute",
            width: 4,
            height: 4,
            borderRadius: "50%",
            background: "hsla(38, 85%, 55%, 0.45)",
            transform: `rotate(${deg}deg) translateY(-${BASE_SIZE / 2 - 8}px)`,
            pointerEvents: "none",
          }}
        />
      ))}
      {/* Draggable knob */}
      <div
        data-testid="thumbstick-knob"
        style={{
          width: KNOB_SIZE,
          height: KNOB_SIZE,
          borderRadius: "50%",
          background: dragging
            ? "hsla(38, 85%, 55%, 0.9)"
            : "hsla(38, 85%, 55%, 0.72)",
          border: "2px solid hsl(40, 35%, 88%)",
          boxShadow: dragging
            ? "0 0 14px hsla(38, 85%, 55%, 0.55)"
            : "0 2px 8px rgba(0,0,0,0.5)",
          transform: `translate3d(${knob.x}px, ${knob.y}px, 0)`,
          transition: dragging ? "none" : "transform 0.14s ease-out",
          pointerEvents: "none",
        }}
      />
    </div>
  );
};

export default MobileThumbstick;
