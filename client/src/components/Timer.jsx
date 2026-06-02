import { useGame } from '../context/GameContext';

export default function Timer({ maxSeconds = 60, large = false }) {
  const { state } = useGame();
  const value = state.timerValue;
  const isUrgent = value <= 10;
  const size = large ? 80 : 56;
  const radius = large ? 32 : 22;
  const stroke = large ? 4 : 3;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, value / maxSeconds);
  const dash = progress * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg
        className="absolute inset-0 -rotate-90"
        width={size} height={size}
        viewBox={`0 0 ${size} ${size}`}
      >
        <circle
          cx={size/2} cy={size/2} r={radius}
          fill="none"
          stroke="var(--border)"
          strokeWidth={stroke}
        />
        <circle
          cx={size/2} cy={size/2} r={radius}
          fill="none"
          stroke={isUrgent ? '#FF4D1C' : 'var(--green)'}
          strokeWidth={stroke}
          strokeDasharray={`${dash} ${circumference}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.9s linear, stroke 0.3s' }}
        />
      </svg>
      <span
        className="font-display font-800 tabular-nums z-10"
        style={{
          fontSize: large ? 22 : 15,
          color: isUrgent ? '#FF4D1C' : 'var(--cream)',
          animation: isUrgent ? 'countdownPulse 0.5s ease infinite' : 'none',
        }}
      >
        {value}
      </span>
    </div>
  );
}