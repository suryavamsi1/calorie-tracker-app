import { api } from './api';

/**
 * Lightweight, fire-and-forget product analytics. Powers basic funnel/
 * retention queries against the server's `events` table (see
 * server/src/routes/events.routes.ts). Never blocks or throws - a failed
 * analytics call should never affect the user-facing flow.
 */
export function track(name: string, properties?: Record<string, unknown>): void {
  api.post('/events', { name, properties }).catch(() => {
    // Analytics is best-effort; ignore failures (including when offline).
  });
}
