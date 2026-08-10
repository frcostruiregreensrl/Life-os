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
  const visorColor =
    state === "listening" ? "hsl(var(--warning))" : "hsl(var(--primary))";

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
        <circle cx="53" cy="10" r="3" className="robot-antenna-light" fill="hsl(var(--warning))" />
        <line x1="53" y1="13" x2="53" y2="20" stroke="hsl(var(--muted-foreground))" strokeWidth="1.5" />

        <rect x="14" y="16" width="36" height="28" rx="12" fill="hsl(var(--card))" stroke="hsl(var(--border))" strokeWidth="1.5" />

        <g className={state === "idle" ? "robot-eye-blink" : undefined} style={{ transformOrigin: "32px 30px" }}>
          {state === "speaking" ? (
            <g>
              {EQ_BARS.map((delay, i) => (
                <rect
                  key={i}
                  className="robot-eq-bar"
                  x={22 + i * 6}
                  y="24"
                  width="3.4"
                  height="12"
                  rx="1.7"
                  fill={visorColor}
                  style={{ transformOrigin: `${22 + i * 6 + 1.7}px 30px`, animationDelay: `${delay}s` }}
                />
              ))}
            </g>
          ) : state === "thinking" ? (
            <g>
              {[0, 1, 2].map((i) => (
                <circle
                  key={i}
                  className="robot-think-dot"
                  cx={24 + i * 8}
                  cy="30"
                  r="2.4"
                  fill={visorColor}
                  style={{ animationDelay: `${i * 0.18}s` }}
                />
              ))}
            </g>
          ) : (
            <rect x="21" y="26" width="22" height="8" rx="4" fill={visorColor} opacity={state === "listening" ? 1 : 0.9} />
          )}
        </g>

        <rect x="24" y="47" width="16" height="6" rx="3" fill="hsl(var(--border))" />
        <circle cx="10" cy="30" r="3" fill="hsl(var(--border))" />
        <circle cx="54" cy="30" r="3" fill="hsl(var(--border))" />
      </svg>
    </div>
  );
}
