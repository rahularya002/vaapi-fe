import dynamic from "next/dynamic";
import { Navbar } from "@/components/ui/Navbar";

// Dynamically import Hero to reduce initial bundle size
const Hero = dynamic(() => import("@/components/ui/Hero").then(mod => ({ default: mod.Hero })), {
  loading: () => (
    <div style={{ 
      height: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'linear-gradient(to bottom, #0a0a0a, #1a1a1a)'
    }}>
      <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1rem' }}>Loading...</div>
    </div>
  ),
  ssr: true,
});

// Temporarily commented out - can be restored later
// const Features = dynamic(() => import("@/components/ui/Features").then(mod => ({ default: mod.Features })));
// const FAQ = dynamic(() => import("@/components/ui/FAQ").then(mod => ({ default: mod.FAQ })));

export default function Home() {
  return (
    <>
      <div style={{ 
        height: '100vh', 
        overflow: 'hidden',
        position: 'relative'
      }}>
        <Navbar />
        <Hero />
      </div>
      {/* Temporarily commented out - can be restored later */}
      {/* <Features /> */}
      {/* <FAQ /> */}
    </>
  );
}
