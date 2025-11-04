"use client";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { signIn } from "next-auth/react";
import { useState } from "react";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      console.log("[Signup] Registering new user", { email, name });
      
      // First, register the user
      const registerResponse = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });

      const registerResult = await registerResponse.json();
      
      if (!registerResponse.ok) {
        alert(registerResult.error || "Registration failed");
        return;
      }

      console.log("[Signup] User registered, signing in...");
      
      // Then sign in
      await signIn("credentials", {
        email,
        password,
        redirect: true,
        callbackUrl: "/dashboard",
      });
    } catch (err) {
      console.error("[Signup] Unexpected error", err);
      alert("Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>Create your account</CardTitle>
        <CardDescription>Join and start building voice agents</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
          <div style={{ display: "grid", gap: 6 }}>
            <Label htmlFor="name">Name</Label>
            <Input id="name" type="text" placeholder="Alex Smith" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div style={{ display: "grid", gap: 6 }}>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="you@example.com" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div style={{ display: "grid", gap: 6 }}>
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <Button type="submit" style={{ marginTop: 4 }} disabled={loading}>{loading ? "Creating..." : "Create account"}</Button>
        </form>
      </CardContent>
      <CardFooter style={{ display: "flex", justifyContent: "space-between" }}>
        <span style={{ fontSize: 14, opacity: 0.8 }}>Already have an account?</span>
        <Link href="/login" style={{ fontSize: 14, fontWeight: 600 }}>Sign in</Link>
      </CardFooter>
    </Card>
  );
}


