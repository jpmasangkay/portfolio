import tavernImage from "@/assets/blender-tavern.png";

const modalText: React.CSSProperties = {
  fontFamily: "'MedievalSharp', serif",
  color: "hsl(40, 25%, 75%)",
  fontSize: 14,
  lineHeight: 1.7,
};

const ForgeModal = () => {
  return (
    <div>
      <p style={{ ...modalText, fontStyle: "italic", marginBottom: 20, opacity: 0.8 }}>
        "In the heart of the town, raw vertices are hammered into magnificent 3D constructs..."
      </p>

      <div
        style={{
          background: "hsla(250, 15%, 12%, 0.6)",
          border: "2px solid hsl(250, 15%, 22%)",
          overflow: "hidden",
          boxShadow: "3px 3px 0 rgba(0,0,0,0.3)",
        }}
      >
        <div style={{ padding: 6, background: "hsla(250, 12%, 10%, 0.5)" }}>
          <img
            src={tavernImage}
            alt="Medieval Tavern - Blender 3D Render"
            style={{ width: "100%", height: "auto", display: "block" }}
          />
        </div>
        <div style={{ padding: "14px 16px" }}>
          <p
            style={{
              fontFamily: "'Press Start 2P', cursive",
              fontSize: 9,
              color: "hsl(40, 25%, 85%)",
              marginBottom: 8,
              lineHeight: 1.6,
            }}
          >
            🍺 Medieval Tavern
          </p>
          <p style={{ ...modalText, marginBottom: 12 }}>
            A cozy medieval tavern scene rendered in Blender, featuring warm candlelight,
            wooden furniture, and atmospheric stone interiors. The perfect place for
            adventurers to rest between quests.
          </p>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" as const }}>
            {["Blender", "3D Modeling", "Lighting", "Rendering"].map((tag) => (
              <span
                key={tag}
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 9,
                  padding: "3px 8px",
                  background: "hsla(250, 15%, 20%, 0.8)",
                  color: "hsl(25, 70%, 60%)",
                  border: "1px solid hsl(250, 15%, 28%)",
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgeModal;
