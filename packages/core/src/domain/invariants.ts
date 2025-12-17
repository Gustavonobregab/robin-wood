/**
 * domain/invariants.ts
 *
 * Rules that must always hold:
 * - system/developer messages preserved (when required by policy)
 * - recent user instruction preserved
 * - never return an empty message array
 * - never exceed maxReductionPct when gate is active
 */
