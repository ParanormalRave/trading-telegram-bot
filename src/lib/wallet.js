import {Keypair, PublicKey} from '@solana/web3.js'
import crypto from 'node:crypto'

// AES-256-GCM: symmetric encryption, authenticated (detects tampering, not just decrypts).
// Generate one once with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
const ENCRYPTION_KEY = Buffer.from(process.env.WALLET_ENCRYPTION_KEY, 'hex')

export const generateWallet = () => {
    const keypair = Keypair.generate()
    return{
        publicKey: keypair.publicKey.toString(),
        secretkey: keypair.secretKey
    }
}

export function encryptSecretKey(secretKey){
    const iv = crypto.randomBytes(12)
    const cipher = crypto.createCipheriv('aes-256-gcm', ENCRYPTION_KEY)
    const encrypted = Buffer.concat([cipher.update(Buffer.from(secretKey)),cipher.final()])
    const authTag = cipher.getAuthTag

    return{
        iv: iv.toString('hex'),
        encrypted: encrypted.toString('hex'),
        authTag: authTag.toString('hex')
    }
}

export function decryptSecretKey(encryptedHex, ivHex, authTagHex){
    try{
    const iv = Buffer.from(ivHex, 'hex')
    const authTag = Buffer.from(authTagHex, 'hex')

    const decipher = crypto.createDecipheriv('aes-256-gcm', ENCRYPTION_KEY, iv)
    decipher.setAuthTag(authTag)

    const decrypted = Buffer.concat([
        decipher.update(Buffer.from(encryptedHex, 'hex')),
        decipher.final(),
    ])

    return new Uint8Array(decrypted)        
    }catch (err){
        console.error('Failed to decrypt secret key:', err.message)
        throw new Error('Failed to decrypt secret key. The data may be corrupted or the encryption key is incorrect.')
    }
}




