import React, { useState, useEffect, useCallback, useRef } from "react";
import { linearQuery, ISSUE_HISTORY_QUERY } from "../api.js";
import { useTheme } from "../theme.jsx";
import { flatIssues, statusIcon, statusColor } from "../utils.js";

const MONO = "'JetBrains Mono', 'SF Mono', monospace";
const SANS = "'DM Sans', system-ui, sans-serif";

function ActualHoursInput({ issueId, value, c, onChange }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(value > 0 ? String(value) : "");
  const inputRef = useRef(null);

  const save = () => {
    const val = parseFloat(text) || 0;
    onChange(issueId, val);
    setEditing(false);
  };

  if (!editing) {
    return (
      <span
        onClick={(e) => { e.stopPropagation(); setText(value > 0 ? String(value) : ""); setEditing(true); setTimeout(() => inputRef.current?.focus(), 0); }}
        style={{
          fontFamily: MONO, fontSize: 12, cursor: "text",
          color: value > 0 ? c.green : c.textDim,
          minWidth: 36, textAlign: "right", display: "inline-block",
        }}
        title="Click to set actual hours"
      >
        {value > 0 ? `${value}h` : "—"}
      </span>
    );
  }

  return (
    <input
      ref={inputRef}
      type="number" min={0} step={0.5}
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={save}
      onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") setEditing(false); }}
      onClick={(e) => e.stopPropagation()}
      style={{
        width: 44, padding: "1px 4px", fontSize: 12, fontFamily: MONO,
        background: c.input, border: `1px solid ${c.accent}`, borderRadius: 3,
        color: c.text, textAlign: "right", outline: "none",
      }}
    />
  );
}

function analyzeHistory(history, cycleStartsAt) {
  const cycleStart = cycleStartsAt ? new Date(cycleStartsAt) : null;

  // Sort by date
  const entries = [...(history || [])].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  // Find when issue was first moved to started
  let startedAt = null;
  for (const e of entries) {
    if (e.toState?.type === "started" && e.fromState?.type !== "started") {
      startedAt = new Date(e.createdAt);
      break;
    }
  }

  // Get estimate changes
  const estimateChanges = entries.filter((e) => e.fromEstimate != null || e.toEstimate != null);

  let originalEstimate = null;
  const preSprintChanges = [];
  const preStartChanges = [];
  const postStartChanges = [];

  for (const e of estimateChanges) {
    const at = new Date(e.createdAt);

    if (originalEstimate === null) {
      // First estimate-related entry: if fromEstimate exists, that's the original
      // (estimate was set during creation, no separate history entry for it)
      if (e.fromEstimate != null) {
        originalEstimate = e.fromEstimate;
        // This entry is a real change, fall through to classify it
      } else if (e.toEstimate != null) {
        originalEstimate = e.toEstimate;
        continue; // Just the initial estimate being set
      }
    }

    const change = {
      from: e.fromEstimate,
      to: e.toEstimate,
      at: e.createdAt,
      delta: (e.toEstimate || 0) - (e.fromEstimate || 0),
    };

    if (cycleStart && at < cycleStart) {
      preSprintChanges.push(change);
    } else if (startedAt && at < startedAt) {
      preStartChanges.push(change);
    } else {
      postStartChanges.push(change);
    }
  }

  return {
    originalEstimate,
    startedAt,
    preSprintChanges,
    preStartChanges,
    postStartChanges,
    totalChanges: preSprintChanges.length + preStartChanges.length + postStartChanges.length,
  };
}

function ChangeBadge({ changes, label, color, c }) {
  if (changes.length === 0) return null;
  const totalDelta = changes.reduce((s, ch) => s + ch.delta, 0);
  const sign = totalDelta > 0 ? "+" : "";
  return (
    <span title={`${changes.length} change(s): ${changes.map((ch) => `${ch.from}→${ch.to}`).join(", ")}`}
      style={{
        fontSize: 10, fontFamily: MONO, padding: "1px 6px",
        borderRadius: 3, background: `${color}18`, color,
        whiteSpace: "nowrap",
      }}>
      {label} {sign}{totalDelta}h ({changes.length}×)
    </span>
  );
}

