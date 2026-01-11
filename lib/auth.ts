import { cookies } from "next/headers";

const SESSION_COOKIE = "byos_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export async function validateCredentials(
	email: string,
	password: string,
): Promise<boolean> {
	const validEmail = process.env.AUTH_EMAIL;
	const validPassword = process.env.AUTH_PASSWORD;

	if (!validEmail || !validPassword) {
		console.warn("AUTH_EMAIL or AUTH_PASSWORD not set - auth disabled");
		return true;
	}

	return email === validEmail && password === validPassword;
}

export async function createSession(): Promise<void> {
	const cookieStore = await cookies();
	const sessionToken = generateSessionToken();

	cookieStore.set(SESSION_COOKIE, sessionToken, {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax",
		maxAge: SESSION_MAX_AGE,
		path: "/",
	});
}

export async function destroySession(): Promise<void> {
	const cookieStore = await cookies();
	cookieStore.delete(SESSION_COOKIE);
}

export async function isAuthenticated(): Promise<boolean> {
	// If no auth env vars set, allow access
	if (!process.env.AUTH_EMAIL || !process.env.AUTH_PASSWORD) {
		return true;
	}

	const cookieStore = await cookies();
	const session = cookieStore.get(SESSION_COOKIE);

	return !!session?.value;
}

function generateSessionToken(): string {
	const array = new Uint8Array(32);
	crypto.getRandomValues(array);
	return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
		"",
	);
}
