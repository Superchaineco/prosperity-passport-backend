import { pool } from "@/config/superChain/constants"


interface CreateUserInput {
    account: string
    nationality: string
}

export async function createUser({ account, nationality }: CreateUserInput): Promise<void> {
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
