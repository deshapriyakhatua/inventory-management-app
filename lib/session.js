import 'server-only'
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const secretKey = process.env.SESSION_SECRET || 'session_secret_inventory_management_app'
const encodedKey = new TextEncoder().encode(secretKey)
const isProduction = process.env.NODE_ENV === 'production';

export async function encrypt(payload) {
    return new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('7d')
        .sign(encodedKey)
}

export async function decrypt(session) {
    try {
        const { payload } = await jwtVerify(session, encodedKey, {
            algorithms: ['HS256'],
        })
        return payload
    } catch (error) {
        console.log('Failed to verify session: ', error)
    }
}

export async function createSession(obj) {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    const session = await encrypt({ ...obj, expiresAt })
    const cookieStore = await cookies()

    cookieStore.set('session', session, {
        domain: isProduction ? '.inventory-management-app-v2.vercel.app' : undefined, // Omit domain for localhost
        httpOnly: false,  // Allow client-side access
        secure: isProduction, // Only use secure cookies in production
        sameSite: isProduction ? 'none' : 'lax', // Cross-origin in production
        path: '/',
        expires: expiresAt,
    });
}

export async function updateSession() {
    const session = (await cookies()).get('session')?.value
    const payload = await decrypt(session)

    if (!session || !payload) {
        return null
    }

    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)(
        await cookies()
    ).set('session', session, {
        httpOnly: false,
        secure: isProduction,
        expires: expires,
        sameSite: 'lax',
        path: '/',
    })
}

export async function deleteSession() {
    const cookieStore = await cookies()
    cookieStore.delete('session')
}