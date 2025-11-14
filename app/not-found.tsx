import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        background: "linear-gradient(to bottom, #0a0a0a, #1a1a1a)",
        color: "white",
      }}
    >
      <h1
        style={{
          fontSize: "clamp(4rem, 8vw, 8rem)",
          fontWeight: 800,
          margin: 0,
          background: "linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.5) 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}
      >
        404
      </h1>
      <h2
        style={{
          fontSize: "clamp(1.5rem, 3vw, 2rem)",
          fontWeight: 600,
          marginTop: "1rem",
          marginBottom: "0.5rem",
        }}
      >
        Page Not Found
      </h2>
      <p
        style={{
          fontSize: "1rem",
          color: "rgba(255,255,255,0.6)",
          textAlign: "center",
          maxWidth: "500px",
          marginBottom: "2rem",
        }}
      >
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link href="/">
        <Button size="lg" variant="default">
          Go Home
        </Button>
      </Link>
    </div>
  );
}

