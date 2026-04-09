import React from "react";
import { useTheme } from "../theme.jsx";

export default function CapacityBar({ assigned, capacity, done = 0 }) {
  const { colors: c } = useTheme();
  const pct = capacity > 0 ? Math.min((assigned / capacity) * 100, 150) : 0;
  const donePct = capacity > 0 ? Math.min((done / capacity) * 100, 100) : 0;
  const over = assigned > capacity && capacity > 0;
  const barColor = over ? c.red : pct > 80 ? c.yellow : c.green;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, width: "100%" }}>
      <div style={{ flex: 1, height: 6, background: c.barTrack, borderRadius: 3, position: "relative" }}>
        {/* Assigned (lighter) */}
        <div style={{
          width: `${Math.min(pct, 100)}%`,
          height: "100%",
          borderRadius: 3,
          background: barColor,
          opacity: 0.4,
          transition: "width 0.4s ease",
        }} />
        {/* Done (solid) */}
        {done > 0 && (
          <div style={{
            position: "absolute", top: 0, left: 0,
            width: `${donePct}%`,
            height: "100%",
            borderRadius: 3,
            background: barColor,
            transition: "width 0.4s ease",
          }} />
        )}
      </div>
      <span style={{
        fontSize: 12,
        fontFamily: "'JetBrains Mono', monospace",
        color: over ? c.red : c.textSecondary,
        fontWeight: over ? 700 : 400,
        minWidth: 60,
        textAlign: "right",
      }}>
        {assigned} / {capacity > 0 ? capacity : "?"}
      </span>
    </div>
  );
}