function EstimateTimeline({ analysis, currentEstimate, c }) {
  const { originalEstimate, preSprintChanges, preStartChanges, postStartChanges } = analysis;

  if (originalEstimate == null && currentEstimate == null) {
    return <span style={{ fontSize: 11, color: c.textDim }}>no estimate</span>;
  }

  const lastPreSprint = preSprintChanges.length > 0 ? preSprintChanges[preSprintChanges.length - 1].to : null;
  const lastPreStart = preStartChanges.length > 0 ? preStartChanges[preStartChanges.length - 1].to : null;

  const stages = [];
  if (originalEstimate != null) stages.push({ label: originalEstimate, color: c.textMuted });
  if (lastPreSprint != null) stages.push({ label: lastPreSprint, color: c.yellow });
  if (lastPreStart != null) stages.push({ label: lastPreStart, color: c.accent });
  if (postStartChanges.length > 0) stages.push({ label: currentEstimate, color: c.red });

  // If original differs from current but no intermediate changes were recorded,
  // show the drift anyway (history entries may be missing or delayed)
  const lastStage = stages.length > 0 ? stages[stages.length - 1].label : null;
  if (currentEstimate != null && lastStage !== currentEstimate) {
    const driftColor = analysis.startedAt ? c.red : c.accent;
    stages.push({ label: currentEstimate, color: driftColor });
  }

  // No estimate history at all
  if (stages.length <= 1) {
    return <span style={{ fontSize: 12, fontFamily: MONO, color: c.text }}>{currentEstimate ?? "—"}h</span>;
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 12, fontFamily: MONO }}>
      {stages.map((s, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span style={{ color: c.textDim, fontSize: 10 }}>→</span>}
          <span style={{
            color: s.color,
            fontWeight: i === stages.length - 1 ? 700 : 400,
            textDecoration: i < stages.length - 1 ? "line-through" : "none",
            opacity: i < stages.length - 1 ? 0.6 : 1,
          }}>{s.label}</span>
        </React.Fragment>
      ))}
      <span style={{ color: c.textDim }}>h</span>
    </div>
  );
}

