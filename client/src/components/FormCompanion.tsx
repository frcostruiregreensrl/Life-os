import { useEffect, useRef, useState } from "react";
import { Robot } from "@/components/Robot";
import { cn } from "@/lib/utils";

interface FormCompanionProps {
  activeField: HTMLElement | null;
  offsetX?: number;
}

const ROBOT_SIZE = 40;

export function FormCompanion({ activeField, offsetX = 12 }: FormCompanionProps) {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const [dancing, setDancing] = useState(false);
  const [lean, setLean] = useState<"left" | "right" | null>(null);
  const mountedRef = useRef(false);
  const prevRectRef = useRef<{ top: number; left: number } | null>(null);

  function computeTarget(el: HTMLElement) {
    const rect = el.getBoundingClientRect();
    const margin = 8;
    const maxLeft = window.innerWidth - ROBOT_SIZE - margin;
    const left = Math.max(margin, Math.min(rect.right + offsetX, maxLeft));
    const maxTop = window.innerHeight - ROBOT_SIZE - margin;
    const top = Math.max(margin, Math.min(rect.top + rect.height / 2 - ROBOT_SIZE / 2, maxTop));
    return { top, left };
  }

  useEffect(() => {
    if (!activeField) return;
    const target = computeTarget(activeField);

    if (!mountedRef.current) {
      mountedRef.current = true;
      prevRectRef.current = target;
      setPos(target);
      return;
    }

    const prev = prevRectRef.current;
    setDancing(true);
    const danceTimer = setTimeout(() => {
      setDancing(false);
      if (prev) setLean(target.left >= prev.left ? "right" : "left");
      setPos(target);
      prevRectRef.current = target;
      const leanTimer = setTimeout(() => setLean(null), 500);
      return () => clearTimeout(leanTimer);
    }, 420);

    return () => clearTimeout(danceTimer);
  }, [activeField]);

  useEffect(() => {
    function reposition() {
      if (activeField && !dancing) {
        const target = computeTarget(activeField);
        prevRectRef.current = target;
        setPos(target);
      }
    }
    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);
    return () => {
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeField, dancing]);

  if (!pos) return null;

  return (
    <div
      className={cn(
        "pointer-events-none fixed z-40 transition-all duration-500 ease-out",
        lean === "right" && "rotate-6",
        lean === "left" && "-rotate-6",
      )}
      style={{ top: pos.top, left: pos.left }}
    >
      <Robot state="idle" celebrate={dancing} size={ROBOT_SIZE} />
    </div>
  );
}
