"use client";

import { useState } from "react";
import SnakeGame from "./SnakeGame";
import Leaderboard from "./Leaderboard";

export default function Home() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleScoreSubmit = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "16px",
        gap: "40px",
        flexWrap: "wrap",
      }}
    >
      <SnakeGame onScoreSubmit={handleScoreSubmit} />
      <Leaderboard refreshTrigger={refreshTrigger} />
    </main>
  );
}
