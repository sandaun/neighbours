import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  addIncidentUpdate,
  getIncident,
  type IncidentStatus,
  listIncidents,
} from './incidents-api';
import { useClient } from '@/lib/use-client';

export const incidentKeys = {
  list: (communityId: string) => ['incidents', communityId] as const,
  detail: (communityId: string, incidentId: string) =>
    ['incidents', communityId, incidentId] as const,
};

export function useIncidents(communityId: string) {
  const client = useClient();
  return useQuery({
    queryKey: incidentKeys.list(communityId),
    queryFn: () => listIncidents(client, communityId),
  });
}

export function useIncident(communityId: string, incidentId: string) {
  const client = useClient();
  return useQuery({
    queryKey: incidentKeys.detail(communityId, incidentId),
    queryFn: () => getIncident(client, communityId, incidentId),
  });
}

export function useAddIncidentUpdate(communityId: string, incidentId: string) {
  const client = useClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { body: string; status: IncidentStatus | null }) =>
      addIncidentUpdate(client, { incidentId, ...input }),
    // The list and the detail both show the status; refresh the community's incidents.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: incidentKeys.list(communityId) }),
  });
}
