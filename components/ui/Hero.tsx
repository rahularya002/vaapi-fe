import Threads from "../Threads";


export const Hero = () => {
    return(
        <div style={{ width: '100%', height: '100vh', position: 'relative' }}>
            <Threads
                amplitude={1}
                distance={0}
                enableMouseInteraction={false}
            />
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    pointerEvents: 'none'
                }}
            >
                <div style={{ textAlign: 'center', maxWidth: '720px', padding: '0 24px' }}>
                    <h1 style={{ fontSize: '48px', lineHeight: 1.1, marginBottom: '16px' }}>
                        Build voice agents faster
                    </h1>
                    <p style={{ fontSize: '18px', opacity: 0.85, marginBottom: '24px' }}>
                        A modern starter for experimenting with real‑time call agents. Includes a dynamic
                        background, sane defaults, and a dark‑first design.
                    </p>
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                        <a
                            href="#get-started"
                            style={{
                                pointerEvents: 'auto',
                                padding: '10px 16px',
                                borderRadius: '10px',
                                background: 'var(--primary)',
                                color: 'var(--primary-foreground)',
                                textDecoration: 'none',
                                fontWeight: 600
                            }}
                        >
                            Get started
                        </a>
                        <a
                            href="#learn-more"
                            style={{
                                pointerEvents: 'auto',
                                padding: '10px 16px',
                                borderRadius: '10px',
                                background: 'var(--secondary)',
                                color: 'var(--secondary-foreground)',
                                textDecoration: 'none',
                                fontWeight: 600,
                                border: '1px solid var(--border)'
                            }}
                        >
                            Learn more
                        </a>
                    </div>
                </div>
            </div>
        </div>
    )
}