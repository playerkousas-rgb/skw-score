import { motion } from 'framer-motion';

interface ScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  delay?: number;
}

export default function ScoreRing({ score, size = 140, strokeWidth = 8, label, delay = 0 }: ScoreRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;

  const getColor = (s: number) => {
    if (s >= 90) return '#34D399';
    if (s >= 75) return '#38BDF8';
    if (s >= 60) return '#FBBF24';
    return '#F87171';
  };

  const getGrade = (s: number) => {
    if (s >= 95) return 'S';
    if (s >= 90) return 'A+';
    if (s >= 85) return 'A';
    if (s >= 80) return 'B+';
    if (s >= 75) return 'B';
    if (s >= 70) return 'C+';
    return 'C';
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#152244"
            strokeWidth={strokeWidth}
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={getColor(score)}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - progress }}
            transition={{ duration: 1.5, delay, ease: 'easeOut' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className="text-3xl font-bold"
            style={{ color: getColor(score) }}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: delay + 0.8 }}
          >
            {score}
          </motion.span>
          <motion.span
            className="text-xs font-semibold text-muted"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: delay + 1 }}
          >
            {getGrade(score)}
          </motion.span>
        </div>
      </div>
      {label && <span className="text-sm font-medium text-muted">{label}</span>}
    </div>
  );
}
