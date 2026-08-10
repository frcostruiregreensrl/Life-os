import { useEffect, useState } from "react";
import { Robot } from "@/components/Robot";
import { cn } from "@/lib/utils";

interface RobotPopupProps {
  message?: string;
  onDone: () => void;
  holdMs?: number;
}

export function RobotPopup({ message, onDone, holdMs = 1400 }: RobotPopupProps) {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const holdTimer = setTimeout(() => setLeaving(true), holdMs);
    return () => clearTimeout(holdTimer);
  }, [holdMs]);

  useEffect(() => {
    if (!leaving) return;
    const exitTimer = setTimeout(onDone, 250);
    return () => clearTimeout(exitTimer);
  }, [leaving, onDone]);

  return (
    <div
      className={cn(
        "pointer-events-none absolute -right-2 -top-3 z-10 flex flex-col items-center gap-1",
        leaving ? "robot-pop-out" : "robot-pop-in",
      )}
    >
      {message && (
        <span className="font-data whitespace-nowrap rounded-full bg-success/15 px-2 py-0.5 text-[0.6rem] text-success">
          {message}
        </span>
      )}
      <Robot state="idle" celebrate size={38} />
    </div>
  );
}
