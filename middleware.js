import { NextResponse } from 'next/server';
import { SECURE_API_ROUTES } from "./lib/routes";
import { decrypt } from './lib/session';

export async function middleware(request) {

    const pathname = request.nextUrl.pathname;
    // console.log('middleware: ', 'pathname: ', pathname, 'url:', request.url);

    let session = { };

    const sessionCookie = request.cookies.get('session')?.value;
    if (sessionCookie) {
        // session cookie present
        const payload = await decrypt(sessionCookie);
        if(payload) session.user = payload;
    }

    // console.log('cookie: ', sessionCookie, ' session: ', session)

    const response = NextResponse.next();

    // 1. CORS (Cross-Origin Resource Sharing)
    const allowedOrigins = process.env.NEXT_PUBLIC_ALLOWED_ORIGINS
        ? process.env.NEXT_PUBLIC_ALLOWED_ORIGINS.split(',')
        : [];
    const origin = request.headers.get('origin');

    if (allowedOrigins.includes(origin)) {
        response.headers.set('Access-Control-Allow-Origin', origin);
    }
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    response.headers.set('Access-Control-Allow-Credentials', 'true');

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
        return new NextResponse(null, { status: 204, headers: response.headers });
    }

    // authentication for secure api routes and pages
    if (SECURE_API_ROUTES.some(route => pathname.startsWith(route))) {
        // Validate session
        if (!session?.user) {
            console.log('middleware: secure api routes not accessable with out valid session')
            return NextResponse.json(
                { error: 'Please Sign in First' },
                { status: 401 }
            );
        }
    }

    // authorization for secure api routes
    if (pathname.startsWith('/api/employee')) {
        if (session?.user?.role !== 'employee' && session?.user?.role !== 'admin') {
            console.log('middleware: secure api route /api/employee not accessable with out valid permission')
            return NextResponse.json(
                { error: 'You are not authorized to access this route' },
                { status: 401 }
            );
        }
    } else if (pathname.startsWith('/api/admin')) {
        if (session?.user?.role !== 'admin' && session?.user?.role !== 'superadmin') {
            console.log('middleware: secure api route /api/admin not accessable with out valid permission')
            return NextResponse.json(
                { error: 'You are not authorized to access this route' },
                { status: 401 }
            );
        }
    } else if (pathname.startsWith('/api/super-admin')) {
        if (session?.user?.role !== 'superadmin') {
            console.log('middleware: secure api route /api/superadmin not accessable with out valid permission')
            return NextResponse.json(
                { error: 'You are not authorized to access this route' },
                { status: 401 }
            );
        }
    }


    // custom headers
    // set userId to header 
    if (session?.user?.id) {
        response.headers.set('x-user-id', session.user.id);
    }

    return response;

};

// Apply middleware only to specific routes
export const config = {
    matcher: [
        '/((?!_next/static|favicon.ico).*)',
    ],
};