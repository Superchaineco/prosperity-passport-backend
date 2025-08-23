// src/controllers/account.controller.ts (bloque temporal simple)
import type { Request, Response } from "express";
import { pool } from "@/config/superChain/constants";
import { superChainAccountService } from "@/services/superChainAccount.service";


const RATE_DELAY_MS: number = 110; // ~9-10 req/s

function sleep(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms));
}

function normalizeEoaLower(input: string): string {
    const s: string = (input ?? "").trim().toLowerCase();
    return s ? (s.startsWith("0x") ? s : `0x${s}`) : s;
}

function sanitizeEoas(list: unknown): string[] {
    const arr: string[] = Array.isArray(list) ? (list as string[]) : [];
    const lowered: string[] = arr
        .filter((x) => typeof x === "string")
        .map((x) => normalizeEoaLower(x))
        .filter((x) => !!x);
    return Array.from(new Set(lowered)).sort();
}


async function getEOAS(address: string): Promise<string[]> {

    const raw = superChainAccountService.getEOAS(address);
    return sanitizeEoas(raw);
}

// ===== SQL helpers =====
async function selectAllAccounts(): Promise<string[]> {
    const client = await pool.connect();
    try {
        const sql: string = `SELECT account FROM public.users ORDER BY account`;
        const { rows } = await client.query<{ account: string }>(sql);
        return rows.map((r) => r.account);
    } finally {
        client.release();
    }
}

async function updateUserEOAs(account: string, eoas: string[]): Promise<void> {
    const client = await pool.connect();
    try {
        await client.query(
            `
      UPDATE public.users
      SET eoas = ARRAY(
        SELECT DISTINCT lower(e)
        FROM unnest($1::text[]) AS t(e)
        ORDER BY 1
      )
      WHERE lower(account) = lower($2)
      `,
            [eoas, account]
        );
    } finally {
        client.release();
    }
}

export async function postBackfillEOAsAll(
    _req: Request,
    res: Response<{
        processed: number;
        updated: number;
        failed: number;
        items: Array<{ account: string; fetched: number; updated: boolean; error?: string }>;
    }>
): Promise<void> {
    const accounts: string[] = await selectAllAccounts();

    const items: Array<{ account: string; fetched: number; updated: boolean; error?: string }> = [];
    let updatedCount: number = 0;
    let failedCount: number = 0;

    for (let i = 0; i < accounts.length; i++) {
        const account: string = accounts[i];

        // Simple rate limit: ~110ms entre requests
        if (i > 0) await sleep(RATE_DELAY_MS);

        try {
            const eoas: string[] = await getEOAS(account);
            await updateUserEOAs(account, eoas);
            items.push({ account, fetched: eoas.length, updated: true });
            updatedCount++;
        } catch (e) {
            items.push({
                account,
                fetched: 0,
                updated: false,
                error: e instanceof Error ? e.message : "unknown error",
            });
            failedCount++;
        }
    }

    res.status(200).json({
        processed: accounts.length,
        updated: updatedCount,
        failed: failedCount,
        items,
    });
}

