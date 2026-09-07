import { cn } from "@/lib/utils";

interface ReadinessRingProps {
  value: number;
  size?: number;
  label?: string;
  caption?: string;
  className?: string;
}

export function ReadinessRing({
  value,
  size = 160,
  label = "Placement Ready",
  caption,
  className,
}: ReadinessRingProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  const stroke = size / 12;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          role="img"
          aria-label={`${label}: ${clamped} percent`}
          className="-rotate-90"
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={stroke}
            className="stroke-muted"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="stroke-primary transition-[stroke-dashoffset] duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-3xl font-bold tabular-nums">{clamped}%</span>
          <span className="text-xs font-medium text-muted-foreground">{label}</span>
        </div>
      </div>
      {caption ? (
        <p className="text-center text-xs text-muted-foreground">{caption}</p>
      ) : null}
    </div>
  );
}
