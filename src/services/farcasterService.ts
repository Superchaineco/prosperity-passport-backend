import { pool } from "@/config/superChain/constants"




export interface Farcaster {
    account: string
    fid: string
    signature: any
}

export async function getFarcaster(account: string): Promise<Farcaster | null> {
    const client = await pool.connect()
    try {
        const query = `SELECT * FROM farcaster WHERE UPPER(account) = $1`
        const result = await client.query(query, [account.toUpperCase()])

        if (result.rows.length === 0) return null

        const row = result.rows[0]
        row.signature = JSON.parse(row.signature)
        return row as Farcaster
    } catch (err) {
        console.error('Error getting user:', err)
        throw err
    } finally {
        client.release()
    }
}

export async function createFarcaster({ account, fid, signature }: Farcaster): Promise<void> {
    const client = await pool.connect()
    try {
        await client.query('BEGIN')

        const insertQuery = `
      INSERT INTO farcaster (account, fid, signature)
      VALUES ($1, $2, $3)
    `
        await client.query(insertQuery, [account, fid, JSON.stringify(signature)])

        await client.query('COMMIT')
    } catch (err) {
        await client.query('ROLLBACK')
        console.error('Error inserting user:', err)
        throw err
    } finally {
        client.release()
    }
}
