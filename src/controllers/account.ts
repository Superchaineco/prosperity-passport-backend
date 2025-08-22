// src/controllers/account.controller.ts (extracto)
import {
    getAccountByAddress,
    getAccountByUsername as repoGetByUsername,
    type AccountRecord,
    listAccountsByEOAs,
    countAccountsByEOAs,
} from "@/services/account.service";
import type { Request, Response } from "express";

/**
 * @openapi
 * components:
 *   securitySchemes:
 *     ApiKeyAuth:
 *       type: apiKey
 *       in: header
 *       name: x-api-key
 *   schemas:
 *     AccountRecord:
 *       type: object
 *       required: [account, eoas]
 *       properties:
 *         account:
 *           type: string
 *           description: Account identifier/address (primary key).
 *         nationality:
 *           type: string
 *           nullable: true
 *         username:
 *           type: string
 *           nullable: true
 *         eoas:
 *           type: array
 *           description: List of EOAs associated with the account.
 *           items:
 *             type: string
 *             pattern: '^0x[0-9a-fA-F]{40}$'
 *     AccountsPage:
 *       type: object
 *       required: [data, page, pageSize, total, totalPages]
 *       properties:
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/AccountRecord'
 *         page:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         pageSize:
 *           type: integer
 *           example: 100
 *         total:
 *           type: integer
 *           minimum: 0
 *         totalPages:
 *           type: integer
 *           minimum: 1
 *     Error:
 *       type: object
 *       required: [error]
 *       properties:
 *         error:
 *           type: string
 */
/**
 * @openapi
 * /account/by-address/{address}:
 *   get:
 *     tags: [accounts]
 *     summary: Retrieve an account by address (case-insensitive).
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *         description: Account address.
 *     responses:
 *       '200':
 *         description: Account found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AccountRecord'
 *       '400':
 *         description: Missing or invalid parameters.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       '404':
 *         description: Not found.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       '500':
 *         description: Server error.
 */

// GET /accounts/:address
export async function getAccount(
    req: Request<{ address: string }>,
    res: Response<AccountRecord | { error: string }>
): Promise<void> {
    const address = (req.params.address ?? "").trim();
    if (!address) {
        res.status(400).json({ error: "address is required" });
        return;
    }
    const row = await getAccountByAddress(address);
    row ? res.status(200).json(row) : res.status(404).json({ error: "account not found" });
}

/**
 * @openapi
 * /account/by-username/{username}:
 *   get:
 *     tags: [accounts]
 *     summary: Retrieve an account by username (case-insensitive).
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Account found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AccountRecord'
 *       '400':
 *         description: Missing or invalid parameters.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       '404':
 *         description: Not found.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       '500':
 *         description: Server error.
 */

// GET /accounts/by-username/:username
export async function getAccountByUsername(
    req: Request<{ username: string }>,
    res: Response<AccountRecord | { error: string }>
): Promise<void> {
    const username = (req.params.username ?? "").trim();
    if (!username) {
        res.status(400).json({ error: "username is required" });
        return;
    }
    const row = await repoGetByUsername(username);
    row ? res.status(200).json(row) : res.status(404).json({ error: "account not found" });
}


/**
 * @openapi
 * /accounts/by-eoas:
 *   post:
 *     tags: [accounts]
 *     summary: List accounts that contain at least one of the given EOAs (paginated by 100).
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [eoas]
 *             properties:
 *               eoas:
 *                 type: array
 *                 minItems: 1
 *                 maxItems: 5000
 *                 items:
 *                   type: string
 *                   pattern: '^0x[0-9a-fA-F]{40}$'
 *               page:
 *                 type: integer
 *                 minimum: 1
 *                 default: 1
 *           examples:
 *             sample:
 *               value:
 *                 eoas:
 *                   - '0x9ae4F0f0FFF687eBf7B3d2277F0064103A7DC46b'
 *                   - '0x66f9a27957Af42465d3A3f1FC2AE5d446Bc75775'
 *                 page: 1
 *     responses:
 *       '200':
 *         description: Paginated result.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AccountsPage'
 *       '400':
 *         description: Bad request.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       '413':
 *         description: Payload too large.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       '500':
 *         description: Server error.
 */

export async function postAccountsByEOAs(
  req: Request<unknown, unknown, { eoas?: unknown; page?: unknown }>,
  res: Response<
    | { data: AccountRecord[]; page: number; pageSize: number; total: number; totalPages: number }
    | { error: string }
  >
): Promise<void> {
  const body = req.body ?? {};
  if (!Array.isArray(body.eoas) || body.eoas.length === 0) {
    res.status(400).json({ error: "body.eoas (string[]) is required" });
    return;
  }

  const eoas: string[] = body.eoas
    .filter((x: unknown): x is string => typeof x === "string")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const rawPage = body.page;
  const pageParsed =
    typeof rawPage === "number" ? rawPage : typeof rawPage === "string" ? Number.parseInt(rawPage, 10) : 1;
  const page = Number.isFinite(pageParsed) && pageParsed > 0 ? Math.floor(pageParsed) : 1;

  const [data, total] = await Promise.all([
    listAccountsByEOAs(eoas, page),
    countAccountsByEOAs(eoas),
  ]);

  const pageSize = 100;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  res.status(200).json({ data, page, pageSize, total, totalPages });
}