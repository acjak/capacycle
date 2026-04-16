import React, { useState, useRef, useEffect, useCallback } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useTheme } from "../theme.jsx";
import { useBoardSocket, useDemoBoard } from "../socket.js";
import { useAuth } from "../AuthContext.jsx";
import { isDemoMode } from "../api.js";

const MONO = "'JetBrains Mono', 'SF Mono', monospace";
const SANS = "'DM Sans', system-ui, sans-serif";

const PRESETS = [
  { id: "retrospective", label: "Retrospective" },
  { id: "planning", label: "Planning" },
  { id: "custom", label: "Custom" },
];

function CardItem({ card, index, c, onVote, onDelete, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(card.text);
  const inputRef = useRef(null);

  const startEdit = (e) => {
    e.stopPropagation();
    setEditText(card.text);
    setEditing(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const saveEdit = () => {
    const trimmed = editText.trim();
    if (trimmed && trimmed !== card.text) {
      onUpdate(card.id, trimmed);
    }
    setEditing(false);
  };

  return (
    <Draggable draggableId={card.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={{
            background: snapshot.isDragging ? c.accentBg : c.bg,
            border: `1px solid ${c.border}`,
            borderRadius: 6,
            padding: "10px 12px",
            marginBottom: 8,
            fontSize: 13,
            color: c.text,
            position: "relative",
            ...provided.draggableProps.style,
          }}
        >
          {editing ? (
            <textarea
              ref={inputRef}
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onBlur={saveEdit}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); saveEdit(); }
                if (e.key === "Escape") setEditing(false);
              }}
              style={{
                width: "100%", border: "none", background: "transparent", color: c.text,
                fontSize: 13, fontFamily: SANS, resize: "vertical", outline: "none",
                minHeight: 40,
              }}
            />
          ) : (
            <div onClick={startEdit} style={{ cursor: "text", whiteSpace: "pre-wrap", minHeight: 20 }}>
              {card.text}
            </div>
          )}
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            marginTop: 8, fontSize: 12,
          }}>
            <button
              onClick={(e) => { e.stopPropagation(); onVote(card.id); }}
              style={{
                background: card.myVote ? `${c.accent}22` : "transparent",
                border: `1px solid ${card.myVote ? c.accent : c.border}`,
                borderRadius: 4, padding: "2px 8px", cursor: "pointer",
                color: card.myVote ? c.accent : c.textMuted, fontSize: 12,
                fontFamily: MONO, display: "flex", alignItems: "center", gap: 4,
              }}
            >
              <span style={{ fontSize: 10 }}>{card.myVote ? "\u25C6" : "\u25C7"}</span>
              {card.votes > 0 && card.votes}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(card.id); }}
              style={{
                background: "transparent", border: "none", cursor: "pointer",
                color: c.textDim, fontSize: 14, padding: "0 4px",
                opacity: 0.4, transition: "opacity 0.15s",
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
              onMouseLeave={(e) => e.currentTarget.style.opacity = 0.4}
              title="Delete card"
            >
              &times;
            </button>
          </div>
        </div>
      )}
    </Draggable>
  );
}

function AddCardInput({ c, onAdd }) {
  const [active, setActive] = useState(false);
  const [text, setText] = useState("");
  const inputRef = useRef(null);

  const submit = () => {
    const trimmed = text.trim();
    if (trimmed) {
      onAdd(trimmed);
      setText("");
    }
    setActive(false);
  };

  if (!active) {
    return (
      <button
        onClick={() => { setActive(true); setTimeout(() => inputRef.current?.focus(), 0); }}
        style={{
          width: "100%", background: "transparent", border: `1px dashed ${c.border}`,
          borderRadius: 6, padding: "8px 12px", color: c.textMuted, fontSize: 12,
          cursor: "pointer", textAlign: "left", fontFamily: SANS,
        }}
      >
        + Add card
      </button>
    );
  }

  return (
    <div>
      <textarea
        ref={inputRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); }
          if (e.key === "Escape") { setText(""); setActive(false); }
        }}
        placeholder="Type and press Enter..."
        style={{
          width: "100%", border: `1px solid ${c.border}`, background: c.bg,
          borderRadius: 6, padding: "8px 12px", color: c.text, fontSize: 13,
          fontFamily: SANS, resize: "none", outline: "none", minHeight: 60,
          boxSizing: "border-box",
        }}
      />
      <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
        <button onClick={submit} style={{
          background: c.accent, border: "none", borderRadius: 4,
          padding: "4px 12px", color: "#fff", fontSize: 11, cursor: "pointer",
        }}>Add</button>
        <button onClick={() => { setText(""); setActive(false); }} style={{
          background: "transparent", border: `1px solid ${c.border}`, borderRadius: 4,
          padding: "4px 12px", color: c.textMuted, fontSize: 11, cursor: "pointer",
        }}>Cancel</button>
      </div>
    </div>
  );
}

