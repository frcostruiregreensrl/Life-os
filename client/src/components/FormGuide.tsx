import { useEffect, useRef, useState, type RefObject } from "react";
import { Robot } from "@/components/Robot";
import { onCompanionCelebrate } from "@/lib/companionBus";
import { cn } from "@/lib/utils";

const ROBOT_SIZE = 42;
const MARGIN = 10;

interface FormGuideProps {
  targets: RefObject<HTMLElement>[];
  completedCount: number;
}

function computeTarget(el: HTMLElement) {
  const rect = el.getBoundingClientRect();
  const maxLeft = window.innerWidth - ROBOT_SIZE - MARGIN;
  const maxTop = window.innerHeight - ROBOT_SIZE - MARGIN;
  return {
    left: Math.max(MARGIN, Math.min(rect.right + 12, maxLeft)),
    top: Math.max(MARGIN, Math.min(rect.top + rect.height / 2 - ROBOT_SIZE / 2, maxTop)),
  };
}

export function FormGuide({ targets, completedCount }: FormGuideProps) {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const [phase, setPhase] = useState<"idle" | "cheer" | "running">("idle");
  const [lean, setLean] = useState<"left" | "right" | null>(null);
  const placedIndexRef = useRef(-1);
  const posRef = useRef<{ top: number; left: number } | null>(null);

  // place near the first field as soon as it mounts
  useEffect(() => {
    const el = targets[0]?.current;
    if (el && placedIndexRef.current === -1) {
      placedIndexRef.current = 0;
      const target = computeTarget(el);
      posRef.current = target;
      setPos(target);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // advance to the next field once a step completes
  useEffect(() => {
    const targetIndex = Math.min(completedCount, targets.length - 1);
    if (targetIndex <= placedIndexRef.current) return;
    const el = targets[targetIndex]?.current;
    if (!el) return;

    setPhase("cheer");
    const cheerTimer = setTimeout(() => {
      const target = computeTarget(el);
      const prevPos = posRef.current;
      if (prevPos) setLean(target.left >= prevPos.left ? "right" : "left");
      setPhase("running");
      posRef.current = target;
      setPos(target);
      placedIndexRef.current = targetIndex;

      const arriveTimer = setTimeout(() => {
        setPhase("idle");
        setLean(null);
      }, 550);
      return () => clearTimeout(arriveTimer);
    }, 550);

    return () => clearTimeout(cheerTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [completedCount]);

  useEffect(() => {
    return onCompanionCelebrate(() => {
      setPhase("cheer");
      const timer = setTimeout(() => setPhase("idle"), 700);
      return () => clearTimeout(timer);
    });
  }, []);

  if (!pos) return null;

  return (
    <div
      className={cn(
        "pointer-events-none fixed z-40 transition-all ease-in-out",
        lean === "right" && "rotate-6",
        lean === "left" && "-rotate-6",
      )}
      style={{ top: pos.top, left: pos.left, transitionDuration: phase === "running" ? "550ms" : "200ms" }}
    >
      <Robot state="idle" celebrate={phase === "cheer" || phase === "running"} size={ROBOT_SIZE} />
    </div>
  );
}
