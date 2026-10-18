import { router } from 'expo-router';

import { appDataSource } from '@/data';
import { IncidentForm } from '@/features/incidents/IncidentForm';

export default function NewIncidentScreen() {
  return (
    <IncidentForm
      onSubmit={appDataSource.createIncident}
      onCreated={(incident) =>
        router.replace({
          pathname: '/incidents/[id]',
          params: { id: incident.id, photoUploadFailed: incident.photoUploadFailed ? '1' : '0' },
        })
      }
    />
  );
}
