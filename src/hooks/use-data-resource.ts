import { useEffect, useState } from 'react';

export type DataResource<T> =
  | { status: 'loading'; data: null; error: null }
  | { status: 'success'; data: T; error: null }
  | { status: 'error'; data: null; error: Error };

export function useDataResource<T>(load: () => Promise<T>): DataResource<T> {
  const [resource, setResource] = useState<DataResource<T>>({
    status: 'loading',
    data: null,
    error: null,
  });

  useEffect(() => {
    let isActive = true;

    load().then(
      (data) => {
        if (isActive) {
          setResource({ status: 'success', data, error: null });
        }
      },
      (error: unknown) => {
        if (isActive) {
          setResource({
            status: 'error',
            data: null,
            error: error instanceof Error ? error : new Error('Unable to load data'),
          });
        }
      }
    );

    return () => {
      isActive = false;
    };
  }, [load]);

  return resource;
}
