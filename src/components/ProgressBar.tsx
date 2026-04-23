import { motion } from 'framer-motion';

interface ProgressBarProps {
  value: number;
  max: number;
  label: string;
  feedback?: string;
  delay?: number;
  suffix?: string;
}

export default function ProgressBar({ value, max, label, feedback, delay = 0, suffix }: ProgressBarProps) {
  const pct = (value / max) * 100;

  const getColor = (p: number) => {
    if (p >= 90) return 'from-emerald-400 to-emerald-500';
    if (p >= 75) return 'from-primary to-accent';
    if (p >= 60) return 'from-amber-400 to-amber-500';
    return 'from-red-400 to-red-500';
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay }}
      className="space-y-2"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-semibold text-foreground truncate">{label}</span>
          {suffix && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/15 text-primary font-semibold flex-shrink-0">{suffix}</span>
          )}
        </div>
        <span className="text-sm font-bold text-primary flex-shrink-0">{value}<span className="text-muted font-normal">/{max}</span></span>
      </div>
      <div className="h-2.5 bg-navy-light/60 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full bg-gradient-to-r ${getColor(pct)}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1.2, delay: delay + 0.2, ease: 'easeOut' }}
        />
      </div>
      {feedback && (
        <p className="text-xs text-muted leading-relaxed">{feedback}</p>
      )}
    </motion.div>
  );
}
