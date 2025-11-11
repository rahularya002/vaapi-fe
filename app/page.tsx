import { Hero } from "@/components/ui/Hero";
import { Navbar } from "@/components/ui/Navbar";
// Temporarily commented out - can be restored later
// import { FAQ } from "@/components/ui/FAQ";
// import { Features } from "@/components/ui/Features";



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
