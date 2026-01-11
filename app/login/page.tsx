"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);
	const router = useRouter();

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError("");
		setLoading(true);

		try {
			const res = await fetch("/api/auth", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email, password }),
			});

			if (!res.ok) {
				const data = await res.json();
				setError(data.error || "Login failed");
				return;
			}

			router.push("/");
			router.refresh();
		} catch {
			setError("Something went wrong");
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="min-h-screen flex items-center justify-center bg-zinc-950">
			<div className="w-full max-w-sm p-8 space-y-6">
				<div className="text-center">
					<h1 className="text-2xl font-bold text-white">BYOS</h1>
					<p className="text-zinc-400 text-sm mt-1">Sign in to continue</p>
				</div>

				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="email" className="text-zinc-300">
							Email
						</Label>
						<Input
							id="email"
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							placeholder="you@example.com"
							required
							className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-500"
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="password" className="text-zinc-300">
							Password
						</Label>
						<Input
							id="password"
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							placeholder="••••••••"
							required
							className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-500"
						/>
					</div>

					{error && (
						<p className="text-red-400 text-sm text-center">{error}</p>
					)}

					<Button
						type="submit"
						disabled={loading}
						className="w-full bg-white text-black hover:bg-zinc-200"
					>
						{loading ? "Signing in..." : "Sign in"}
					</Button>
				</form>
			</div>
		</div>
	);
}
