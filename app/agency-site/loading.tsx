// app/agency-site/loading.tsx
// Shows a clean loading state during page transitions

export default function AgencySiteLoading() {
  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#ffffff',
        zIndex: 9999,
      }}
    >
      {/* Simple spinner */}
      <div
        style={{
          width: '32px',
          height: '32px',
          border: '3px solid #e5e7eb',
          borderTopColor: '#9ca3af',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}