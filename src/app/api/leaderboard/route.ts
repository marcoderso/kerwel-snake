import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

const LEADERBOARD_KEY = "leaderboard";

type LeaderboardEntry = {
  name: string;
  score: number;
  date: string;
};

export async function GET() {
  const entries = await redis.get<LeaderboardEntry[]>(LEADERBOARD_KEY);
  const sorted = (entries ?? []).sort((a, b) => b.score - a.score);
  return NextResponse.json(sorted);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { name, score } = body;

  if (!name || typeof score !== "number" || score <= 0) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const entries = (await redis.get<LeaderboardEntry[]>(LEADERBOARD_KEY)) ?? [];
  const newEntry: LeaderboardEntry = {
    name: name.trim().slice(0, 20),
    score,
    date: new Date().toISOString(),
  };

  entries.push(newEntry);
  entries.sort((a, b) => b.score - a.score);

  await redis.set(LEADERBOARD_KEY, entries);

  return NextResponse.json(newEntry, { status: 201 });
}
