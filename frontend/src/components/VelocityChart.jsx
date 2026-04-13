import React, { useState } from "react";
import {
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Bar, BarChart, ReferenceLine, Cell,
} from "recharts";
import { formatDate, statusIcon, statusColor, priorityColor, priorityLabel, flatIssues } from "../utils.js";
import { useTheme } from "../theme.jsx";
import { useUnit } from "../useUnit.js";

const MONO = "'JetBrains Mono', 'SF Mono', monospace";

export default function VelocityChart({ cycle, mode = "hours", issues = [] }) {
  const { colors: c } = useTheme();
  const u = useUnit();
  const [selectedDay, setSelectedDay] = useState(null);
  const completedHist = mode === "hours" ? cycle.completedScopeHistory : cycle.completedIssueCountHistory;

  const start = new Date(cycle.startsAt);
  const end = new Date(cycle.endsAt);
  const totalDays = Math.ceil((end - start) / 86400000);
  const today = new Date();
  const scopeHist = mode === "hours" ? cycle.scopeHistory : cycle.issueCountHistory;
  const hasData = scopeHist && scopeHist.length > 0;

  if (!hasData) {
    return (
      <div style={{
        background: c.card, border: `1px solid ${c.border}`, borderRadius: 8,
        padding: "32px 20px", textAlign: "center",
      }}>
        <div style={{ fontSize: 13, color: c.textMuted }}>No velocity data yet</div>
        <div style={{ fontSize: 11, color: c.textMuted, fontFamily: MONO, marginTop: 6 }}>
          Cycle {cycle.number} starts {formatDate(cycle.startsAt, { weekday: "long", month: "long", day: "numeric" })}
        </div>
      </div>
    );
  }

  // Flatten all issues including children, compute day index for each
  const allIssues = flatIssues(issues);
  const issuesByDay = {};
  allIssues.forEach((issue) => {
    if (!issue.completedAt) return;
    const dayIdx = Math.floor((new Date(issue.completedAt) - start) / 86400000);
    if (dayIdx < 0 || dayIdx >= totalDays) return;
    if (!issuesByDay[dayIdx]) issuesByDay[dayIdx] = [];
    issuesByDay[dayIdx].push(issue);
  });

  // Build chart data for all days in the cycle
  // Use history arrays where available, fall back to counting completed issues
  const hist = completedHist || [];
  const chartData = [];
  for (let i = 0; i < totalDays; i++) {
    const d = new Date(start.getTime() + i * 86400000);
    let closed;
    if (i < hist.length) {
      const prevCompleted = i > 0 ? (hist[i - 1] || 0) : 0;
      const curCompleted = hist[i] || 0;
      closed = i === 0 ? curCompleted : Math.max(0, curCompleted - prevCompleted);
    } else {
      // History not yet recorded for this day — count from actual issues
      const dayIssues = issuesByDay[i] || [];
      closed = mode === "hours"
        ? dayIssues.reduce((s, issue) => s + (issue.estimate || 0), 0)
        : dayIssues.length;
    }
    chartData.push({
      day: i,
      label: formatDate(d),
      closed,
    });
  }

  const avg = chartData.length > 0
    ? chartData.reduce((s, d) => s + d.closed, 0) / chartData.length
    : 0;

  const todayIdx = Math.floor((today - start) / 86400000);

  const selectedIssues = selectedDay != null ? (issuesByDay[selectedDay] || []) : [];

  const handleBarClick = (data, index) => {
    setSelectedDay(selectedDay === index ? null : index);
  };

  return (
    <div>
      <div style={{
        background: c.card, border: `1px solid ${c.border}`, borderRadius: 8,
        padding: "16px 12px 8px 4px",
      }}>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
            onClick={(e) => {
              if (e && e.activeTooltipIndex != null) {
                handleBarClick(null, e.activeTooltipIndex);
              }
            }}
            style={{ cursor: "pointer" }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={c.gridLine} vertical={false} />
            <XAxis dataKey="label"
              tick={{ fontSize: 10, fill: c.textMuted, fontFamily: "monospace" }}
              interval={Math.max(1, Math.floor(chartData.length / 7))}
              axisLine={{ stroke: c.gridLine }} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: c.textMuted, fontFamily: "monospace" }}
              axisLine={false} tickLine={false} width={32} allowDecimals={false} />
            <Tooltip contentStyle={{
              background: c.tooltip, border: `1px solid ${c.border}`, borderRadius: 6,
              fontSize: 12, fontFamily: "monospace", color: c.text,
            }} labelStyle={{ color: c.textMuted }} cursor={{ fill: `${c.accent}11` }} />
            {avg > 0 && (
              <ReferenceLine y={Math.round(avg * 10) / 10} stroke={c.accent} strokeDasharray="6 3"
                label={{ value: `avg ${Math.round(avg * 10) / 10}`, position: "right", fontSize: 10, fill: c.accent }} />
            )}
            {todayIdx >= 0 && todayIdx < chartData.length && (
              <ReferenceLine x={chartData[todayIdx]?.label} stroke={c.textMuted} strokeDasharray="4 4"
                label={{ value: "Today", position: "top", fontSize: 10, fill: c.textMuted }} />
            )}
            <Bar dataKey="closed" radius={[3, 3, 0, 0]} name={mode === "hours" ? "Hours closed" : "Issues closed"}>
              {chartData.map((_, i) => (
                <Cell key={i} fill={i === selectedDay ? c.green : c.accent} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Issues closed on selected day */}
      {selectedDay != null && (
        <div style={{
          background: c.card, border: `1px solid ${c.border}`, borderRadius: 8,
          padding: "16px 20px", marginTop: 10,
        }}>
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            marginBottom: 12,
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: c.textSecondary }}>
              Closed on {chartData[selectedDay]?.label}
            </div>
            <button onClick={() => setSelectedDay(null)} style={{
              background: "transparent", border: `1px solid ${c.border}`, borderRadius: 4,
              padding: "2px 8px", fontSize: 11, color: c.textMuted, cursor: "pointer",
              fontFamily: MONO,
            }}>&times;</button>
          </div>

          {selectedIssues.length === 0 ? (
            <div style={{ fontSize: 12, color: c.textMuted, padding: "8px 0" }}>
              No issues closed on this day
            </div>
          ) : (
            <div>
              {selectedIssues.map((issue) => (
                <div key={issue.id} style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "6px 4px", borderTop: `1px solid ${c.divider}`, fontSize: 13,
                }}
                  onMouseEnter={(e) => e.currentTarget.style.background = c.accentBg}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                >
                  <span style={{ fontSize: 16, width: 20, textAlign: "center", color: statusColor(issue.stateType) }}
                    title={issue.stateType}>
                    {statusIcon(issue.stateType)}
                  </span>
                  <span style={{
                    fontFamily: MONO, fontSize: 11, color: c.textMuted,
                    minWidth: 55, flexShrink: 0,
                  }}>
                    {issue.identifier}
                  </span>
                  <span style={{
                    flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    color: c.text,
                  }}>
                    {issue.title}
                  </span>
                  <span style={{
                    fontSize: 11, color: c.textSecondary, flexShrink: 0,
                    minWidth: 70, textAlign: "right",
                  }}>
                    {issue.assigneeName || "Unassigned"}
                  </span>
                  <span style={{
                    fontFamily: MONO, fontSize: 12, fontWeight: 600,
                    color: issue.estimate ? c.text : c.yellow,
                    minWidth: 28, textAlign: "right", flexShrink: 0,
                  }}>
                    {issue.estimate ? `${issue.estimate}${u}` : "\u2014"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
