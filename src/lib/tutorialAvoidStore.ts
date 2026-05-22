'use client';
import { useEffect, useRef, useSyncExternalStore } from 'react';

/**
 * Coordination layer between the tutorial banner and the bottom-sheet modals
 * (kebab / share / paste / import / confirm / groups grid). Two responsibilities:
 *
 *   1. Ref-counted push-up flag — while any modal is mounted, the tutorial
 *      banner slides from its bottom-anchored default up to the top of the
 *      viewport so both the hint AND the modal stay readable.
 *
 *   2. Close-on-advance — each modal registers its `onClose` callback. When
 *      the user advances the tutorial (Next / Prev), we fire ALL registered
 *      callbacks so the modals close before the next step lands. Otherwise
 *      the user would carry a stale modal from one step (and possibly one
 *      page) into the next.
 *
 * Modals participate via `useAvoidTutorial(onClose)`. Hooking onClose is
 * optional — pass nothing if you want the push-up behaviour without the
 * close-on-advance (e.g. modals you specifically WANT to survive Next).
 */

let pushCount = 0;
const flagListeners = new Set<() => void>();
const closeCallbacks = new Set<() => void>();

function notify() {
  for (const fn of flagListeners) fn();
}

function subscribe(fn: () => void) {
  flagListeners.add(fn);
  return () => { flagListeners.delete(fn); };
}

function getSnapshot() { return pushCount > 0; }
function getServerSnapshot() { return false; }

/** True while at least one consumer is currently mounted asking the banner up. */
export function useTutorialPushedUp(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/**
 * Fires every registered onClose callback. Called by the Onboarding banner
 * when the user advances or rewinds — closes any stack of open modals so
 * the next step starts with a clean viewport.
 */
export function closeAllAvoidingTutorial() {
  // Snapshot first to avoid mutation-during-iteration when an onClose
  // synchronously unmounts and triggers the cleanup that deletes its entry.
  for (const fn of [...closeCallbacks]) fn();
}

/**
 * Hook for bottom-sheet modals:
 *
 *   - While mounted: pushes the tutorial banner up (out of the modal's way).
 *   - If `onClose` is provided: registers it so the tutorial can close this
 *     modal when the user advances. Uses a ref internally so callers don't
 *     have to memoize the callback to avoid double-registrations.
 */
export function useAvoidTutorial(onClose?: () => void) {
  const ref = useRef(onClose);
  ref.current = onClose;
  useEffect(() => {
    pushCount += 1;
    // Wrap in a stable closure that reads the latest onClose each call.
    const stableClose = () => ref.current?.();
    closeCallbacks.add(stableClose);
    notify();
    return () => {
      pushCount = Math.max(0, pushCount - 1);
      closeCallbacks.delete(stableClose);
      notify();
    };
  }, []);
}
