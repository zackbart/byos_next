import {
	createSession,
	destroySession,
	validateCredentials,
} from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
	try {
		const { email, password } = await request.json();

		if (!email || !password) {
			return NextResponse.json(
				{ error: "Email and password required" },
				{ status: 400 },
			);
		}

		const valid = await validateCredentials(email, password);

		if (!valid) {
			return NextResponse.json(
				{ error: "Invalid credentials" },
				{ status: 401 },
			);
		}

		await createSession();

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Login error:", error);
		return NextResponse.json({ error: "Login failed" }, { status: 500 });
	}
}

export async function DELETE() {
	await destroySession();
	return NextResponse.json({ success: true });
}
