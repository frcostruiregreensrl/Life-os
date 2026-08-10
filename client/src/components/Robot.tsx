import { cn } from "@/lib/utils";

export type Face = "idle" | "thinking" | "listening" | "speaking";
export type Action = "idle" | "walk" | "jump" | "point" | "laugh" | "dance" | "reach" | "pull";

interface RobotProps {
  action?: Action;
  face?: Face;
  pointDir?: "left" | "right";
  size?: number;
  className?: string;
}

const EQ_BARS = [0, 0.15, 0.3, 0.45];

export function Robot({ action = "idle", face = "idle", pointDir = "left", size = 68, className }: RobotProps) {
  const pupilColor = face === "listening" ? "hsl(var(--warning))" : "hsl(var(--primary))";
  const pupilRadius = face === "listening" ? 2.9 : 2.4;
  const bigSmile = action === "laugh" || action === "dance" || action === "jump";

  const leftArmStyle: React.CSSProperties = { transformOrigin: "13px 30px" };
  const rightArmStyle: React.CSSProperties = { transformOrigin: "27px 30px" };
  const leftLegStyle: React.CSSProperties = { transformOrigin: "16px 48px" };
  const rightLegStyle: React.CSSProperties = { transformOrigin: "24px 48px" };
  let leftArmClass = "";
  let rightArmClass = "";
  let leftLegClass = "";
  let rightLegClass = "";
  let bodyClass = action === "idle" || action === "point" ? "robot-idle" : "";

  if (action === "walk") {
    leftArmClass = "char-walk-arm-l";
    rightArmClass = "char-walk-arm-r";
    leftLegClass = "char-walk-leg-l";
    rightLegClass = "char-walk-leg-r";
  } else if (action === "jump") {
    bodyClass = "char-jump-body";
    leftArmStyle.transform = "rotate(-150deg)";
    rightArmStyle.transform = "rotate(150deg)";
    leftLegStyle.transform = "rotate(-18deg)";
    rightLegStyle.transform = "rotate(18deg)";
  } else if (action === "point") {
    if (pointDir === "left") {
      leftArmStyle.transform = "rotate(105deg)";
    } else {
      rightArmStyle.transform = "rotate(-105deg)";
    }
  } else if (action === "laugh") {
    bodyClass = "char-laugh-shake";
    leftArmStyle.transform = "rotate(-30deg)";
    rightArmStyle.transform = "rotate(30deg)";
  } else if (action === "dance") {
    leftArmClass = "char-macarena-arm-l";
    rightArmClass = "char-macarena-arm-r";
    leftLegClass = "char-macarena-hip";
    rightLegClass = "char-macarena-hip";
  } else if (action === "reach") {
    rightArmStyle.transform = "rotate(-165deg)";
  } else if (action === "pull") {
    rightArmClass = "char-pull-arm";
  }

  return (
    <div className={cn("relative flex items-center justify-center", className)} style={{ width: size, height: size }}>
      {face === "listening" && (
        <>
          <span className="robot-ring absolute inset-0 rounded-full border-2" style={{ borderColor: "hsl(var(--warning))" }} />
          <span
            className="robot-ring robot-ring-delay absolute inset-0 rounded-full border-2"
            style={{ borderColor: "hsl(var(--warning))" }}
          />
        </>
      )}

      <svg width={size} height={size} viewBox="0 0 40 76" fill="none" className={bodyClass}>
        {/* antenna */}
        <line x1="20" y1="6" x2="20" y2="2" stroke="hsl(var(--muted-foreground))" strokeWidth="1.4" />
        <circle cx="20" cy="1" r="1.8" className="robot-antenna-light" fill="hsl(var(--warning))" />

        {/* legs (behind torso) */}
        <g className={leftLegClass} style={leftLegStyle}>
          <rect x="13" y="48" width="6" height="19" rx="3" fill="hsl(var(--secondary))" stroke="hsl(var(--muted-foreground))" strokeWidth="1.6" />
          <ellipse cx="16" cy="68" rx="4" ry="2.4" fill="hsl(var(--muted-foreground))" />
        </g>
        <g className={rightLegClass} style={rightLegStyle}>
          <rect x="21" y="48" width="6" height="19" rx="3" fill="hsl(var(--secondary))" stroke="hsl(var(--muted-foreground))" strokeWidth="1.6" />
          <ellipse cx="24" cy="68" rx="4" ry="2.4" fill="hsl(var(--muted-foreground))" />
        </g>

        {/* torso */}
        <rect x="11" y="26" width="18" height="23" rx="7" fill="hsl(var(--secondary))" stroke="hsl(var(--muted-foreground))" strokeWidth="1.6" />

        {/* arms (drawn after torso so they stay visible in every rotated pose) */}
        <g className={leftArmClass} style={leftArmStyle}>
          <rect x="7" y="30" width="6" height="17" rx="3" fill="hsl(var(--secondary))" stroke="hsl(var(--muted-foreground))" strokeWidth="1.6" />
          <circle cx="10" cy="48" r="3.1" fill="hsl(var(--muted-foreground))" />
        </g>
        <g className={rightArmClass} style={rightArmStyle}>
          <rect x="27" y="30" width="6" height="17" rx="3" fill="hsl(var(--secondary))" stroke="hsl(var(--muted-foreground))" strokeWidth="1.6" />
          <circle cx="30" cy="48" r="3.1" fill="hsl(var(--muted-foreground))" />
        </g>

        {/* head */}
        <circle cx="20" cy="15" r="11" fill="hsl(var(--secondary))" stroke="hsl(var(--muted-foreground))" strokeWidth="1.6" />
        <circle cx="7" cy="15" r="2.4" fill="hsl(var(--muted-foreground))" />
        <circle cx="33" cy="15" r="2.4" fill="hsl(var(--muted-foreground))" />

        <g className={face === "idle" && action !== "walk" ? "robot-eye-blink" : undefined} style={{ transformOrigin: "20px 14px" }}>
          <circle cx="14.5" cy="14" r="5.6" fill="hsl(var(--background))" />
          <circle cx="25.5" cy="14" r="5.6" fill="hsl(var(--background))" />

          <g className={face === "thinking" ? "robot-eye-scan" : undefined}>
            <circle cx="14.5" cy="14" r={pupilRadius} fill={pupilColor} />
            <circle cx="25.5" cy="14" r={pupilRadius} fill={pupilColor} />
            <circle cx="13.2" cy="12.5" r="0.9" fill="hsl(var(--background))" opacity="0.9" />
            <circle cx="24.2" cy="12.5" r="0.9" fill="hsl(var(--background))" opacity="0.9" />
          </g>
        </g>

        {bigSmile ? (
          <ellipse cx="20" cy="20" rx="4.2" ry="3" fill="hsl(var(--muted-foreground))" />
        ) : face === "speaking" ? (
          <g>
            {EQ_BARS.map((delay, i) => (
              <rect
                key={i}
                className="robot-eq-bar"
                x={14.5 + i * 4}
                y="18.5"
                width="2.3"
                height="6.5"
                rx="1.1"
                fill="hsl(var(--primary))"
                style={{ transformOrigin: `${14.5 + i * 4 + 1.1}px 21.8px`, animationDelay: `${delay}s` }}
              />
            ))}
          </g>
        ) : (
          <path d="M 15.5 19.5 Q 20 22.5 24.5 19.5" stroke="hsl(var(--muted-foreground))" strokeWidth="1.6" strokeLinecap="round" fill="none" />
        )}
      </svg>
    </div>
  );
}
