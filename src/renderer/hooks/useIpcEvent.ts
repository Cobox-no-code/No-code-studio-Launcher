import { useEffect, useRef } from "react";

/**
 * Subscribe to a push-channel via any `onX` function exposed by the preload.
 * The subscriber must return an unsubscribe function (our preload contract).
 *
 * Usage:
 *   useIpcEvent(cobox.updater.onStateChanged, (state) => setState(state));
 */
export function useIpcEvent<T>(
  subscribe: (cb: (data: T) => void) => () => void,
  handler: (data: T) => void,
) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    const unsub = subscribe((d) => handlerRef.current(d));
    return unsub;
  }, [subscribe]);
}
