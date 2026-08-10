import { useEffect, useRef, useState } from "react";
import { Robot } from "@/components/Robot";
import { onCompanionCelebrate } from "@/lib/companionBus";

const ROBOT_SIZE = 46;
const MARGIN = 18;
const TOP_SAFE = 84;
const BOTTOM_SAFE = 100;

function randomPoint() {
  const maxLeft = Math.max(MARGIN, window.innerWidth - ROBOT_SIZE - MARGIN);
  const maxTop = Math.max(TOP_SAFE, window.innerHeight - ROBOT_SIZE - BOTTOM_SAFE);
  return {
    left: MARGIN + Math.random() * (maxLeft - MARGIN),
    top: TOP_SAFE + Math.random() * (maxTop - TOP_SAFE),
  };
}

export function Companion() {
  const [pos, setPos] = useState(randomPoint);
  const [dancing, setDancing] = useState(false);
  const [message, setMessage] = useState<string | undefined>();
  const dancingRef = useRef(false);
  const wanderTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    function tick() {
      if (!dancingRef.current) setPos(randomPoint());
      wanderTimer.current = setTimeout(tick, 4500 + Math.random() * 4000);
    }
    wanderTimer.current = setTimeout(tick, 4500 + Math.random() * 4000);
    return () => clearTimeout(wanderTimer.current);
  }, []);

  useEffect(() => {
    return onCompanionCelebrate(({ message }) => {
      dancingRef.current = true;
      setDancing(true);
      setMessage(message);
      const timer = setTimeout(() => {
        dancingRef.current = false;
        setDancing(false);
        setMessage(undefined);
      }, 1500);
      return () => clearTimeout(timer);
    });
  }, []);

  return (
    <div
      className="pointer-events-none fixed z-40 flex flex-col items-center gap-1 transition-all ease-in-out"
      style={{ top: pos.top, left: pos.left, transitionDuration: "1800ms" }}
    >
      {message && (
        <span className="font-data whitespace-nowrap rounded-full bg-success/15 px-2 py-0.5 text-[0.6rem] text-success">
          {message}
        </span>
      )}
      <Robot state="idle" celebrate={dancing} size={ROBOT_SIZE} />
    </div>
  );
}
