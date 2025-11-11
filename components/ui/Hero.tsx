import Threads from "../Threads";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Logo from "./Logo";

export const Hero = () => {
    return(
        <div style={{ 
            width: '100%', 
            height: '100vh',
            position: 'relative',
            overflow: 'hidden'
        }}>
            <div style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                zIndex: 0
            }}>
                <Threads
                    amplitude={1}
                    distance={0}
                    enableMouseInteraction={true}
                />
            </div>
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    pointerEvents: 'none',
                    paddingTop: '100px', // Account for navbar (60px + 2em top)
                    paddingBottom: '240px', // Account for logo section at bottom
                    paddingLeft: '1rem',
                    paddingRight: '1rem',
                    zIndex: 1
                }}
            >
                <div style={{ 
                    textAlign: 'center', 
                    maxWidth: '720px', 
                    padding: '0 24px',
                    width: '100%'
                }}>
                    <h1 style={{ 
                        fontSize: 'clamp(2.5rem, 5vw, 4rem)', 
                        lineHeight: 1.1, 
                        marginBottom: '1.5rem',
                        fontWeight: 700,
                        letterSpacing: '-0.02em',
                        fontFamily: 'var(--font-geist-sans), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
                    }}>
                        Build voice agents faster
                    </h1>
                    <p style={{ 
                        fontSize: 'clamp(1rem, 2vw, 1.125rem)', 
                        opacity: 0.85, 
                        marginBottom: '2rem',
                        lineHeight: 1.6,
                        maxWidth: '600px',
                        marginLeft: 'auto',
                        marginRight: 'auto',
                        fontFamily: 'var(--font-geist-sans), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
                    }}>
                        A modern starter for experimenting with real‑time call agents. Includes a dynamic
                        background, sane defaults, and a dark‑first design.
                    </p>
                    <div style={{ 
                        display: 'flex', 
                        gap: '12px', 
                        justifyContent: 'center',
                        flexWrap: 'wrap'
                    }}>
                        <a
                            href="/signup"
                            className={cn(buttonVariants({ size: "lg" }))}
                            style={{ pointerEvents: 'auto', textDecoration: 'none' }}
                        >
                            Get started
                        </a>
                        <a
                            href="#learn-more"
                            className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
                            style={{ pointerEvents: 'auto', textDecoration: 'none' }}
                        >
                            Learn more
                        </a>
                    </div>
                </div>
            </div>
            {/* Logo section at the bottom of hero */}
            <div style={{
                position: 'absolute',
                bottom: '2rem',
                left: 0,
                right: 0,
                pointerEvents: 'none',
                zIndex: 1
            }}>
                <div style={{ pointerEvents: 'auto' }}>
                    <Logo />
                </div>
            </div>
        </div>
    )
}