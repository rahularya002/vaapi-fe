import MagicBento from '../MagicBento'

export const Features = () => {
    return (
        <section
            style={{
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '24px',
                padding: '32px 16px'
            }}
        >
            <h2
                style={{
                    fontSize: 'clamp(24px, 20px + 1vw, 36px)',
                    fontWeight: 800,
                    lineHeight: 1.15,
                    letterSpacing: '-0.01em',
                    textAlign: 'center',
                    color: 'white',
                    margin: 0
                }}
            >
                Powerful features for your AI Call Agent
            </h2>
            <p
                style={{
                    maxWidth: 800,
                    textAlign: 'center',
                    color: 'rgba(255,255,255,0.75)',
                    fontSize: 'clamp(14px, 13px + 0.3vw, 16px)',
                    lineHeight: 1.7,
                    margin: 0
                }}
            >
                Everything you need to deliver natural, compliant, and productive customer conversations at scale.
            </p>
            <div style={{ width: '100%', maxWidth: 1200 }}>
                <MagicBento 
                    textAutoHide={true}
                    enableStars={true}
                    enableSpotlight={true}
                    enableBorderGlow={true}
                    enableTilt={true}
                    enableMagnetism={true}
                    clickEffect={true}
                    spotlightRadius={300}
                    particleCount={12}
                    glowColor="132, 0, 255"
                />
            </div>
        </section>
    )
}