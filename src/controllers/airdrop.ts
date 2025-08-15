import { AirdropService } from '@/services/airdrop.service';
import { Request, Response } from 'express';
import { Client } from 'pg';

export async function getAirdrop(req: Request, res: Response) {
  const account = req.params.account as string;

  if (!account) {
    return res.status(500).json({ error: 'Invalid request' });
  }
  try {
    const airdropService = new AirdropService();

    // Conectar a Postgres y leer las tablas airdrops / airdrop_recipients
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
             '0x' || encode(a.root,'hex') AS root_hex
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
        }
      : {
          eligible: false,
          address: '0x0000000000000000000000000000000000000000',
          value: '0',
          proofs: [],
          claimed: false,
          reasons: [],
        };

    res.status(200).json(response);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
