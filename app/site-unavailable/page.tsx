export default function SiteUnavailablePage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0a0a0a',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        padding: '24px',
      }}
    >
      <div style={{ textAlign: 'center', maxWidth: '420px' }}>
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
            fontSize: '24px',
          }}
        >
          🚧
        </div>
        <h1
          style={{
            color: 'rgba(255,255,255,0.85)',
            fontSize: '20px',
            fontWeight: 600,
            margin: '0 0 8px',
            letterSpacing: '-0.01em',
          }}
        >
          Site Unavailable
        </h1>
        <p
          style={{
            color: 'rgba(255,255,255,0.35)',
            fontSize: '14px',
            lineHeight: '1.6',
            margin: 0,
          }}
        >
          This site is currently unavailable. If you believe this is an error,
          please contact the site owner.
        </p>
      </div>
    </div>
  );
}
