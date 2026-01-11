import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE = "byos_session";

// Routes that don't require authentication
const PUBLIC_ROUTES = [
	"/login",
	"/api/auth",
	// Device API endpoints - must remain unprotected
	"/api/display",
	"/api/bitmap",
	"/api/setup",
	"/api/log",
	"/api/test-img",
];

// Static asset prefixes
const STATIC_PREFIXES = ["/_next", "/static", "/fonts", "/favicon.ico"];

function isPublicRoute(pathname: string): boolean {
	// Check static assets
	if (STATIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
		return true;
	}

	// Check public routes
	return PUBLIC_ROUTES.some(
		(route) => pathname === route || pathname.startsWith(`${route}/`),
	);
}

export function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl;

	// Allow public routes
	if (isPublicRoute(pathname)) {
		return NextResponse.next();
	}

	// Check for auth env vars - if not set, allow all access
	const authEmail = process.env.AUTH_EMAIL;
	const authPassword = process.env.AUTH_PASSWORD;

	if (!authEmail || !authPassword) {
		return NextResponse.next();
	}

	// Check session cookie
	const session = request.cookies.get(SESSION_COOKIE);

	if (!session?.value) {
		// Redirect to login
		const loginUrl = new URL("/login", request.url);
		return NextResponse.redirect(loginUrl);
	}

	return NextResponse.next();
}

export const config = {
	matcher: [
		/*
		 * Match all request paths except:
		 * - _next/static (static files)
		 * - _next/image (image optimization files)
		 * - favicon.ico (favicon file)
		 * - public folder
		 */
		"/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|bmp)$).*)",
	],
};
