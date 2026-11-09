import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { AdminClient } from '@/lib/supabase';
import { useClient } from '@/lib/use-client';

export type CrudApi<Row, Input> = {
  key: string;
  list(client: AdminClient, communityId: string): Promise<Row[]>;
  create(client: AdminClient, communityId: string, input: Input): Promise<Row>;
  update(client: AdminClient, id: string, input: Input, communityId: string): Promise<Row>;
  remove(client: AdminClient, row: Row): Promise<unknown>;
};

export function useCrud<Row, Input>(api: CrudApi<Row, Input>, communityId: string) {
  const client = useClient();
  const queryClient = useQueryClient();
  const queryKey = [api.key, communityId];
  const invalidate = () => queryClient.invalidateQueries({ queryKey });

  const list = useQuery({ queryKey, queryFn: () => api.list(client, communityId) });
  const save = useMutation({
    mutationFn: ({ id, input }: { id: string | null; input: Input }) =>
      id ? api.update(client, id, input, communityId) : api.create(client, communityId, input),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: (row: Row) => api.remove(client, row),
    onSuccess: invalidate,
  });
  return { list, save, remove };
}
