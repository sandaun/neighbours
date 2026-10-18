import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';

type ResourceState<T> =
  | { status: 'loading'; data: null; error: null }
  | { status: 'success'; data: T; error: null }
  | { status: 'error'; data: null; error: Error };

export type DataResource<T> = ResourceState<T> & {
  reload: () => void;
  refreshing: boolean;
};

export function useDataResource<T>(load: () => Promise<T>): DataResource<T> {
  const [resource, setResource] = useState<ResourceState<T>>({
    status: 'loading',
    data: null,
    error: null,
  });

  const [refreshing, setRefreshing] = useState(false);
  const active = useRef(false);
  const requestId = useRef(0);

  const reload = useCallback(() => {
    if (!active.current) return;
    const id = ++requestId.current;
    setRefreshing(true);
    setResource((previous) =>
      previous.status === 'error' ? { status: 'loading', data: null, error: null } : previous
    );
    Promise.resolve()
      .then(load)
      .then(
        (data) => {
          if (active.current && id === requestId.current) {
            setResource({ status: 'success', data, error: null });
          }
        },
        (error: unknown) => {
          if (active.current && id === requestId.current) {
            setResource({
              status: 'error',
              data: null,
              error: error instanceof Error ? error : new Error('Unable to load data'),
            });
          }
        }
      )
      .finally(() => {
        if (active.current && id === requestId.current) setRefreshing(false);
      });
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      active.current = true;
      setResource({ status: 'loading', data: null, error: null });
      reload();
      return () => {
        active.current = false;
        requestId.current += 1;
      };
    }, [reload])
  );

  return { ...resource, reload, refreshing };
}
