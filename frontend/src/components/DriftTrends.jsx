import React from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Line, ComposedChart,
} from "recharts";
import { useTheme } from "../theme.jsx";
import { useUnit } from "../useUnit.js";

const MONO = "'JetBrains Mono', 'SF Mono', monospace";

function computeCycleStats(cycle) {
  const scope = cycle.scopeHistory || [];
  const completed = cycle.completedScopeHistory || [];
  if (scope.length === 0) return null;

  const initialScope = scope[0];
  const finalScope = scope[scope.length - 1];
  const finalCompleted = completed[completed.length - 1] || 0;

  const scopeChange = finalScope - initialScope;
  const scopeDriftPct = initialScope > 0 ? (scopeChange / initialScope) * 100 : 0;
  const completionPct = finalScope > 0 ? (finalCompleted / finalScope) * 100 : 0;

  return {
    number: cycle.number,
    label: `C${cycle.number}`,
    initialScope,
    finalScope,
    scopeChange,
    scopeDriftPct: Math.round(scopeDriftPct),
    completionPct: Math.round(completionPct),
    completed: finalCompleted,
    startsAt: cycle.startsAt,
    endsAt: cycle.endsAt,
  };
}

export default function DriftTrends({ cycles, activeCycleId }) {
  const { colors: c } = useTheme();
  const u = useUnit();

  // Only include cycles that have data (completed or in progress)
  const stats = cycles
    .map(computeCycleStats)
    .filter((s) => s && s.initialScope > 0);

  if (stats.length < 2) {
    return (
      <div style={{ textAlign: "center", padding: 20, color: c.textMuted, fontSize: 13 }}>
        Need at least 2 cycles with data to show trends.
      </div>
    );
  }

  // Take last 12 cycles max
  const recent = stats.slice(-12);

  const avgDrift = recent.reduce((s, r) => s + r.scopeDriftPct, 0) / recent.length;

  return (
    <div style={{ marginTop: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: c.textSecondary }}>Scope change by cycle</div>
          <div style={{ fontSize: 11, color: c.textMuted }}>
            How much scope changed during each cycle (initial vs final estimate points)
          </div>
        </div>
        <div style={{
          fontSize: 12, fontFamily: MONO, padding: "4px 10px",
          background: c.card, border: `1px solid ${c.border}`, borderRadius: 6,
          color: Math.abs(avgDrift) > 10 ? c.red : c.textSecondary,
        }}>
          avg: {avgDrift > 0 ? "+" : ""}{Math.round(avgDrift)}%
        </div>
      </div>

      <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 8, padding: "16px 12px" }}>
        <ResponsiveContainer width="100%" height={220}>
          <ComposedChart data={recent} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
            <CartesianGrid stroke={c.gridLine} strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: c.textMuted, fontFamily: MONO }}
              axisLine={{ stroke: c.gridLine }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: c.textMuted, fontFamily: MONO }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip
              contentStyle={{
                background: c.tooltip, border: `1px solid ${c.border}`,
                borderRadius: 6, fontSize: 12, fontFamily: MONO,
              }}
              labelStyle={{ color: c.text, fontWeight: 600 }}
              formatter={(value, name) => {
                if (name === "scopeDriftPct") return [`${value > 0 ? "+" : ""}${value}%`, "Scope change"];
                if (name === "completionPct") return [`${value}%`, "Completed"];
                return [value, name];
              }}
            />
            <ReferenceLine y={0} stroke={c.textDim} strokeDasharray="3 3" />
            <Bar
              dataKey="scopeDriftPct"
              fill={c.accent}
              radius={[3, 3, 0, 0]}
              maxBarSize={32}
            >
              {recent.map((entry, i) => (
                <rect key={i} fill={entry.scopeDriftPct > 0 ? c.red : c.green} opacity={0.7} />
              ))}
            </Bar>
            <Line
              dataKey="completionPct"
              stroke={c.green}
              strokeWidth={2}
              dot={{ r: 3, fill: c.green }}
              type="monotone"
            />
          </ComposedChart>
        </ResponsiveContainer>

        {/* Legend */}
        <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 8, fontSize: 11, color: c.textMuted }}>
          <span><span style={{ color: c.red }}>&#9632;</span>/<span style={{ color: c.green }}>&#9632;</span> Scope change %</span>
          <span><span style={{ color: c.green }}>&#9679;</span> Completion %</span>
        </div>
      </div>

      {/* Cycle detail table */}
      <div style={{
        background: c.card, border: `1px solid ${c.border}`, borderRadius: 8,
        overflow: "hidden", marginTop: 12,
      }}>
        <div style={{
          display: "grid", gridTemplateColumns: "50px 80px 80px 80px 80px 1fr",
          gap: 8, padding: "8px 16px", fontSize: 10, fontWeight: 600,
          color: c.textMuted, textTransform: "uppercase", letterSpacing: 0.5,
          borderBottom: `1px solid ${c.border}`,
        }}>
          <span>Cycle</span>
          <span>Start pts</span>
          <span>End pts</span>
          <span>Change</span>
          <span>Done</span>
          <span>Trend</span>
        </div>
        {recent.map((s) => (
          <div key={s.number} style={{
            display: "grid", gridTemplateColumns: "50px 80px 80px 80px 80px 1fr",
            gap: 8, padding: "8px 16px", fontSize: 12, fontFamily: MONO,
            borderBottom: `1px solid ${c.divider}`,
            alignItems: "center",
          }}>
            <span style={{ color: c.textSecondary }}>{s.label}</span>
            <span style={{ color: c.textMuted }}>{s.initialScope}{u}</span>
            <span style={{ color: c.textSecondary }}>{s.finalScope}{u}</span>
            <span style={{ color: s.scopeDriftPct > 0 ? c.red : s.scopeDriftPct < 0 ? c.green : c.textMuted }}>
              {s.scopeDriftPct > 0 ? "+" : ""}{s.scopeDriftPct}%
            </span>
            <span style={{ color: c.green }}>{s.completionPct}%</span>
            <div style={{ height: 4, background: c.barTrack, borderRadius: 2, overflow: "hidden" }}>
              <div style={{
                width: `${Math.min(Math.abs(s.scopeDriftPct), 100)}%`,
                height: "100%", borderRadius: 2,
                background: s.scopeDriftPct > 0 ? c.red : c.green,
                opacity: 0.6,
              }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
