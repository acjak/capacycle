import React, { useState } from "react";
import { useTheme } from "../theme.jsx";
import { flatIssues, statusIcon, statusColor, formatDate } from "../utils.js";
import { useUnit } from "../useUnit.js";

const MONO = "'JetBrains Mono', 'SF Mono', monospace";
const SANS = "'DM Sans', system-ui, sans-serif";

function PersonStandup({ name, avatarUrl, completed, inProgress, todo, c, u }) {
  const hasWork = completed.length > 0 || inProgress.length > 0 || todo.length > 0;
  if (!hasWork) return null;

  return (
    <div style={{
      background: c.card, border: `1px solid ${c.border}`, borderRadius: 8,
      padding: "16px 20px", marginBottom: 10,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        {avatarUrl ? (
          <img src={avatarUrl} alt={name} style={{ width: 28, height: 28, borderRadius: "50%" }} />
        ) : (
          <div style={{
            width: 28, height: 28, borderRadius: "50%", background: c.accentBg,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 12, fontWeight: 700, color: c.accent,
          }}>
            {name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
          </div>
        )}
        <div style={{ fontSize: 15, fontWeight: 600 }}>{name}</div>
      </div>

      {completed.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: c.green, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>
            Completed since yesterday ({completed.length})
          </div>
          {completed.map((issue) => (
            <IssueRow key={issue.id} issue={issue} c={c} u={u} />
          ))}
        </div>
      )}

      {inProgress.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: c.accent, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>
            In progress ({inProgress.length})
          </div>
          {inProgress.map((issue) => (
            <IssueRow key={issue.id} issue={issue} c={c} u={u} />
          ))}
        </div>
      )}

      {todo.length > 0 && (
        <div>
          <div style={{ fontSize: 10, fontWeight: 600, color: c.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>
            Up next ({todo.length})
          </div>
          {todo.map((issue) => (
            <IssueRow key={issue.id} issue={issue} c={c} u={u} />
          ))}
        </div>
      )}
    </div>
  );
}

function IssueRow({ issue, c, u }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8, padding: "4px 0",
      fontSize: 13,
    }}>
      <span style={{ color: statusColor(issue.stateType), fontSize: 14 }}>{statusIcon(issue.stateType)}</span>
      <span style={{ fontFamily: MONO, fontSize: 11, color: c.textMuted, flexShrink: 0 }}>{issue.identifier}</span>
      <span style={{ color: c.textSecondary, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {issue.title}
      </span>
      {issue.projectName && (
        <span style={{
          fontSize: 9, padding: "1px 5px", borderRadius: 3, flexShrink: 0,
          background: `${c.textMuted}18`, color: c.textMuted, whiteSpace: "nowrap",
        }}>{issue.projectName}</span>
      )}
      {issue.estimate > 0 && (
        <span style={{ fontFamily: MONO, fontSize: 11, color: c.textDim, flexShrink: 0 }}>{issue.estimate}{u}</span>
      )}
    </div>
  );
}

export default function StandupView({ issues, people, avatars = {} }) {
  const { colors: c } = useTheme();
  const u = useUnit();

  const allFlat = flatIssues(issues);

  // "Yesterday" = 24 hours ago (handles weekends loosely)
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const standups = people.map((name) => {
    const personIssues = allFlat.filter((i) => i.assigneeName === name);

    const completed = personIssues.filter((i) =>
      i.stateType === "completed" && i.completedAt && new Date(i.completedAt) > yesterday
    );
    const inProgress = personIssues.filter((i) => i.stateType === "started");
    const todo = personIssues.filter((i) => i.stateType === "unstarted");

    return { name, completed, inProgress, todo };
  }).filter((s) => s.completed.length > 0 || s.inProgress.length > 0 || s.todo.length > 0);

  // Summary stats
  const totalCompleted = standups.reduce((s, p) => s + p.completed.length, 0);
  const totalInProgress = standups.reduce((s, p) => s + p.inProgress.length, 0);
  const totalTodo = standups.reduce((s, p) => s + p.todo.length, 0);

  return (
    <div>
      {/* Quick summary */}
      <div style={{ display: "flex", gap: 16, marginBottom: 16, fontSize: 12 }}>
        <span style={{ color: c.green }}>
          <span style={{ fontFamily: MONO, fontWeight: 700 }}>{totalCompleted}</span> completed since yesterday
        </span>
        <span style={{ color: c.accent }}>
          <span style={{ fontFamily: MONO, fontWeight: 700 }}>{totalInProgress}</span> in progress
        </span>
        <span style={{ color: c.textMuted }}>
          <span style={{ fontFamily: MONO, fontWeight: 700 }}>{totalTodo}</span> up next
        </span>
      </div>

      {standups.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, color: c.textMuted, fontSize: 13 }}>No assigned work in this cycle.</div>
      ) : (
        standups.map((s) => (
          <PersonStandup
            key={s.name}
            name={s.name}
            avatarUrl={avatars[s.name]}
            completed={s.completed}
            inProgress={s.inProgress}
            todo={s.todo}
            c={c}
            u={u}
          />
        ))
      )}
    </div>
  );
}
