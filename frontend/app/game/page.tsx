"use client";

import { useState, useEffect } from "react";
import { io, Socket } from "socket.io-client";
import styles from "./page.module.css";

type Square = "X" | "O" | null;

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

export default function GamePage() {
  const [connected, setConnected] = useState(false);
  const [squares, setSquares] = useState<Square[]>(Array(9).fill(null));
  const [xIsNext, setXIsNext] = useState(true);

  useEffect(() => {
    const socket: Socket = io("http://localhost:3000");
    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    return () => { socket.disconnect(); };
  }, []);

  const result = getWinner(squares);
  const winner = result?.winner ?? null;
  const winningLine = result?.line ?? [];
  const isDraw = !winner && squares.every(Boolean);

  function handleClick(index: number) {
    if (squares[index] || winner) return;
    const next = squares.slice();
    next[index] = xIsNext ? "X" : "O";
    setSquares(next);
    setXIsNext(!xIsNext);
  }

  function restart() {
    setSquares(Array(9).fill(null));
    setXIsNext(true);
  }

  let status: string;
  if (winner) {
    status = `Player ${winner} wins!`;
  } else if (isDraw) {
    status = "It's a draw!";
  } else {
    status = `Player ${xIsNext ? "X" : "O"}'s turn`;
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Tic-Tac-Toe</h1>

      <p>{connected ? "Connected to server ✅" : "Disconnected ❌"}</p>

      <div className={styles.players}>
        <div className={`${styles.player} ${!winner && !isDraw && xIsNext ? styles.active : ""}`}>
          <span className={styles.playerX}>X</span>
          <span>Player X</span>
        </div>
        <div className={`${styles.player} ${!winner && !isDraw && !xIsNext ? styles.active : ""}`}>
          <span className={styles.playerO}>O</span>
          <span>Player O</span>
        </div>
      </div>

      <p className={`${styles.status} ${winner ? styles.winStatus : isDraw ? styles.drawStatus : ""}`}>
        {status}
      </p>

      <div className={styles.board}>
        {squares.map((value, i) => {
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

      <button className={styles.restart} onClick={restart}>
        Restart
      </button>
    </div>
  );
}
