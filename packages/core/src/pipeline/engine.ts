/**
 * pipeline/engine.ts
 *
 * Executes stages in order:
 * - checks enabled()
 * - accumulates per-stage metrics
 * - enforces invariants (end-of-pipeline, optionally mid-pipeline)
 */