function ColumnHeader({ col, c, onRename, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(col.title);
  const inputRef = useRef(null);

  const save = () => {
    const trimmed = title.trim();
    if (trimmed && trimmed !== col.title) onRename(col.id, trimmed);
    setEditing(false);
  };

  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      marginBottom: 12, padding: "0 2px",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
        {col.color && (
          <div style={{
            width: 10, height: 10, borderRadius: "50%", background: col.color, flexShrink: 0,
          }} />
        )}
        {editing ? (
          <input
            ref={inputRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={save}
            onKeyDown={(e) => {
              if (e.key === "Enter") save();
              if (e.key === "Escape") setEditing(false);
            }}
            style={{
              border: `1px solid ${c.border}`, background: c.bg, borderRadius: 4,
              padding: "2px 6px", fontSize: 13, fontWeight: 600, color: c.text,
              outline: "none", width: "100%",
            }}
          />
        ) : (
          <span
            onClick={() => { setEditing(true); setTimeout(() => inputRef.current?.focus(), 0); }}
            style={{
              fontSize: 13, fontWeight: 600, color: c.textSecondary, cursor: "text",
              textTransform: "uppercase", letterSpacing: 0.5,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}
          >
            {col.title}
          </span>
        )}
        <span style={{ fontSize: 11, color: c.textDim, fontFamily: MONO, flexShrink: 0 }}>
          {col.cards.length}
        </span>
      </div>
      <button
        onClick={() => onDelete(col.id)}
        style={{
          background: "transparent", border: "none", cursor: "pointer",
          color: c.textDim, fontSize: 14, padding: "0 4px",
          opacity: 0.3, transition: "opacity 0.15s",
        }}
        onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
        onMouseLeave={(e) => e.currentTarget.style.opacity = 0.3}
        title="Delete column"
      >
        &times;
      </button>
    </div>
  );
}

function PreviousActions({ teamId, cycleId, previousCycleId, c }) {
  const [items, setItems] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (!previousCycleId || isDemoMode()) return;
    (async () => {
      try {
        const res = await fetch(`/api/board/${teamId}/${cycleId}/previous-actions?previousCycleId=${previousCycleId}`);
        if (res.ok) setItems(await res.json());
      } catch {}
      setLoaded(true);
    })();
  }, [teamId, cycleId, previousCycleId]);

  const toggleResolve = useCallback(async (cardId, resolved) => {
    setItems((prev) => prev.map((i) => i.id === cardId ? { ...i, resolved } : i));
    try {
      await fetch(`/api/action-items/${cardId}/resolve`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cycleId, resolved }),
      });
    } catch {}
  }, [cycleId]);

  if (!loaded || items.length === 0) return null;

  const resolved = items.filter((i) => i.resolved).length;

  return (
    <div style={{
      background: c.card, border: `1px solid ${c.border}`, borderRadius: 8,
      padding: "14px 16px", marginBottom: 14,
    }}>
      <div
        onClick={() => setCollapsed((v) => !v)}
        style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          cursor: "pointer",
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 600, color: c.textSecondary }}>
          Follow-up from previous cycle
          <span style={{ fontFamily: MONO, fontSize: 11, color: c.textMuted, marginLeft: 8 }}>
            {resolved}/{items.length} resolved
          </span>
        </div>
        <span style={{ fontSize: 10, color: c.textDim }}>{collapsed ? "\u25B6" : "\u25BC"}</span>
      </div>
      {!collapsed && (
        <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
          {items.map((item) => (
            <div key={item.id} style={{
              display: "flex", gap: 10, alignItems: "flex-start",
              padding: "6px 0", borderBottom: `1px solid ${c.divider}`,
            }}>
              <input
                type="checkbox"
                checked={item.resolved}
                onChange={(e) => toggleResolve(item.id, e.target.checked)}
                style={{ marginTop: 2, accentColor: c.accent, cursor: "pointer" }}
              />
              <span style={{
                fontSize: 13, color: item.resolved ? c.textDim : c.text,
                textDecoration: item.resolved ? "line-through" : "none",
                lineHeight: 1.4,
              }}>{item.text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function KanbanBoard({ teamId, cycleId, demo = false, previousCycleId = null }) {
  const { colors: c } = useTheme();
  const { auth } = useAuth();
  const userId = auth && typeof auth === "object" ? auth.user?.id : null;
  const socketHook = useBoardSocket(demo ? null : teamId, demo ? null : cycleId, userId);
  const demoHook = useDemoBoard(teamId, cycleId);
  const { board, connected, emit, voterId } = demo ? demoHook : socketHook;
  const [confirmReset, setConfirmReset] = useState(null);

  if (!cycleId) {
    return <div style={{ textAlign: "center", padding: 40, color: c.textMuted, fontSize: 13 }}>No cycle available.</div>;
  }

  if (!board) {
    return <div style={{ textAlign: "center", padding: 40, color: c.textMuted, fontSize: 13 }}>Loading board...</div>;
  }

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const { draggableId, destination } = result;
    const destCol = board.columns.find((col) => col.id === destination.droppableId);
    if (!destCol) return;

    // Compute new position
    const destCards = destCol.cards.filter((c) => c.id !== draggableId);
    let newPosition;
    if (destCards.length === 0) {
      newPosition = 0;
    } else if (destination.index === 0) {
      newPosition = destCards[0].position - 1;
    } else if (destination.index >= destCards.length) {
      newPosition = destCards[destCards.length - 1].position + 1;
    } else {
      newPosition = (destCards[destination.index - 1].position + destCards[destination.index].position) / 2;
    }

    emit("move-card", { cardId: draggableId, newColumnId: destination.droppableId, newPosition });
  };

  const handleAddCard = (columnId, text) => {
    emit("add-card", { columnId, boardId: board.id, text });
  };

  const handleDeleteCard = (cardId) => {
    emit("delete-card", { cardId });
  };

  const handleUpdateCard = (cardId, text) => {
    emit("update-card", { cardId, text });
  };

  const handleVote = (cardId) => {
    // Server derives voterId from session; client just sends cardId
    emit("toggle-vote", { cardId });
  };

  const handleAddColumn = () => {
    emit("add-column", { boardId: board.id, title: "New column", color: null });
  };

  const handleRenameColumn = (columnId, title) => {
    const col = board.columns.find((c) => c.id === columnId);
    if (col) emit("update-column", { columnId, title, position: col.position, color: col.color });
  };

  const handleDeleteColumn = (columnId) => {
    emit("delete-column", { columnId });
  };

  const handlePreset = (preset) => {
    if (board.columns.some((col) => col.cards.length > 0)) {
      setConfirmReset(preset);
    } else {
      emit("reset-board", { teamId, cycleId, preset });
    }
  };

  return (
    <div>
      {/* Preset selector */}
      <div style={{ display: "flex", gap: 6, marginBottom: 14, alignItems: "center" }}>
        <span style={{ fontSize: 11, color: c.textMuted, marginRight: 4 }}>Preset:</span>
        {PRESETS.map((p) => (
          <button key={p.id} onClick={() => handlePreset(p.id)} style={{
            background: board.preset === p.id ? c.accentBg : c.card,
            border: `1px solid ${board.preset === p.id ? c.accent : c.border}`,
            borderRadius: 5, padding: "4px 10px", fontSize: 11,
            color: board.preset === p.id ? c.accent : c.textMuted,
            cursor: "pointer", fontFamily: MONO,
          }}>{p.label}</button>
        ))}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={handleAddColumn} style={{
            background: c.card, border: `1px solid ${c.border}`, borderRadius: 5,
            padding: "4px 10px", fontSize: 11, color: c.textMuted, cursor: "pointer",
          }}>+ Column</button>
          {!connected && (
            <span style={{ fontSize: 10, color: c.red }}>disconnected</span>
          )}
        </div>
      </div>

      {/* Reset confirmation */}
      {confirmReset && (
        <div style={{
          background: c.card, border: `1px solid ${c.border}`, borderRadius: 8,
          padding: "12px 16px", marginBottom: 14, display: "flex", alignItems: "center",
          justifyContent: "space-between",
        }}>
          <span style={{ fontSize: 12, color: c.text }}>
            Reset board to <strong>{confirmReset}</strong> preset? This will delete all cards.
          </span>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => { emit("reset-board", { teamId, cycleId, preset: confirmReset }); setConfirmReset(null); }}
              style={{
                background: c.red, border: "none", borderRadius: 4,
                padding: "4px 12px", color: "#fff", fontSize: 11, cursor: "pointer",
              }}>Reset</button>
            <button onClick={() => setConfirmReset(null)} style={{
              background: "transparent", border: `1px solid ${c.border}`, borderRadius: 4,
              padding: "4px 12px", color: c.textMuted, fontSize: 11, cursor: "pointer",
            }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Previous cycle action items */}
      {board.preset === "retrospective" && previousCycleId && (
        <PreviousActions teamId={teamId} cycleId={cycleId} previousCycleId={previousCycleId} c={c} />
      )}

      {/* Board */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div style={{
          display: "flex", gap: 12, overflowX: "auto", paddingBottom: 8,
          minHeight: 300,
        }}>
          {board.columns.map((col) => (
            <div key={col.id} style={{
              background: c.card, border: `1px solid ${c.border}`, borderRadius: 8,
              padding: "14px 12px", minWidth: 260, maxWidth: 320, flex: "1 0 260px",
              display: "flex", flexDirection: "column",
            }}>
              <ColumnHeader col={col} c={c} onRename={handleRenameColumn} onDelete={handleDeleteColumn} />
              <Droppable droppableId={col.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    style={{
                      flex: 1, minHeight: 40,
                      background: snapshot.isDraggingOver ? `${c.accent}08` : "transparent",
                      borderRadius: 6, transition: "background 0.15s",
                    }}
                  >
                    {col.cards.map((card, idx) => (
                      <CardItem
                        key={card.id}
                        card={card}
                        index={idx}
                        c={c}
                        onVote={handleVote}
                        onDelete={handleDeleteCard}
                        onUpdate={handleUpdateCard}
                      />
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
              <div style={{ marginTop: 8 }}>
                <AddCardInput c={c} onAdd={(text) => handleAddCard(col.id, text)} />
              </div>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}
