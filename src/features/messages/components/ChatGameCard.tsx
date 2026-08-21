"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Gamepad2, RotateCcw, Trophy, Sparkles } from "lucide-react";

export interface ChatGameCardProps {
  gameType?: "tictactoe" | "quiz";
  player1Name: string;
  player2Name: string;
  isMyTurn: boolean;
  onMove?: (boardState: Array<string | null>, winner: string | null) => void;
}

export function ChatGameCard({
  gameType = "tictactoe",
  player1Name,
  player2Name,
  isMyTurn = true,
  onMove,
}: ChatGameCardProps) {
  const [board, setBoard] = useState<Array<string | null>>(Array(9).fill(null));
  const [turn, setTurn] = useState<"X" | "O">("X");
  const [winner, setWinner] = useState<string | null>(null);

  const checkWinner = (b: Array<string | null>) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ];
    for (let i = 0; i < lines.length; i++) {
      const [a, c, d] = lines[i];
      if (b[a] && b[a] === b[c] && b[a] === b[d]) {
        return b[a];
      }
    }
    if (b.every((cell) => cell !== null)) return "DRAW";
    return null;
  };

  const handleCellClick = (index: number) => {
    if (board[index] || winner) return;

    const newBoard = [...board];
    newBoard[index] = turn;
    setBoard(newBoard);

    const winResult = checkWinner(newBoard);
    if (winResult) {
      setWinner(winResult);
    } else {
      setTurn(turn === "X" ? "O" : "X");
    }

    if (onMove) {
      onMove(newBoard, winResult);
    }
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setTurn("X");
    setWinner(null);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 12,
        padding: "16px 20px",
        backgroundColor: "rgba(13, 16, 23, 0.95)",
        border: "1px solid rgba(0, 242, 254, 0.35)",
        borderRadius: 20,
        boxShadow: "0 10px 30px rgba(0, 242, 254, 0.2)",
        maxWidth: 320,
        margin: "10px auto",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyBetween: "space-between", width: "100%" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              backgroundColor: "rgba(0, 242, 254, 0.15)",
              border: "1px solid rgba(0, 242, 254, 0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#00f2fe",
            }}
          >
            <Gamepad2 size={18} />
          </div>
          <span style={{ fontSize: "0.88rem", fontWeight: 800, color: "#ffffff" }}>
            1v1 Tic-Tac-Toe
          </span>
        </div>

        <button
          onClick={resetGame}
          style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", padding: 4 }}
          title="Restart Game"
        >
          <RotateCcw size={16} />
        </button>
      </div>

      {/* Players Turn Subhead */}
      <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#94a3b8", display: "flex", gap: 12 }}>
        <span style={{ color: turn === "X" ? "#00f2fe" : "#64748b" }}>❌ {player1Name}</span>
        <span>vs</span>
        <span style={{ color: turn === "O" ? "#ef4444" : "#64748b" }}>⭕ {player2Name}</span>
      </div>

      {/* 3x3 Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 8,
          width: "100%",
        }}
      >
        {board.map((val, idx) => (
          <motion.button
            key={idx}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleCellClick(idx)}
            style={{
              height: 64,
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              borderRadius: 14,
              fontSize: "1.6rem",
              fontWeight: 900,
              color: val === "X" ? "#00f2fe" : "#ef4444",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: val || winner ? "default" : "pointer",
            }}
          >
            {val}
          </motion.button>
        ))}
      </div>

      {/* Result Status */}
      {winner && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          style={{
            marginTop: 4,
            padding: "6px 14px",
            backgroundColor: "rgba(0, 242, 254, 0.15)",
            border: "1px solid rgba(0, 242, 254, 0.4)",
            borderRadius: 9999,
            color: "#00f2fe",
            fontSize: "0.82rem",
            fontWeight: 800,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <Trophy size={16} /> {winner === "DRAW" ? "It's a Draw! 🤝" : `${winner === "X" ? player1Name : player2Name} Wins! 🎉`}
        </motion.div>
      )}
    </div>
  );
}
