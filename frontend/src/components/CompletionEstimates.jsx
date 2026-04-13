import React, { useState, useEffect, useCallback } from "react";
import { fetchProjects, fetchProjectIssues } from "../api.js";
import { useTheme } from "../theme.jsx";
import { formatDate } from "../utils.js";

const MONO = "'JetBrains Mono', 'SF Mono', monospace";
const SANS = "'DM Sans', system-ui, sans-serif";

function computeVelocity(cycles) {
  // Use completed cycles to calculate avg points completed per week
  const completed = cycles.filter((cy) => {
    const scope = cy.completedScopeHistory;
    return scope && scope.length > 1 && cy.completedAt;
  });

  if (completed.length === 0) return null;

  // Take last 6 completed cycles max
  const recent = completed.slice(-6);

  const velocities = recent.map((cy) => {
    const scope = cy.completedScopeHistory;
    const pointsDone = scope[scope.length - 1] || 0;
    const start = new Date(cy.startsAt);
    const end = new Date(cy.endsAt);
    const weeks = Math.max((end - start) / (7 * 86400000), 0.5);
    return pointsDone / weeks;
  });

  const avgVelocity = velocities.reduce((s, v) => s + v, 0) / velocities.length;
  return avgVelocity; // points per week
}

function computeScopeDriftFactor(cycles) {
  // Average ratio of final scope / initial scope across recent cycles
  const withData = cycles.filter((cy) => {
    const scope = cy.scopeHistory;
    return scope && scope.length > 1 && scope[0] > 0;
  });

  if (withData.length === 0) return 1;

  const recent = withData.slice(-6);
  const ratios = recent.map((cy) => {
    const scope = cy.scopeHistory;
    return scope[scope.length - 1] / scope[0];
  });

  return ratios.reduce((s, r) => s + r, 0) / ratios.length;
}

function estimateCompletion(remaining, velocity, driftFactor) {
  if (velocity <= 0 || remaining <= 0) return null;

  const weeksRaw = remaining / velocity;
  const weeksDrifted = (remaining * driftFactor) / velocity;

  const now = new Date();
  const rawDate = new Date(now.getTime() + weeksRaw * 7 * 86400000);
  const driftedDate = new Date(now.getTime() + weeksDrifted * 7 * 86400000);

  return { weeksRaw, weeksDrifted, rawDate, driftedDate };
}

