"use client";

import { useState, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import styles from "./page.module.css";

type Square = "X" | "O" | null;
type Phase = "lobby" | "created" | "joining" | "reconnecting" | "game";

const WINNING_LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

function getWinner(squares: Square[]): { winner: Square; line: number[] } | null {
  for (const line of WINNING_LINES) {
    const [a, b, c] = line;
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return { winner: squares[a], line };
    }
  }
  return null;
}

const LS_ROOM_CODE  = "game_roomCode";
const LS_PLAYER     = "game_player";
const LS_SOCKET_ID  = "game_socketId";

function clearSession() {
  localStorage.removeItem(LS_ROOM_CODE);
  localStorage.removeItem(LS_PLAYER);
  localStorage.removeItem(LS_SOCKET_ID);
}

export default function GamePage() {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [phase, setPhase] = useState<Phase>("lobby");
  const [player, setPlayer] = useState<"X" | "O" | null>(null);
  const [roomCode, setRoomCode] = useState("");
  const [joinInput, setJoinInput] = useState("");
  const [joinError, setJoinError] = useState("");
  const [board, setBoard] = useState<Square[]>(Array(9).fill(null));
  const [currentTurn, setCurrentTurn] = useState<"X" | "O">("X");

  useEffect(() => {
    // Synchronously check localStorage before socket connects so the
    // "Reconnecting..." UI is shown immediately on F5.
    const savedCode     = localStorage.getItem(LS_ROOM_CODE);
    const savedPlayer   = localStorage.getItem(LS_PLAYER) as "X" | "O" | null;
    const savedSocketId = localStorage.getItem(LS_SOCKET_ID);

    if (savedCode && savedPlayer) {
      setRoomCode(savedCode);
      setPlayer(savedPlayer);
      setPhase("reconnecting");
    }

    async function init() {
      const res = await fetch("/api/auth/token");
      const { token } = await res.json();

      const socket = io("http://localhost:3000", {
        auth: { token: token ?? "" },
      });
      socketRef.current = socket;

      socket.on("connect", () => {
        setConnected(true);
        // Persist the new socketId for future fallback matching
        localStorage.setItem(LS_SOCKET_ID, socket.id!);

        // If we have a saved session, attempt to rejoin immediately
        if (savedCode && savedPlayer) {
          socket.emit(
            "rejoin_room",
            { roomCode: savedCode, oldSocketId: savedSocketId },
            (ack: { error?: string }) => {
              if (ack?.error) {
                clearSession();
                setPhase("lobby");
              }
              // Success: wait for "game_rejoined" event to transition phase
            },
          );
        }
      });

      socket.on("disconnect", () => setConnected(false));

      socket.on("game_start", (data: { board: Square[]; currentTurn: "X" | "O" }) => {
        setBoard(data.board);
        setCurrentTurn(data.currentTurn);
        setPhase("game");
      });

      socket.on("move_made", (data: { board: Square[]; currentTurn: "X" | "O" }) => {
        setBoard(data.board);
        setCurrentTurn(data.currentTurn);
      });

      socket.on(
        "game_rejoined",
        (data: { board: Square[]; currentTurn: "X" | "O"; player: "X" | "O" }) => {
          setBoard(data.board);
          setCurrentTurn(data.currentTurn);
          setPlayer(data.player);
          setPhase("game");
          console.log(`Rejoined room as ${data.player}`);
        },
      );
    }

    init();
    return () => { socketRef.current?.disconnect(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function persistSession(code: string, p: "X" | "O") {
    localStorage.setItem(LS_ROOM_CODE, code);
    localStorage.setItem(LS_PLAYER, p);
    if (socketRef.current?.id) {
      localStorage.setItem(LS_SOCKET_ID, socketRef.current.id);
    }
  }

  function handleCreateRoom() {
    socketRef.current?.emit(
      "create_room",
      {},
      (res: { roomCode: string; player: "X" | "O" }) => {
        setRoomCode(res.roomCode);
        setPlayer(res.player);
        setPhase("created");
        persistSession(res.roomCode, res.player);
      },
    );
  }

  function handleJoinRoom() {
    setJoinError("");
    socketRef.current?.emit(
      "join_room",
      { roomCode: joinInput },
      (res: { roomCode?: string; player?: "X" | "O"; error?: string }) => {
        if (res.error) {
          setJoinError(res.error);
        } else {
          setRoomCode(res.roomCode!);
          setPlayer(res.player!);
          persistSession(res.roomCode!, res.player!);
        }
      },
    );
  }

  const result = getWinner(board);
  const winner = result?.winner ?? null;
  const winningLine = result?.line ?? [];
  const isDraw = !winner && board.every(Boolean);

  let status: string;
  if (winner) {
    status = `Player ${winner} wins!`;
  } else if (isDraw) {
    status = "It's a draw!";
  } else if (currentTurn === player) {
    status = "Your turn";
  } else {
    status = "Waiting for opponent...";
  }

  function handleClick(index: number) {
    if (board[index] || winner || currentTurn !== player) return;
    socketRef.current?.emit("make_move", { roomCode, index, player });
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Tic-Tac-Toe</h1>

      <p>{connected ? "Connected to server ✅" : "Disconnected ❌"}</p>

      {phase === "lobby" && (
        <div className={styles.lobby}>
          <button className={styles.restart} onClick={handleCreateRoom}>
            Create Room
          </button>
          <button className={styles.restart} onClick={() => setPhase("joining")}>
            Join Room
          </button>
        </div>
      )}

      {phase === "reconnecting" && (
        <div className={styles.lobby}>
          <p className={styles.status}>Reconnecting to room {roomCode}...</p>
        </div>
      )}

      {phase === "created" && (
        <div className={styles.lobby}>
          <p className={styles.status}>You are Player X</p>
          <p className={styles.status}>
            Room code: <strong>{roomCode}</strong>
          </p>
          <p className={styles.status}>Waiting for opponent to join...</p>
        </div>
      )}

      {phase === "joining" && (
        <div className={styles.lobby}>
          <input
            className={styles.input}
            type="text"
            placeholder="Enter room code"
            value={joinInput}
            onChange={(e) => setJoinInput(e.target.value)}
          />
          <button className={styles.restart} onClick={handleJoinRoom}>
            Join
          </button>
          {joinError && <p className={styles.error}>{joinError}</p>}
        </div>
      )}

      {phase === "game" && (
        <>
          <div className={styles.players}>
            <div className={`${styles.player} ${!winner && !isDraw && currentTurn === "X" ? styles.active : ""}`}>
              <span className={styles.playerX}>X</span>
              <span>Player X{player === "X" ? " (you)" : ""}</span>
            </div>
            <div className={`${styles.player} ${!winner && !isDraw && currentTurn === "O" ? styles.active : ""}`}>
              <span className={styles.playerO}>O</span>
              <span>Player O{player === "O" ? " (you)" : ""}</span>
            </div>
          </div>

          <p className={`${styles.status} ${winner ? styles.winStatus : isDraw ? styles.drawStatus : ""}`}>
            {status}
          </p>

          <div className={styles.board}>
            {board.map((value, i) => {
              const isWinning = winningLine.includes(i);
              return (
                <button
                  key={i}
                  className={`${styles.square} ${value === "X" ? styles.squareX : value === "O" ? styles.squareO : ""} ${isWinning ? styles.winning : ""}`}
                  onClick={() => handleClick(i)}
                  aria-label={`Square ${i + 1}`}
                >
                  {value}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
