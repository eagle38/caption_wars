export default function Card({ children, className = '', accent = false, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`rounded-2xl p-5 border transition-all duration-200 ${onClick ? 'cursor-pointer active:scale-98' : ''} ${className}`}
      style={{
        background: accent ? 'var(--accent-soft)' : 'var(--bg-card)',
        borderColor: accent ? 'var(--accent-border)' : 'var(--border)',
      }}
    >
      {children}
    </div>
  );
}