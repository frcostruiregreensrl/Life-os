import { useEffect, useRef, useState, type RefObject } from "react";
import { Robot, type Action } from "@/components/Robot";
import { onCompanionCelebrate } from "@/lib/companionBus";
import { useAvatarColors } from "@/lib/useAvatarColors";
import { cn } from "@/lib/utils";

const SIZE = 46;
const MARGIN = 10;

export interface Waypoint {
  ref: RefObject<HTMLElement>;
  /** present only on the waypoint that reveals a hidden section — fired as soon as it's safe to show the fields */
  reveal?: () => void;
}

interface FormGuideProps {
  waypoints: Waypoint[];
  step: number;
}

interface Pos {
  top: number;
  left: number;
}

function computeTarget(el: HTMLElement): Pos {
  const rect = el.getBoundingClientRect();
  const maxLeft = window.innerWidth - SIZE - MARGIN;
  const maxTop = window.innerHeight - SIZE - MARGIN;
  return {
    left: Math.max(MARGIN, Math.min(rect.right + 10, maxLeft)),
    top: Math.max(MARGIN, Math.min(rect.top + rect.height / 2 - SIZE / 2, maxTop)),
  };
}

export function FormGuide({ waypoints, step }: FormGuideProps) {
  const { skinColor, accentColor, hairColor, faceWidthRatio } = useAvatarColors();
  const [pos, setPos] = useState<Pos | null>(null);
  const [action, setAction] = useState<Action>("point");
  const [pointDir, setPointDir] = useState<"left" | "right">("left");
  const placedIndexRef = useRef(-1);
  const posRef = useRef<Pos | null>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  function clearTimers() {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }

  function after(ms: number, fn: () => void) {
    const t = setTimeout(fn, ms);
    timersRef.current.push(t);
  }

  // settle near the first waypoint as soon as it mounts
  useEffect(() => {
    const el = waypoints[0]?.ref.current;
    if (el && placedIndexRef.current === -1) {
      placedIndexRef.current = 0;
      const target = computeTarget(el);
      posRef.current = target;
      setPos(target);
      setAction("point");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // advance the choreography when a step completes
  useEffect(() => {
    const targetIndex = Math.min(step, waypoints.length - 1);
    if (targetIndex <= placedIndexRef.current) return;
    const waypoint = waypoints[targetIndex];
    const el = waypoint?.ref.current;
    if (!el) return;

    clearTimers();
    setAction("jump");

    after(520, () => {
      const target = computeTarget(el);
      const prevPos = posRef.current;
      const goingRight = prevPos ? target.left >= prevPos.left : true;
      setPointDir(goingRight ? "left" : "right");
      setAction("walk");
      posRef.current = target;
      setPos(target);
      placedIndexRef.current = targetIndex;

      after(560, () => {
        if (waypoint.reveal) {
          setAction("reach");
          after(260, () => {
            waypoint.reveal!();
            setAction("pull");
            after(340, () => setAction("point"));
          });
        } else {
          setAction("point");
        }
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  useEffect(() => {
    return onCompanionCelebrate(() => {
      clearTimers();
      setAction("laugh");
      after(700, () => setAction("point"));
    });
  }, []);

  useEffect(() => clearTimers, []);

  if (!pos) return null;

  return (
    <div
      className={cn("pointer-events-none fixed z-40 transition-all ease-in-out")}
      style={{ top: pos.top, left: pos.left, transitionDuration: action === "walk" ? "560ms" : "200ms" }}
    >
      <Robot
        action={action}
        pointDir={pointDir}
        size={SIZE}
        skinColor={skinColor}
        accentColor={accentColor}
        hairColor={hairColor}
        faceWidthRatio={faceWidthRatio}
      />
    </div>
  );
}
