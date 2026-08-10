interface CelebratePayload {
  message?: string;
}

const bus = new EventTarget();

export function celebrateCompanion(message?: string) {
  bus.dispatchEvent(new CustomEvent<CelebratePayload>("celebrate", { detail: { message } }));
}

export function onCompanionCelebrate(handler: (payload: CelebratePayload) => void) {
  const listener = (event: Event) => handler((event as CustomEvent<CelebratePayload>).detail);
  bus.addEventListener("celebrate", listener);
  return () => bus.removeEventListener("celebrate", listener);
}
