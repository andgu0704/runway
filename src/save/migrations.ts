/**
 * Save migrations, keyed by the version they upgrade from: `migrations[n]`
 * turns a version-n save into a version-(n+1) save. Each must be pure and
 * covered by a fixture test. Version 1 is the first format, so none exist yet.
 */
export const migrations: Record<
  number,
  (save: Record<string, unknown>) => Record<string, unknown>
> = {};
