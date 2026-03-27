export const ROOT = '/';
export const PUBLIC_ROUTES = ['/api/public'];
export const SECURE_API_ROUTES = ['/api/employee', '/api/admin', '/api/super-admin'];
export const API_ROUTES = [...PUBLIC_ROUTES, ...SECURE_API_ROUTES];
export const AUTH_ROUTES = ['/login', '/register', '/forgot-password', '/reset-password'];
export const DEFAULT_LOGIN_REDIRECT = '/dashboard';
export const DEFAULT_LOGOUT_REDIRECT = '/login';
export const DEFAULT_ADMIN_LOGIN_REDIRECT = '/admin/dashboard';
export const DEFAULT_SUPER_ADMIN_LOGIN_REDIRECT = '/super-admin/dashboard';

export const ADMIN_ROUTES = ['/admin'];
export const SUPER_ADMIN_ROUTES = ['/super-admin'];
export const PROTECTED_UI_ROUTES = [...ADMIN_ROUTES, ...SUPER_ADMIN_ROUTES];