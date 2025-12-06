"use client";

import { useEffect, useState } from "react";

type LeaderboardEntry = {
  name: string;
  score: number;
  date: string;
};

type LeaderboardProps = {
  refreshTrigger: number;
};

export default function Leaderboard({ refreshTrigger }: LeaderboardProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        const res = await fetch("/api/leaderboard");
        if (res.ok) {
          const data = await res.json();
          setEntries(data);
        }
      } catch (err) {
        console.error("Failed to fetch leaderboard:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchLeaderboard();
  }, [refreshTrigger]);

  return (
    <div
      style={{
        backgroundColor: "rgba(15, 15, 35, 0.9)",
        border: "2px solid #4ecca3",
        borderRadius: "8px",
        padding: "20px",
        minWidth: "250px",
        maxHeight: "500px",
        overflowY: "auto",
      }}
    >
      <h2
        style={{
          color: "#4ecca3",
          fontSize: "1.5rem",
          marginBottom: "15px",
          textAlign: "center",
          textShadow: "0 0 10px rgba(78, 204, 163, 0.5)",
        }}
      >
        Leaderboard
      </h2>

      {loading ? (
        <p style={{ color: "#888", textAlign: "center" }}>Laden...</p>
      ) : entries.length === 0 ? (
        <p style={{ color: "#888", textAlign: "center" }}>
          Noch keine Einträge
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {entries.map((entry, index) => (
            <div
              key={`${entry.name}-${entry.date}`}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "8px 12px",
                backgroundColor:
                  index === 0
                    ? "rgba(255, 215, 0, 0.15)"
                    : index === 1
                      ? "rgba(192, 192, 192, 0.15)"
                      : index === 2
                        ? "rgba(205, 127, 50, 0.15)"
                        : "rgba(78, 204, 163, 0.1)",
                borderRadius: "4px",
                borderLeft: `3px solid ${
                  index === 0
                    ? "#ffd700"
                    : index === 1
                      ? "#c0c0c0"
                      : index === 2
                        ? "#cd7f32"
                        : "#4ecca3"
                }`,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span
                  style={{
                    color:
                      index === 0
                        ? "#ffd700"
                        : index === 1
                          ? "#c0c0c0"
                          : index === 2
                            ? "#cd7f32"
                            : "#888",
                    fontWeight: "bold",
                    minWidth: "24px",
                  }}
                >
                  {index + 1}.
                </span>
                <span style={{ color: "#fff" }}>{entry.name}</span>
              </div>
              <span
                style={{
                  color: "#4ecca3",
                  fontWeight: "bold",
                }}
              >
                {entry.score}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
