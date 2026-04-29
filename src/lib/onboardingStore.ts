/**
 * Tiny pub-sub so any component (e.g. Config → "Cómo usar") can re-trigger
 * the Onboarding overlay without owning a ref to it.
 *
 * Onboarding registers a handler on mount; callers invoke `triggerOnboarding`
 * to flip its visibility back on. No external state is exposed — Onboarding
 * still owns its own step/show state internally.
 */

type Handler = () => void;
let handler: Handler | null = null;

export function registerOnboardingTrigger(fn: Handler | null) {
  handler = fn;
}

export function triggerOnboarding() {
  handler?.();
}
