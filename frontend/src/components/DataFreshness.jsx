import { useState, useEffect } from "react";
import { useTheme } from "../theme.jsx";
import { onFetchStats, getFetchStats, refreshServerCache } from "../api.js";

const MONO = "'JetBrains Mono', 'SF Mono', monospace";

export default function DataFreshness({ onRefresh }) {
  const { colors: c } = useTheme();
  const [stats, setStats] = useState(getFetchStats());

  useEffect(() => {
    // Update on new fetches
    const unsub = onFetchStats(setStats);
    // Tick every 10s to update the age display
    const timer = setInterval(() => setStats(getFetchStats()), 10000);
    return () => { unsub(); clearInterval(timer); };
  }, []);

  const age = stats.age;
  const latency = stats.avgLatency;

  // Traffic light: green < 30s, yellow < 5min, red > 5min
  let color = c.textDim;
  let label = "No data";
  if (age !== null) {
    if (age < 30000) {
      color = c.green;
      label = "Live";
    } else if (age < 60000) {
      color = c.green;
      label = `${Math.round(age / 1000)}s ago`;
    } else if (age < 300000) {
      color = c.yellow;
      label = `${Math.round(age / 60000)}m ago`;
    } else {
      color = c.red;
      label = `${Math.round(age / 60000)}m ago`;
    }
  }

  const handleClick = async () => {
    await refreshServerCache();
    if (onRefresh) onRefresh();
  };

  return (
    <button
      onClick={handleClick}
      title={`Data age: ${label}${latency ? ` · Avg latency: ${latency}ms` : ""}${stats.source ? ` · Source: ${stats.source}` : ""}\nClick to refresh`}
      style={{
        display: "flex", alignItems: "center", gap: 6,
        background: c.card, border: `1px solid ${c.border}`, borderRadius: 6,
        padding: "4px 10px", cursor: "pointer", fontFamily: MONO,
        fontSize: 11, color: c.textSecondary,
      }}
    >
      <span style={{
        width: 7, height: 7, borderRadius: "50%",
        background: color, flexShrink: 0,
        boxShadow: age !== null && age < 30000 ? `0 0 4px ${color}` : "none",
      }} />
      <span style={{ color: c.textSecondary }}>{label}</span>
      {latency !== null && (
        <span style={{ color: c.textMuted, fontSize: 10 }}>{latency}ms</span>
      )}
    </button>
  );
}
