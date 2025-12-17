/**
 * stages/guards/maxReductionGate.ts
 *
 * Applies global reduction limits:
 * - if tokens_after < tokens_before * (1 - maxReductionPct)
 *   - revert aggressive cuts or
 *   - disable later stages and re-run (engine strategy dependent)
 */