function ProjectRow({ project, milestones, velocity, driftFactor, colors: c }) {
  const [expanded, setExpanded] = useState(false);
  const issues = project.issues?.nodes || [];
  const totalPts = issues.reduce((s, i) => s + (i.estimate || 0), 0);
  const donePts = issues.filter((i) => i.state?.type === "completed").reduce((s, i) => s + (i.estimate || 0), 0);
  const remaining = totalPts - donePts;
  const pct = totalPts > 0 ? Math.round((donePts / totalPts) * 100) : 0;
  const estimate = estimateCompletion(remaining, velocity, driftFactor);

  if (totalPts === 0 && issues.length === 0) return null;

  return (
    <>
      <div
        onClick={() => milestones.length > 0 && setExpanded((e) => !e)}
        style={{
          display: "grid", gridTemplateColumns: "1fr 70px 60px 60px 110px 110px",
          gap: 8, padding: "10px 16px", fontSize: 13,
          borderBottom: `1px solid ${c.divider}`,
          alignItems: "center",
          cursor: milestones.length > 0 ? "pointer" : "default",
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = c.accentBg}
        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {milestones.length > 0 && (
            <span style={{ fontSize: 10, color: c.textDim }}>{expanded ? "▼" : "▶"}</span>
          )}
          <span style={{ fontWeight: 600 }}>{project.name}</span>
          {project.targetDate && (
            <span style={{ fontSize: 10, color: c.textMuted, fontFamily: MONO }}>
              target: {formatDate(project.targetDate)}
            </span>
          )}
        </div>
        <div style={{ fontFamily: MONO, fontSize: 12 }}>
          <span style={{ color: c.green }}>{donePts}</span>
          <span style={{ color: c.textDim }}>/</span>
          <span style={{ color: c.textSecondary }}>{totalPts}h</span>
        </div>
        <div>
          <div style={{ height: 6, background: c.barTrack, borderRadius: 3, overflow: "hidden" }}>
            <div style={{ width: `${pct}%`, height: "100%", borderRadius: 3, background: c.green, opacity: 0.8 }} />
          </div>
        </div>
        <span style={{ fontFamily: MONO, fontSize: 12, color: pct === 100 ? c.green : c.textSecondary }}>{pct}%</span>
        <span style={{ fontFamily: MONO, fontSize: 11, color: remaining === 0 ? c.green : c.text }} title="Based on estimates only">
          {remaining === 0 ? "Done" : estimate ? formatDate(estimate.rawDate.toISOString()) : "—"}
        </span>
        <span style={{
          fontFamily: MONO, fontSize: 11,
          color: remaining === 0 ? c.green : driftFactor > 1.05 ? c.red : c.text,
        }} title="Adjusted for historical scope drift">
          {remaining === 0 ? "Done" : estimate ? formatDate(estimate.driftedDate.toISOString()) : "—"}
        </span>
      </div>

      {/* Milestones */}
      {expanded && milestones.map((ms) => {
        const msIssues = issues.filter((i) => i.projectMilestone?.id === ms.id);
        const msTotalPts = msIssues.reduce((s, i) => s + (i.estimate || 0), 0);
        const msDonePts = msIssues.filter((i) => i.state?.type === "completed").reduce((s, i) => s + (i.estimate || 0), 0);
        const msRemaining = msTotalPts - msDonePts;
        const msPct = msTotalPts > 0 ? Math.round((msDonePts / msTotalPts) * 100) : 0;
        const msEstimate = estimateCompletion(msRemaining, velocity, driftFactor);

        return (
          <div key={ms.id} style={{
            display: "grid", gridTemplateColumns: "1fr 70px 60px 60px 110px 110px",
            gap: 8, padding: "8px 16px 8px 40px", fontSize: 12,
            borderBottom: `1px solid ${c.divider}`,
            alignItems: "center", color: c.textSecondary,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ color: c.textDim }}>↳</span>
              <span>{ms.name}</span>
              {ms.targetDate && (
                <span style={{ fontSize: 10, color: c.textMuted, fontFamily: MONO }}>
                  target: {formatDate(ms.targetDate)}
                </span>
              )}
            </div>
            <div style={{ fontFamily: MONO, fontSize: 11 }}>
              <span style={{ color: c.green }}>{msDonePts}</span>
              <span style={{ color: c.textDim }}>/</span>
              <span>{msTotalPts}h</span>
            </div>
            <div>
              <div style={{ height: 4, background: c.barTrack, borderRadius: 2, overflow: "hidden" }}>
                <div style={{ width: `${msPct}%`, height: "100%", borderRadius: 2, background: c.green, opacity: 0.7 }} />
              </div>
            </div>
            <span style={{ fontFamily: MONO, fontSize: 11, color: msPct === 100 ? c.green : c.textMuted }}>{msPct}%</span>
            <span style={{ fontFamily: MONO, fontSize: 11 }}>
              {msRemaining === 0 ? "Done" : msEstimate ? formatDate(msEstimate.rawDate.toISOString()) : "—"}
            </span>
            <span style={{ fontFamily: MONO, fontSize: 11, color: driftFactor > 1.05 ? c.red : "inherit" }}>
              {msRemaining === 0 ? "Done" : msEstimate ? formatDate(msEstimate.driftedDate.toISOString()) : "—"}
            </span>
          </div>
        );
      })}
    </>
  );
}

export default function CompletionEstimates({ teamId, cycles }) {
  const { colors: c } = useTheme();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const velocity = computeVelocity(cycles);
  const driftFactor = computeScopeDriftFactor(cycles);

  const fetchProjects = useCallback(async () => {
    if (!teamId) return;
    setLoading(true);
    try {
      const data = await fetchProjects();
      const all = data.projects?.nodes || [];
      const active = all.filter((p) => p.state !== "completed" && p.state !== "canceled");

      // Fetch issues for each project individually to stay under complexity limit
      const withIssues = await Promise.all(
        active.map(async (p) => {
          try {
            const issueData = await fetchProjectIssues(p.id);
            return { ...p, issues: issueData.project.issues };
          } catch {
            return { ...p, issues: { nodes: [] } };
          }
        })
      );
      setProjects(withIssues);
    } catch (err) {
      console.error("Failed to fetch projects:", err);
    }
    setLoading(false);
    setLoaded(true);
  }, [teamId]);

  useEffect(() => {
    setLoaded(false);
  }, [teamId]);

  useEffect(() => {
    if (!loaded) fetchProjects();
  }, [fetchProjects, loaded]);

  if (loading) {
    return <div style={{ textAlign: "center", padding: 20, color: c.textMuted, fontSize: 13 }}>Loading projects...</div>;
  }

  if (!velocity) {
    return <div style={{ textAlign: "center", padding: 20, color: c.textMuted, fontSize: 13 }}>Need completed cycles to estimate velocity.</div>;
  }

  if (projects.length === 0 && loaded) {
    return <div style={{ textAlign: "center", padding: 20, color: c.textMuted, fontSize: 13 }}>No active projects found.</div>;
  }

  return (
    <div style={{ marginTop: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: c.textSecondary }}>Project completion estimates</div>
          <div style={{ fontSize: 11, color: c.textMuted }}>
            Based on team velocity of <span style={{ fontFamily: MONO, color: c.accent }}>{velocity.toFixed(1)}h/week</span>
            {driftFactor > 1.01 && (
              <span>
                {" "}&middot; drift factor <span style={{ fontFamily: MONO, color: c.red }}>{driftFactor.toFixed(2)}x</span>
              </span>
            )}
          </div>
        </div>
        <button onClick={fetchProjects} style={{
          background: c.card, border: `1px solid ${c.border}`, borderRadius: 6,
          padding: "4px 10px", fontSize: 11, color: c.textSecondary,
          cursor: "pointer", fontFamily: SANS,
        }}>Refresh</button>
      </div>

      <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 8, overflow: "hidden" }}>
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 70px 60px 60px 110px 110px",
          gap: 8, padding: "8px 16px", fontSize: 10, fontWeight: 600,
          color: c.textMuted, textTransform: "uppercase", letterSpacing: 0.5,
          borderBottom: `1px solid ${c.border}`,
        }}>
          <span>Project</span>
          <span>Points</span>
          <span />
          <span>Done</span>
          <span>ETA (estimate)</span>
          <span>ETA (w/ drift)</span>
        </div>

        {projects.map((p) => (
          <ProjectRow
            key={p.id}
            project={p}
            milestones={(p.projectMilestones?.nodes || []).sort((a, b) => a.sortOrder - b.sortOrder)}
            velocity={velocity}
            driftFactor={driftFactor}
            colors={c}
          />
        ))}
      </div>

      <div style={{ fontSize: 11, color: c.textMuted, marginTop: 8 }}>
        ETA (estimate) = remaining points / velocity.
        ETA (w/ drift) = adjusted for historical scope growth of {((driftFactor - 1) * 100).toFixed(0)}% per cycle.
      </div>
    </div>
  );
}
