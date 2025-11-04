import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Auth | AI Voice Call Agent",
};

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        background: "var(--background)",
        color: "var(--foreground)",
      }}
    >
      <div style={{ width: "100%", maxWidth: 440 }}>{children}</div>
    </div>
  );
}


