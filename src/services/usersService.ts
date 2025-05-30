import { pool } from "@/config/superChain/constants"




export interface User {
    account: string
    nationality: string
}

export async function getUser(account: string): Promise<User | null> {
    const client = await pool.connect()
    try {
        const query = `
      SELECT * FROM users WHERE account = $1
    `
        const result = await client.query(query, [account.toUpperCase()])

        if (result.rows.length === 0) return null
        return result.rows[0] as User
    } catch (err) {
        console.error('Error getting user:', err)
        throw err
    } finally {
        client.release()
    }
}

export async function createUser({ account, nationality }: User): Promise<void> {
    const client = await pool.connect()
    try {
        await client.query('BEGIN')

        const insertQuery = `
      INSERT INTO users (account, nationality)
      VALUES ($1, $2)
    `
        await client.query(insertQuery, [account, nationality])

        await client.query('COMMIT')
    } catch (err) {
        await client.query('ROLLBACK')
        console.error('Error inserting user:', err)
        throw err
    } finally {
        client.release()
    }
}
