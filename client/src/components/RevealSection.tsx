import { cn } from "@/lib/utils";

export function RevealSection({ revealed, children }: { revealed: boolean; children: React.ReactNode }) {
  return (
    <div
      className={cn("grid transition-all duration-500 ease-out", revealed ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")}
      style={{ overflow: "hidden" }}
      aria-hidden={!revealed}
    >
      <div className="flex min-h-0 flex-col gap-2">{children}</div>
    </div>
  );
}
