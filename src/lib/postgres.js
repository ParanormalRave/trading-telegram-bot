import dotenv from 'dotenv'
dotenv.config()

import pg from 'pg'

const pool = new pg.Pool({
  // host: process.env.POSTGRES_HOST,
  // port: process.env.POSTGRES_PORT || 5433,
  // database: process.env.POSTGRES_DB,
  // user: process.env.POSTGRES_USER,
  // password: process.env.POSTGRES_PASSWORD,
  connectionString: process.env.DATABASE_URL,
  max: 10,
  min: 2,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  ssl: { rejectUnauthorized: false },
})

pool.on('connect', () => {
  console.log('Connected to Database')
})

pool.on('error', (err) => {
  console.error('SparkDB connection error:', err)
})

export const db = pool
