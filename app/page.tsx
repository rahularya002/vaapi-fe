import { Hero } from "@/components/ui/Hero";
import Logo from "@/components/ui/Logo";
import { Navbar } from "@/components/ui/Navbar";
import { FAQ } from "@/components/ui/FAQ";
import { Features } from "@/components/ui/Features";



export default function Home() {
  return (
    <div>
      <Navbar />
      <Hero />
      <Logo />
      <Features />
      <FAQ />
    </div>
  );
}
