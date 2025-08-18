import { AirdropService } from '@/services/airdrop.service';
import { Request, Response } from 'express';
import { Client } from 'pg';


export async function postAirdrop(req: Request, res: Response) {
  const account: string = req.params.account as string;
  const txHash: string = req.body.hash as string;


  if (!txHash) {
    return res.status(400).json({ error: "Transaction hash is required" });
  }
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    await client.connect();

    const result = await client.query(
      `
      UPDATE airdrop_recipients
      SET hash = $1
      WHERE address = $2
      RETURNING *;
      `,
      [txHash, account]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Account not found" });
    }

    return res.status(200).json({
      message: "Airdrop recipient updated successfully",
      recipient: result.rows[0],
    });
  } catch (error) {
    console.error("Error updating airdrop_recipients:", error);
    return res.status(500).json({ error: "Internal server error" });
  } finally {
    await client.end();
  }
}

export async function getAirdrop(req: Request, res: Response) {
  const account = req.params.account as string;

  if (!account) {
    return res.status(500).json({ error: 'Invalid request' });
  }
  try {
    const airdropService = new AirdropService();

    const client = new Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();

    const addrHex = account.startsWith('0x') ? account.slice(2).toLowerCase() : account.toLowerCase();
    const addrBuf = Buffer.from(addrHex, 'hex');

    const q = `
      SELECT a.id AS airdrop_id,
             a.label,
             ar.amount::text AS amount,
             ar.proof AS proof,
             ar.reasons AS reasons,
             '0x' || encode(ar.address,'hex') AS address_hex,
             '0x' || encode(ar.leaf,'hex') AS leaf_hex,
             '0x' || encode(a.root,'hex') AS root_hex,
             a.expiration_date AS expiration_date
      FROM airdrops a
      JOIN airdrop_recipients ar ON ar.airdrop_id = a.id
      WHERE ar.address = $1
      ORDER BY a.created_at DESC
      LIMIT 1
    `;

    const { rows } = await client.query(q, [addrBuf]);
    await client.end();

    if (!rows || rows.length === 0) {
      // no encontrado
      const response = {
        eligible: false,
        address: '0x0000000000000000000000000000000000000000',
        value: '0',
        proofs: [],
        claimed: false,
        reasons: [],
      };
      return res.status(200).json(response);
    }

    const row = rows[0];

    // Normalizar proof (bytea[] -> ['0x...'])
    let proofs: string[] = [];
    if (Array.isArray(row.proof)) {
      proofs = row.proof.map((p: any) => {
        if (Buffer.isBuffer(p)) return '0x' + p.toString('hex');
        if (typeof p === 'string') return p.startsWith('0x') ? p : '0x' + p;
        return String(p);
      });
    }

    const reasons: string[] = Array.isArray(row.reasons) ? row.reasons.map((r: any) => String(r)) : [];
    const amount = String(row.amount);

    const isClaimed = await airdropService.isAirdropClaimed(account, '0x471EcE3750Da237f93B8E339c536989b8978a438');

    const eligible = amount && amount !== '0';
    const response = eligible
      ? {
        eligible: true,
        address: row.address_hex,
        value: amount,
        proofs,
        claimed: isClaimed,
        reasons,
        expiration_date: row.expiration_date,
      }
      : {
        eligible: false,
        address: '0x0000000000000000000000000000000000000000',
        value: '0',
        proofs: [],
        claimed: false,
        reasons: [],
        expiration_date: row.expiration_date,
      };

    res.status(200).json(response);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
