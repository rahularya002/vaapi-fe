"use client";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { signIn } from "next-auth/react";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      console.log("[Login] Attempting signIn via credentials", { email });
      await signIn("credentials", {
        email,
        password,
        redirect: true,
        callbackUrl: "/dashboard",
      });
    } catch (err) {
      console.error("[Login] Unexpected error during signIn", err);
      alert("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>Welcome back</CardTitle>
        <CardDescription>Login to your account</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
          <div style={{ display: "grid", gap: 6 }}>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="you@example.com" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div style={{ display: "grid", gap: 6 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Label htmlFor="password">Password</Label>
              <Link href="#" style={{ fontSize: 12, opacity: 0.75 }}>Forgot password?</Link>
            </div>
            <Input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <Button type="submit" style={{ marginTop: 4 }} disabled={loading}>{loading ? "Signing in..." : "Sign in"}</Button>
        </form>
      </CardContent>
      <CardFooter style={{ display: "flex", justifyContent: "space-between" }}>
        <span style={{ fontSize: 14, opacity: 0.8 }}>New here?</span>
        <Link href="/signup" style={{ fontSize: 14, fontWeight: 600 }}>Create an account</Link>
      </CardFooter>
    </Card>
  );
}


