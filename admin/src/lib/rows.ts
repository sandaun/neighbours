// RLS skips rows the caller may not change instead of failing, so writes return
// the affected row and treat "no row" as an error.
export function one<T>(result: { data: T[] | null; error: Error | null }): T {
  if (result.error) throw result.error;
  const row = result.data?.[0];
  if (!row) throw new Error('The row does not exist or cannot be changed.');
  return row;
}
