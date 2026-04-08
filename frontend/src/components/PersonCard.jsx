import React, { useState, useEffect } from "react";
import CapacityBar from "./CapacityBar.jsx";
import { statusIcon, statusColor, priorityColor, priorityLabel, initials, totalEstimate, flatIssues } from "../utils.js";
import { useTheme } from "../theme.jsx";

function IssueRow({ issue, c, indent = 0, isLast = true, hasChildren = false, childrenExpanded = false, onToggleChildren }) {
  const est = hasChildren && !childrenExpanded ? totalEstimate(issue) : issue.estimate;
  const showToggle = hasChildren;

  return (
    <div
      onMouseEnter={(e) => e.currentTarget.style.background = c.accentBg}
      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
      style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "5px 4px", borderTop: `1px solid ${c.divider}`, fontSize: 13,
        borderRadius: 4, margin: "0 -4px", transition: "background 0.1s",
        paddingLeft: indent > 0 ? 4 : 4,
      }}>
      {/* Tree indent */}
      {indent > 0 && (
        <span style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          width: 16, color: c.textDim, fontSize: 12, flexShrink: 0,
          marginLeft: indent * 12,
        }}>
          {isLast ? "\u2514" : "\u251C"}
        </span>
      )}
      {/* Collapse toggle for parents */}
      {showToggle && indent === 0 && (
        <span
          onClick={(e) => { e.stopPropagation(); onToggleChildren?.(); }}
          style={{
            width: 20, height: 20, textAlign: "center", cursor: "pointer",
            fontSize: 11, color: c.accent, flexShrink: 0, userSelect: "none",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            borderRadius: 3, background: c.accentBg,
          }}
          title={childrenExpanded ? "Collapse sub-issues" : "Expand sub-issues"}
        >
          {childrenExpanded ? "\u25BC" : "\u25B6"}
        </span>
      )}
      {!showToggle && indent === 0 && (
        <span style={{ width: 20, flexShrink: 0 }} />
      )}
      <span style={{
        fontSize: 16, width: 20, textAlign: "center",
        color: statusColor(issue.stateType), flexShrink: 0, lineHeight: 1,
      }} title={issue.stateName}>
        {statusIcon(issue.stateType)}
      </span>
      <span style={{
        fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
        color: c.textMuted, minWidth: 56, flexShrink: 0,
      }}>{issue.identifier}</span>
      <a href={`https://linear.app/issue/${issue.identifier}`} target="_blank" rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        style={{
          flex: 1, color: c.textSecondary, textDecoration: "none",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
      }}>{issue.title}</a>
      {issue.priority > 0 && (
        <span style={{
          fontSize: 10, fontFamily: "'JetBrains Mono', monospace",
          color: priorityColor(issue.priority), fontWeight: 600, flexShrink: 0,
        }}>{priorityLabel(issue.priority)}</span>
      )}
      <span style={{
        fontFamily: "'JetBrains Mono', monospace", fontSize: 12,
        color: est ? c.text : c.yellow,
        fontWeight: est ? 600 : 400,
        minWidth: 28, textAlign: "right", flexShrink: 0,
      }}>
        {est ? `${est}pt` : "\u2014"}
      </span>
    </div>
  );
}

export default function PersonCard({ name, issues, capacity, expanded: expandedProp }) {
  const { colors: c } = useTheme();
  const [expanded, setExpanded] = useState(expandedProp ?? true);
  const [expandedParents, setExpandedParents] = useState({});

  useEffect(() => {
    if (expandedProp !== undefined) setExpanded(expandedProp);
  }, [expandedProp]);

  const allFlat = flatIssues(issues);
  const totalEst = allFlat.reduce((s, i) => s + (i.estimate || 0), 0);
  const inProg = allFlat.filter((i) => i.stateType === "started");
  const todo = allFlat.filter((i) => i.stateType === "unstarted" || i.stateType === "backlog");
  const done = allFlat.filter((i) => i.stateType === "completed");
  const unest = allFlat.filter((i) => !i.estimate);
  const over = capacity > 0 && totalEst > capacity;

  const sortedIssues = [...issues].sort((a, b) => {
    const order = { started: 0, unstarted: 1, backlog: 2, completed: 3, canceled: 4 };
    return (order[a.stateType] ?? 2) - (order[b.stateType] ?? 2);
  });

  const toggleParent = (id) => {
    setExpandedParents((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div style={{
      background: c.card, borderRadius: 8, padding: "18px 20px",
      border: over ? `1px solid ${c.redBorder}` : `1px solid ${c.border}`,
      cursor: "pointer",
    }} onClick={() => setExpanded((e) => !e)}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: "50%",
            background: over ? c.redBg : c.accentBg,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 13, fontWeight: 600,
            color: over ? c.red : c.accent,
            fontFamily: "'JetBrains Mono', monospace",
          }}>
            {initials(name)}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14, color: c.text }}>{name}</div>
            <div style={{ fontSize: 11, color: c.textMuted, fontFamily: "'JetBrains Mono', monospace" }}>
              {inProg.length} active · {todo.length} todo · {done.length} done
              {unest.length > 0 && <span style={{ color: c.yellow }}> · {unest.length} unest.</span>}
            </div>
          </div>
        </div>
        {over && (
          <span style={{
            fontSize: 10, fontWeight: 700, color: c.red,
            background: c.redBg, padding: "2px 8px", borderRadius: 4,
            textTransform: "uppercase", letterSpacing: 0.5,
          }}>Over capacity</span>
        )}
      </div>

      <CapacityBar assigned={totalEst} capacity={capacity} />

      {expanded && (
        <>
          {issues.length > 0 && (
            <div style={{ marginTop: 14 }}>
              {sortedIssues.map((issue) => {
                const hasChildren = issue.children && issue.children.length > 0;
                const childrenOpen = !!expandedParents[issue.id];
                return (
                  <React.Fragment key={issue.id}>
                    <IssueRow
                      issue={issue}
                      c={c}
                      hasChildren={hasChildren}
                      childrenExpanded={childrenOpen}
                      onToggleChildren={() => toggleParent(issue.id)}
                    />
                    {hasChildren && childrenOpen && issue.children.map((child, idx) => (
                      <IssueRow
                        key={child.id}
                        issue={child}
                        c={c}
                        indent={1}
                        isLast={idx === issue.children.length - 1}
                      />
                    ))}
                  </React.Fragment>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
