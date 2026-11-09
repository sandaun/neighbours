import { useState } from 'react';

// A stable "now" for the life of the screen, so renders stay pure.
export function useNow(): number {
  const [now] = useState(() => Date.now());
  return now;
}
