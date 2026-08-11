import { useEffect, useRef, useState } from "react";
import { Robot, type Action } from "@/components/Robot";
import { onCompanionCelebrate } from "@/lib/companionBus";
import { useAvatarColors } from "@/lib/useAvatarColors";

const SIZE = 46;
const MARGIN = 18;
const TOP_SAFE = 84;
const BOTTOM_SAFE = 100;
const WALK_MS = 1800;
const DANCE_MS = 2300;

function randomPoint() {
  const maxLeft = Math.max(MARGIN, window.innerWidth - SIZE - MARGIN);
  const maxTop = Math.max(TOP_SAFE, window.innerHeight - SIZE - BOTTOM_SAFE);
  return {
    left: MARGIN + Math.random() * (maxLeft - MARGIN),
    top: TOP_SAFE + Math.random() * (maxTop - TOP_SAFE),
  };
}

export function Companion() {
  const { skinColor, accentColor } = useAvatarColors();
  const [pos, setPos] = useState(randomPoint);
  const [action, setAction] = useState<Action>("idle");
  const [message, setMessage] = useState<string | undefined>();
  const busyRef = useRef(false);
  const wanderTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    function tick() {
      if (!busyRef.current) {
        busyRef.current = true;
        setAction("walk");
        setPos(randomPoint());
        setTimeout(() => {
          setAction("idle");
          busyRef.current = false;
        }, WALK_MS);
      }
      wanderTimer.current = setTimeout(tick, 5000 + Math.random() * 4000);
    }
    wanderTimer.current = setTimeout(tick, 5000 + Math.random() * 4000);
    return () => clearTimeout(wanderTimer.current);
  }, []);

  useEffect(() => {
    return onCompanionCelebrate(({ message }) => {
      busyRef.current = true;
      setAction("dance");
      setMessage(message);
      const timer = setTimeout(() => {
        setAction("idle");
        setMessage(undefined);
        busyRef.current = false;
      }, DANCE_MS);
      return () => clearTimeout(timer);
    });
  }, []);

  return (
    <div
      className="pointer-events-none fixed z-40 flex flex-col items-center gap-1 transition-all ease-in-out"
      style={{ top: pos.top, left: pos.left, transitionDuration: `${WALK_MS}ms` }}
    >
      {message && (
        <span className="font-data whitespace-nowrap rounded-full bg-success/15 px-2 py-0.5 text-[0.6rem] text-success">
          {message}
        </span>
      )}
      <Robot action={action} size={SIZE} skinColor={skinColor} accentColor={accentColor} />
    </div>
  );
}
