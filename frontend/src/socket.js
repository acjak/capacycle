import { useState, useEffect, useCallback, useRef } from "react";
import { io } from "socket.io-client";

function getVoterId() {
  let id = localStorage.getItem("boardVoterId");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("boardVoterId", id);
  }
  return id;
}

export function useBoardSocket(teamId, cycleId) {
  const [board, setBoard] = useState(null);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);
  const voterId = useRef(getVoterId()).current;

  useEffect(() => {
    if (!teamId || !cycleId) return;

    const socket = io({ transports: ["websocket", "polling"] });
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("join-board", { teamId, cycleId, voterId });
      // Fetch full board state via REST
      fetch(`/api/board/${teamId}/${cycleId}?voterId=${voterId}`)
        .then((r) => r.json())
        .then((data) => setBoard(data))
        .catch(console.error);
    });

    socket.on("disconnect", () => setConnected(false));

    socket.on("card-added", (card) => {
      setBoard((b) => {
        if (!b) return b;
        return {
          ...b,
          columns: b.columns.map((col) =>
            col.id === card.column_id
              ? { ...col, cards: [...col.cards, card] }
              : col
          ),
        };
      });
    });

    socket.on("card-updated", (card) => {
      setBoard((b) => {
        if (!b) return b;
        return {
          ...b,
          columns: b.columns.map((col) => ({
            ...col,
            cards: col.cards.map((c) => (c.id === card.id ? { ...c, text: card.text } : c)),
          })),
        };
      });
    });

    socket.on("card-moved", (card) => {
      setBoard((b) => {
        if (!b) return b;
        // Remove from old column, add to new
        let movedCard = null;
        const withoutCard = b.columns.map((col) => {
          const found = col.cards.find((c) => c.id === card.id);
          if (found) movedCard = { ...found, column_id: card.column_id, position: card.position };
          return { ...col, cards: col.cards.filter((c) => c.id !== card.id) };
        });
        if (!movedCard) return b;
        return {
          ...b,
          columns: withoutCard.map((col) =>
            col.id === card.column_id
              ? { ...col, cards: [...col.cards, movedCard].sort((a, c) => a.position - c.position) }
              : col
          ),
        };
      });
    });

    socket.on("card-deleted", ({ cardId }) => {
      setBoard((b) => {
        if (!b) return b;
        return {
          ...b,
          columns: b.columns.map((col) => ({
            ...col,
            cards: col.cards.filter((c) => c.id !== cardId),
          })),
        };
      });
    });

    socket.on("vote-updated", ({ cardId, count, voted, voterId: eventVoterId }) => {
      setBoard((b) => {
        if (!b) return b;
        return {
          ...b,
          columns: b.columns.map((col) => ({
            ...col,
            cards: col.cards.map((c) =>
              c.id === cardId
                ? { ...c, votes: count, myVote: eventVoterId === voterId ? voted : c.myVote }
                : c
            ),
          })),
        };
      });
    });

    socket.on("column-added", (col) => {
      setBoard((b) => {
        if (!b) return b;
        return { ...b, columns: [...b.columns, { ...col, cards: [] }] };
      });
    });

    socket.on("column-updated", (col) => {
      setBoard((b) => {
        if (!b) return b;
        return {
          ...b,
          columns: b.columns
            .map((c) => (c.id === col.id ? { ...c, title: col.title, position: col.position, color: col.color } : c))
            .sort((a, c) => a.position - c.position),
        };
      });
    });

    socket.on("column-deleted", ({ columnId }) => {
      setBoard((b) => {
        if (!b) return b;
        return { ...b, columns: b.columns.filter((c) => c.id !== columnId) };
      });
    });

    socket.on("board-reset", (newBoard) => {
      setBoard(newBoard);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [teamId, cycleId, voterId]);

  const emit = useCallback((event, data) => {
    socketRef.current?.emit(event, data);
  }, []);

  return { board, connected, emit, voterId };
}
