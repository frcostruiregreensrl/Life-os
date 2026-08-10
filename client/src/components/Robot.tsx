import { cn } from "@/lib/utils";

export type RobotState = "idle" | "thinking" | "listening" | "speaking";

interface RobotProps {
  state: RobotState;
  celebrate?: boolean;
  size?: number;
  className?: string;
}

const EQ_BARS = [0, 0.15, 0.3, 0.45];

export function Robot({ state, celebrate, size = 68, className }: RobotProps) {
  const pupilColor = state === "listening" ? "hsl(var(--warning))" : "hsl(var(--primary))";
  const pupilRadius = state === "listening" ? 4.1 : 3.3;

  return (
    <div
      className={cn("relative flex items-center justify-center", celebrate ? "robot-celebrate" : "robot-idle", className)}
      style={{ width: size, height: size }}
    >
      {state === "listening" && (
        <>
          <span
            className="robot-ring absolute inset-0 rounded-full border-2"
            style={{ borderColor: "hsl(var(--warning))" }}
          />
          <span
            className="robot-ring robot-ring-delay absolute inset-0 rounded-full border-2"
            style={{ borderColor: "hsl(var(--warning))" }}
          />
        </>
      )}

      <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
        <line x1="32" y1="5" x2="32" y2="12" stroke="hsl(var(--muted-foreground))" strokeWidth="1.5" />
        <circle cx="32" cy="4" r="2.6" className="robot-antenna-light" fill="hsl(var(--warning))" />

        <circle cx="32" cy="31" r="21" fill="hsl(var(--card))" stroke="hsl(var(--border))" strokeWidth="1.5" />
        <circle cx="8.5" cy="31" r="3" fill="hsl(var(--border))" />
        <circle cx="55.5" cy="31" r="3" fill="hsl(var(--border))" />

        <g className={state === "idle" ? "robot-eye-blink" : undefined} style={{ transformOrigin: "32px 28px" }}>
          <circle cx="22" cy="28" r="7.6" fill="hsl(var(--background))" />
          <circle cx="42" cy="28" r="7.6" fill="hsl(var(--background))" />

          <g className={state === "thinking" ? "robot-eye-scan" : undefined}>
            <circle cx="22" cy="28" r={pupilRadius} fill={pupilColor} />
            <circle cx="42" cy="28" r={pupilRadius} fill={pupilColor} />
            <circle cx="20.3" cy="26.3" r="1.1" fill="hsl(var(--background))" opacity="0.9" />
            <circle cx="40.3" cy="26.3" r="1.1" fill="hsl(var(--background))" opacity="0.9" />
          </g>
        </g>

        {state === "speaking" ? (
          <g>
            {EQ_BARS.map((delay, i) => (
              <rect
                key={i}
                className="robot-eq-bar"
                x={22.5 + i * 5.3}
                y="38"
                width="3"
                height="9"
                rx="1.5"
                fill="hsl(var(--primary))"
                style={{ transformOrigin: `${22.5 + i * 5.3 + 1.5}px 42.5px`, animationDelay: `${delay}s` }}
              />
            ))}
          </g>
        ) : (
          <path
            d="M 25 41 Q 32 45.5 39 41"
            stroke="hsl(var(--muted-foreground))"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
        )}
      </svg>
    </div>
  );
}
