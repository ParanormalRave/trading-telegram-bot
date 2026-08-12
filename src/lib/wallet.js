import {keypair} from '@solana/web3.js'
import crypto from 'node:crypto'

// AES-256-GCM: symmetric encryption, authenticated (detects tampering, not just decrypts).
// Generate one once with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
const ENCRYPTION_KEY = Buffer.from(process.env.WALLET_ENCRYPTION_KEY, 'hex')