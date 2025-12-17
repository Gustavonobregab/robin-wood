/**
 * stages/normalize/truncateLogs.ts
 *
 * Safely truncates logs/dumps:
 * - keeps header + tail
 * - inserts "truncated" marker
 * - records audit event with before/after sizes
 */