export default function EstimatesView({ issues, cycle, avatars = {} }) {
  const { colors: c } = useTheme();
  const [historyMap, setHistoryMap] = useState({});
  const [actualHoursMap, setActualHoursMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [sortBy, setSortBy] = useState("drift"); // drift, name, identifier

  const allIssues = flatIssues(issues);

  const fetchAllHistory = useCallback(async () => {
    setLoading(true);
    const map = {};
    const ids = allIssues.map((i) => i.id);
    // Batch fetch history
    const batchSize = 10;
    for (let i = 0; i < allIssues.length; i += batchSize) {
      const batch = allIssues.slice(i, i + batchSize);
      const results = await Promise.all(
        batch.map((issue) =>
          linearQuery(ISSUE_HISTORY_QUERY, { issueId: issue.id })
            .then((data) => ({ id: issue.id, history: data.issue.history.nodes }))
            .catch(() => ({ id: issue.id, history: [] }))
        )
      );
      results.forEach((r) => { map[r.id] = r.history; });
    }
    setHistoryMap(map);
    // Fetch actual hours
    try {
      const res = await fetch("/api/actual-hours", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ issueIds: ids }),
      });
      const hours = await res.json();
      setActualHoursMap(hours);
    } catch { /* ignore */ }
    setLoading(false);
    setLoaded(true);
  }, [allIssues.map((i) => i.id).join(",")]);

  const saveActualHours = useCallback(async (issueId, hours) => {
    setActualHoursMap((prev) => ({ ...prev, [issueId]: hours }));
    try {
      await fetch(`/api/actual-hours/${issueId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hours }),
      });
    } catch { /* ignore */ }
  }, []);

  // Fingerprint of issue data — triggers refetch when estimates or states change
  const issueFingerprint = allIssues.map((i) => `${i.id}:${i.estimate}:${i.stateType}`).join(",");

  useEffect(() => {
    setLoaded(false);
    setHistoryMap({});
  }, [cycle?.id, issueFingerprint]);

  useEffect(() => {
    if (!loaded && allIssues.length > 0) fetchAllHistory();
  }, [fetchAllHistory, loaded, allIssues.length]);

  // Build analysis for each issue
  const analyzed = allIssues.map((issue) => ({
    issue,
    analysis: analyzeHistory(historyMap[issue.id], cycle?.startsAt),
  }));

  // Compute drift: (current - original) / original
  const withDrift = analyzed.map((a) => {
    const orig = a.analysis.originalEstimate;
    const curr = a.issue.estimate;
    let drift = 0;
    if (orig != null && curr != null && orig > 0) {
      drift = ((curr - orig) / orig) * 100;
    }
    return { ...a, drift };
  });

  // Sort
  const sorted = [...withDrift].sort((a, b) => {
    if (sortBy === "drift") return Math.abs(b.drift) - Math.abs(a.drift);
    if (sortBy === "name") return (a.issue.assigneeName || "").localeCompare(b.issue.assigneeName || "");
    return a.issue.identifier.localeCompare(b.issue.identifier);
  });

  // Aggregate stats — count issues where estimate changed (either via history or original vs current mismatch)
  const withChanges = withDrift.filter((a) => a.drift !== 0 || a.analysis.totalChanges > 0);
  const withPostStart = withDrift.filter((a) =>
    a.analysis.postStartChanges.length > 0 ||
    (a.analysis.startedAt && a.analysis.originalEstimate != null && a.issue.estimate !== a.analysis.originalEstimate)
  );
  const drifted = withDrift.filter((a) => a.drift !== 0);
  const avgDrift = drifted.length > 0
    ? drifted.reduce((s, a) => s + a.drift, 0) / drifted.length
    : 0;
  const totalOriginal = withDrift.reduce((s, a) => s + (a.analysis.originalEstimate || 0), 0);
  const totalCurrent = withDrift.reduce((s, a) => s + (a.issue.estimate || 0), 0);
  const totalActual = Object.values(actualHoursMap).reduce((s, h) => s + (h || 0), 0);

  return (
    <div>
      {loading && (
        <div style={{ textAlign: "center", padding: 30, color: c.textMuted, fontSize: 13 }}>
          Loading estimate history...
        </div>
      )}

      {!loading && loaded && (
        <>
          {/* Summary cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 10, marginBottom: 16 }}>
            {[
              { label: "Issues", value: allIssues.length, color: c.text },
              { label: "Original total", value: `${totalOriginal}h`, color: c.textSecondary },
              { label: "Current total", value: `${totalCurrent}h`, color: totalCurrent > totalOriginal ? c.red : c.green },
              { label: "Actual total", value: `${totalActual}h`, color: totalActual > totalCurrent ? c.red : totalActual > 0 ? c.green : c.textMuted },
              { label: "Avg drift", value: `${avgDrift > 0 ? "+" : ""}${Math.round(avgDrift)}%`, color: Math.abs(avgDrift) > 20 ? c.red : c.textSecondary },
              { label: "Re-estimated", value: withChanges.length, color: withChanges.length > 0 ? c.yellow : c.textMuted },
              { label: "Changed after start", value: withPostStart.length, color: withPostStart.length > 0 ? c.red : c.textMuted },
            ].map((s) => (
              <div key={s.label} style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 8, padding: "10px 14px", textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: s.color, fontFamily: MONO }}>{s.value}</div>
                <div style={{ fontSize: 9, color: c.textMuted, marginTop: 1, textTransform: "uppercase", letterSpacing: 0.5 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Sort controls */}
          <div style={{ display: "flex", gap: 4, marginBottom: 12 }}>
            <span style={{ fontSize: 11, color: c.textMuted, marginRight: 4, lineHeight: "24px" }}>Sort:</span>
            {[{ id: "drift", label: "Drift" }, { id: "identifier", label: "ID" }, { id: "name", label: "Assignee" }].map((s) => (
              <button key={s.id} onClick={() => setSortBy(s.id)} style={{
                background: sortBy === s.id ? c.accentBg : "transparent",
                border: `1px solid ${sortBy === s.id ? c.accent : c.border}`,
                borderRadius: 4, padding: "3px 8px", fontSize: 10,
                color: sortBy === s.id ? c.accent : c.textMuted,
                cursor: "pointer", fontFamily: MONO,
              }}>{s.label}</button>
            ))}
          </div>

          {/* Issue list */}
          <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 8, overflow: "hidden" }}>
            {/* Header */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "20px 60px 1fr 90px 150px 110px 44px",
              gap: 8, padding: "8px 16px", fontSize: 10, fontWeight: 600,
              color: c.textMuted, textTransform: "uppercase", letterSpacing: 0.5,
              borderBottom: `1px solid ${c.border}`,
            }}>
              <span />
              <span>ID</span>
              <span>Title</span>
              <span>Assignee</span>
              <span>Estimate flow</span>
              <span>Changes</span>
              <span style={{ textAlign: "right" }}>Actual</span>
            </div>

            {sorted.map(({ issue, analysis, drift }) => (
              <div key={issue.id} style={{
                display: "grid",
                gridTemplateColumns: "20px 60px 1fr 90px 150px 110px 44px",
                gap: 8, padding: "8px 16px", fontSize: 13,
                borderBottom: `1px solid ${c.divider}`,
                alignItems: "center",
              }}
                onMouseEnter={(e) => e.currentTarget.style.background = c.accentBg}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
              >
                <span style={{ fontSize: 16, color: statusColor(issue.stateType) }}>
                  {statusIcon(issue.stateType)}
                </span>
                <a href={`https://linear.app/issue/${issue.identifier}`} target="_blank" rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  style={{ fontFamily: MONO, fontSize: 11, color: c.textMuted, textDecoration: "none" }}
                >{issue.identifier}</a>
                <div style={{ overflow: "hidden", display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                  {issue.parentId && (
                    <span style={{ fontSize: 10, color: c.textDim, flexShrink: 0 }} title="Sub-issue">↳</span>
                  )}
                  <a href={`https://linear.app/issue/${issue.identifier}`} target="_blank" rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      color: c.textSecondary, textDecoration: "none",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}
                  >{issue.title}</a>
                  {issue.milestoneName && (
                    <span style={{
                      fontSize: 9, padding: "1px 5px", borderRadius: 3, flexShrink: 0,
                      background: `${c.accent}18`, color: c.accent, fontWeight: 500, whiteSpace: "nowrap",
                    }}>{issue.milestoneName}</span>
                  )}
                  {issue.projectName && (
                    <span style={{
                      fontSize: 9, padding: "1px 5px", borderRadius: 3, flexShrink: 0,
                      background: `${c.textMuted}18`, color: c.textMuted, fontWeight: 500, whiteSpace: "nowrap",
                    }}>{issue.projectName}</span>
                  )}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {avatars[issue.assigneeName] && (
                    <img src={avatars[issue.assigneeName]} alt="" style={{ width: 16, height: 16, borderRadius: "50%", flexShrink: 0 }} />
                  )}
                  <span style={{ fontSize: 11, color: c.textSecondary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {issue.assigneeName === "Unassigned" ? "—" : issue.assigneeName?.split(" ")[0]}
                  </span>
                </div>
                <EstimateTimeline analysis={analysis} currentEstimate={issue.estimate} c={c} />
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  <ChangeBadge changes={analysis.preSprintChanges} label="pre" color={c.yellow} c={c} />
                  <ChangeBadge changes={analysis.preStartChanges} label="plan" color={c.accent} c={c} />
                  <ChangeBadge changes={analysis.postStartChanges} label="wip" color={c.red} c={c} />
                </div>
                <div style={{ textAlign: "right" }}>
                  <ActualHoursInput issueId={issue.id} value={actualHoursMap[issue.id] || 0} c={c} onChange={saveActualHours} />
                </div>
              </div>
            ))}

            {sorted.length === 0 && (
              <div style={{ textAlign: "center", padding: 30, color: c.textMuted, fontSize: 13 }}>No issues to analyze</div>
            )}
          </div>

          {/* Legend */}
          <div style={{ display: "flex", gap: 16, marginTop: 12, fontSize: 11, color: c.textMuted }}>
            <span><span style={{ color: c.yellow }}>●</span> pre — before sprint start</span>
            <span><span style={{ color: c.accent }}>●</span> plan — before work started</span>
            <span><span style={{ color: c.red }}>●</span> wip — after work started</span>
          </div>
        </>
      )}
    </div>
  );
}
