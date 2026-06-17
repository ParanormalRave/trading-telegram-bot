import dotenv from 'dotenv'
dotenv.config()

import pg from 'pg'
const pool = new pg.Pool({
  host: process.env.POSTGRES_HOST,
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,

  max: 10,
  min: 2,
  idleTimeoutMillis: 30000,
});

pool.on('connect', ()=>{
  console.log("connected to the database")
})

pool.on('error', ()=>{
  console.error("Error:",err);
})

export const db = pool;