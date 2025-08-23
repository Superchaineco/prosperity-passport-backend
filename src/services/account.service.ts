// src/data/accounts.repo.ts
import { pool } from "@/config/superChain/constants";

export interface AccountRecord {
  account: string;
  nationality: string | null;
  username: string | null;
  eoas: string[];
  level: number;
  noun: any;
  total_points: number;
  total_badges: number;
}



export async function getAccountByAddress(account: string): Promise<AccountRecord | null> {
  const client = await pool.connect();
  try {
    const sql = `
      SELECT account, nationality, username, eoas,level,noun,total_points,total_badges
      FROM users
      WHERE LOWER(account) = LOWER($1)
      LIMIT 1
    `;
    const params: [string] = [account?.trim() ?? ""];
    const { rows } = await client.query<AccountRecord>(sql, params);
    return rows[0] ?? null;
  } finally {
    client.release();
  }
}


export async function getAccountByUsername(username: string): Promise<AccountRecord | null> {
  const client = await pool.connect();
  try {
    const sql = `
      SELECT account, nationality, username, eoas,level,noun,total_points,total_badges
      FROM users
      WHERE LOWER(username) = LOWER($1)
      LIMIT 1
    `;
    const params: [string] = [username?.trim() ?? ""];
    const { rows } = await client.query<AccountRecord>(sql, params);
    return rows[0] ?? null;
  } finally {
    client.release();
  }
}


function normalizeEoaLower(input: string): string {
  const s: string = (input ?? "").trim().toLowerCase();
  return s.startsWith("0x") ? s : `0x${s}`;
}

export async function listAccountsByEOAs(eoas: string[], page: number): Promise<AccountRecord[]> {
  const needles: string[] = Array.from(
    new Set((eoas ?? [])
      .map(normalizeEoaLower)
      .filter((s): s is string => !!s))
  );

  if (needles.length === 0) return [];

  const PAGE_SIZE: number = 100;
  const safePage: number = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const offset: number = (safePage - 1) * PAGE_SIZE;

  const client = await pool.connect();
  try {
    const sql: string = `
      SELECT account, nationality, username, eoas,level,noun,total_points,total_badges
      FROM users
      WHERE eoas && $1::text[]      
      ORDER BY account ASC
      OFFSET $2
      LIMIT $3
    `;
    const { rows } = await client.query<AccountRecord>(sql, [needles, offset, PAGE_SIZE]);
    return rows;
  } finally {
    client.release();
  }
}

export async function countAccountsByEOAs(eoas: string[]): Promise<number> {
  const needles: string[] = Array.from(
    new Set((eoas ?? [])
      .map(normalizeEoaLower)
      .filter((s): s is string => !!s))
  );

  if (needles.length === 0) return 0;

  const client = await pool.connect();
  try {
    const sql: string = `SELECT count(*)::int AS c FROM users WHERE eoas && $1::text[]`;
    const { rows } = await client.query<{ c: number }>(sql, [needles]);
    return rows[0]?.c ?? 0;
  } finally {
    client.release();
  }
}