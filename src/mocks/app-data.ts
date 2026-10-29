import type { AppDataSource } from '@/data/app-data-source';
import type {
  AccountsData,
  BoardPost,
  CommunityDocument,
  HomeData,
  Incident,
  IncidentDetail,
  MoreModuleData,
  MoreModuleKey,
} from '@/data/types';

const incidents: Incident[] = [
  {
    id: 'incident-elevator',
    title: "Avaria a l'ascensor",
    location: 'Vestíbul · escala A',
    reportedAt: '2026-08-12T08:30:00+02:00',
    status: 'in-progress',
  },
  {
    id: 'incident-garage',
    title: "Goteig a l'aparcament",
    location: 'Planta -1 · plaça 18',
    reportedAt: '2026-08-08T17:10:00+02:00',
    status: 'resolved',
  },
  {
    id: 'incident-light',
    title: 'Llum del replà fosa',
    location: '3r pis · escala B',
    reportedAt: '2026-08-14T07:45:00+02:00',
    status: 'received',
  },
];

const parkingPost: BoardPost = {
  id: 'post-parking',
  author: 'Marta Vidal',
  authorInitials: 'MV',
  body: 'Llogo la meva plaça de garatge (la núm. 35) per si algun veí/na de la finca està interessat.',
  commentsCount: 0,
  publishedAt: '2026-08-13T18:25:00+02:00',
  topic: 'Parking',
};

const home: HomeData = {
  communityName: 'Carrer del Mar 14',
  incidents: incidents.slice(0, 2),
  events: [
    {
      id: 'event-meeting',
      title: 'Junta ordinària',
      startsAt: '2026-08-22T19:00:00+02:00',
      location: 'Saló comunitari',
    },
  ],
  boardPosts: [parkingPost],
};

const documents: CommunityDocument[] = [
  {
    id: 'document-minutes-june',
    title: 'Acta de la junta de juny',
    category: 'minutes',
    fileType: 'PDF',
    fileSize: '1,4 MB',
    updatedAt: '2026-06-29T12:00:00+02:00',
  },
  {
    id: 'document-insurance',
    title: 'Pòlissa de la comunitat 2026',
    category: 'insurance',
    fileType: 'PDF',
    fileSize: '860 KB',
    updatedAt: '2026-01-09T10:00:00+01:00',
  },
  {
    id: 'document-pool-rules',
    title: "Normes d'ús de la piscina",
    category: 'rules',
    fileType: 'PDF',
    fileSize: '320 KB',
    updatedAt: '2026-05-15T09:30:00+02:00',
  },
];

const accounts: AccountsData = {
  balanceCents: 0,
  nextChargeAt: '2026-09-01T08:00:00+02:00',
  nextChargeCents: 7850,
  receipts: [
    {
      id: 'receipt-august',
      concept: 'Quota ordinària',
      amountCents: 7850,
      issuedAt: '2026-08-01T08:00:00+02:00',
      period: 'Agost 2026',
      status: 'paid',
    },
    {
      id: 'receipt-july',
      concept: 'Quota ordinària',
      amountCents: 7850,
      issuedAt: '2026-07-01T08:00:00+02:00',
      period: 'Juliol 2026',
      status: 'paid',
    },
    {
      id: 'receipt-special',
      concept: 'Derrama façana',
      amountCents: 12500,
      issuedAt: '2026-09-15T08:00:00+02:00',
      period: '1a quota de 4',
      status: 'scheduled',
    },
  ],
};

const moreModules: Record<MoreModuleKey, MoreModuleData> = {
  voting: {
    key: 'voting',
    descriptionKey: 'more.modules.voting.description',
    highlight: { labelKey: 'more.modules.voting.highlight', value: '1', tone: 'warning' },
    sections: [
      {
        id: 'active',
        titleKey: 'more.modules.sections.active',
        items: [
          {
            id: 'vote-charger',
            title: 'Instal·lació de carregadors elèctrics',
            subtitle: 'Participació: 18 de 24 habitatges',
            meta: 'Oberta fins diumenge · 23:59',
            badgeKey: 'more.modules.badges.pendingVote',
            tone: 'warning',
          },
        ],
      },
      {
        id: 'recent',
        titleKey: 'more.modules.sections.recent',
        items: [
          {
            id: 'vote-garden',
            title: 'Renovació del jardí interior',
            subtitle: 'Aprovada amb un 72% dels coeficients',
            meta: 'Tancada el 30 de juliol',
            badgeKey: 'more.modules.badges.approved',
            tone: 'success',
          },
        ],
      },
    ],
  },
  board: {
    key: 'board',
    descriptionKey: 'more.modules.board.description',
    highlight: { labelKey: 'more.modules.board.highlight', value: '4' },
    sections: [
      {
        id: 'latest',
        titleKey: 'more.modules.sections.latest',
        items: [
          {
            id: parkingPost.id,
            title: 'Plaça de garatge en lloguer',
            topic: parkingPost.topic,
            subtitle: parkingPost.body,
            meta: `${parkingPost.author} · ${parkingPost.topic}`,
            publishedAt: parkingPost.publishedAt,
          },
          {
            id: 'board-bicycle',
            title: 'Bicicleta trobada al garatge',
            topic: 'Objectes perduts',
            subtitle: 'Jordi Roca · 2n 1a',
            meta: 'Publicat ahir · 2 comentaris',
            badgeKey: 'more.modules.badges.lostAndFound',
          },
          {
            id: 'board-garden',
            title: 'Cura del jardí interior',
            topic: 'Jardí',
            subtitle: 'Dissabte revisarem el reg i les plantes del pati.',
            meta: 'Administració · Jardí',
          },
          {
            id: 'board-activities',
            title: 'Trobada de veïns',
            topic: 'Activitats',
            subtitle: 'Ens trobem a la sala comunitària per compartir propostes.',
            meta: 'Sara Martí · Activitats',
          },
        ],
      },
    ],
  },
  bookings: {
    key: 'bookings',
    descriptionKey: 'more.modules.bookings.description',
    highlight: { labelKey: 'more.modules.bookings.highlight', value: '2' },
    sections: [
      {
        id: 'spaces',
        titleKey: 'more.modules.sections.availableSpaces',
        items: [
          {
            id: 'booking-room',
            title: 'Saló comunitari',
            subtitle: 'Fins a 30 persones · 4 h màxim',
            meta: 'Proper torn lliure: dissabte a les 10:00',
            badgeKey: 'more.modules.badges.available',
            tone: 'success',
          },
          {
            id: 'booking-court',
            title: 'Pista poliesportiva',
            subtitle: 'Torns de 60 minuts',
            meta: 'Proper torn lliure: avui a les 18:00',
            badgeKey: 'more.modules.badges.available',
            tone: 'success',
          },
        ],
      },
    ],
  },
  calendar: {
    key: 'calendar',
    descriptionKey: 'more.modules.calendar.description',
    highlight: { labelKey: 'more.modules.calendar.highlight', value: '3' },
    sections: [
      {
        id: 'august',
        titleKey: 'more.modules.sections.august',
        items: [
          {
            id: 'calendar-maintenance',
            title: 'Manteniment de la piscina',
            subtitle: 'Dissabte 16 · 8:00–12:00',
            meta: 'Zona comunitària',
            startsAt: '2026-08-16T08:00:00+02:00',
            endsAt: '2026-08-16T12:00:00+02:00',
          },
          {
            id: 'calendar-meeting',
            title: 'Junta ordinària',
            subtitle: 'Divendres 22 · 19:00',
            meta: 'Saló comunitari',
            startsAt: '2026-08-22T19:00:00+02:00',
          },
          {
            id: 'calendar-garage',
            title: 'Neteja de l’aparcament',
            subtitle: 'Dijous 28 · 9:00–13:00',
            meta: 'Plantes -1 i -2',
            startsAt: '2026-08-28T09:00:00+02:00',
            endsAt: '2026-08-28T13:00:00+02:00',
          },
        ],
      },
    ],
  },
  directory: {
    key: 'directory',
    descriptionKey: 'more.modules.directory.description',
    highlight: { labelKey: 'more.modules.directory.highlight', value: '8' },
    sections: [
      {
        id: 'maintenance',
        titleKey: 'more.modules.sections.maintenance',
        items: [
          {
            id: 'directory-admin',
            title: 'Administració Finques Mar',
            subtitle: 'Administració de la comunitat',
            meta: '93 555 14 14 · dl–dv, 9:00–17:00',
            badgeKey: 'more.modules.badges.administration',
          },
          {
            id: 'directory-elevator',
            title: 'Ascensors Litoral',
            subtitle: 'Manteniment i avaries 24 h',
            meta: '900 123 456',
            badgeKey: 'more.modules.badges.elevator',
          },
          {
            id: 'directory-plumber',
            title: 'Serveis Font BCN',
            subtitle: 'Fontaneria i humitats',
            meta: '93 555 80 21',
            badgeKey: 'more.modules.badges.plumbing',
          },
        ],
      },
    ],
  },
  access: {
    key: 'access',
    descriptionKey: 'more.modules.access.description',
    highlight: { labelKey: 'more.modules.access.highlight', value: '1', tone: 'success' },
    sections: [
      {
        id: 'active',
        titleKey: 'more.modules.sections.activeAccess',
        items: [
          {
            id: 'access-cleaning',
            title: 'Servei de neteja',
            subtitle: 'Accés al portal i zones comunes',
            meta: 'Vàlid avui de 8:00 a 14:00',
            badgeKey: 'more.modules.badges.active',
            tone: 'success',
          },
        ],
      },
      {
        id: 'compatibility',
        titleKey: 'more.modules.sections.compatibility',
        items: [
          {
            id: 'access-portal',
            title: 'Portal principal',
            subtitle: 'Compatible amb accessos temporals',
            badgeKey: 'more.modules.badges.compatible',
            tone: 'success',
          },
          {
            id: 'access-garage',
            title: 'Porta del garatge',
            subtitle: 'Requereix comandament físic',
            badgeKey: 'more.modules.badges.notCompatible',
          },
        ],
      },
    ],
  },
  emergencies: {
    key: 'emergencies',
    descriptionKey: 'more.modules.emergencies.description',
    highlight: {
      labelKey: 'more.modules.emergencies.highlight',
      value: '24 h',
      tone: 'danger',
    },
    sections: [
      {
        id: 'contacts',
        titleKey: 'more.modules.sections.emergencyContacts',
        items: [
          {
            id: 'emergency-general',
            title: 'Emergències',
            subtitle: 'Bombers, policia i emergències mèdiques',
            meta: '112',
            badgeKey: 'more.modules.badges.call',
            tone: 'danger',
          },
          {
            id: 'emergency-elevator',
            title: 'Ascensors Litoral',
            subtitle: 'Persones atrapades o avaria urgent',
            meta: '900 123 456',
            badgeKey: 'more.modules.badges.alwaysOpen',
            tone: 'danger',
          },
          {
            id: 'emergency-water',
            title: 'Avaria general d’aigua',
            subtitle: 'Clau de pas i servei de guàrdia',
            meta: '93 555 80 21',
            badgeKey: 'more.modules.badges.onCall',
            tone: 'danger',
          },
        ],
      },
    ],
  },
  profile: {
    key: 'profile',
    descriptionKey: 'more.modules.profile.description',
    highlight: { labelKey: 'more.modules.profile.highlight', value: 'Marta Vidal' },
    sections: [
      {
        id: 'property',
        titleKey: 'more.modules.sections.myProperty',
        items: [
          {
            id: 'profile-home',
            title: '3r 2a · escala A',
            subtitle: 'Habitatge principal',
            meta: 'Coeficient de participació: 4,18%',
          },
          {
            id: 'profile-parking',
            title: 'Plaça d’aparcament 18',
            subtitle: 'Planta -1',
            meta: 'Coeficient de participació: 0,42%',
          },
        ],
      },
      {
        id: 'contact',
        titleKey: 'more.modules.sections.contactDetails',
        items: [
          {
            id: 'profile-contact',
            title: 'marta.vidal@example.com',
            subtitle: '+34 612 345 678',
            badgeKey: 'more.modules.badges.verified',
            tone: 'success',
          },
        ],
      },
    ],
  },
  notifications: {
    key: 'notifications',
    descriptionKey: 'more.modules.notifications.description',
    highlight: { labelKey: 'more.modules.notifications.highlight', value: '4' },
    sections: [
      {
        id: 'preferences',
        titleKey: 'more.modules.sections.preferences',
        items: [
          {
            id: 'notification-incidents',
            title: 'Incidències',
            subtitle: 'Canvis d’estat i comentaris de l’administració',
            badgeKey: 'more.modules.badges.enabled',
            tone: 'success',
          },
          {
            id: 'notification-voting',
            title: 'Votacions',
            subtitle: 'Obertura, recordatoris i resultats',
            badgeKey: 'more.modules.badges.enabled',
            tone: 'success',
          },
          {
            id: 'notification-receipts',
            title: 'Rebuts',
            subtitle: 'Nous càrrecs i derrames',
            badgeKey: 'more.modules.badges.enabled',
            tone: 'success',
          },
          {
            id: 'notification-board',
            title: 'Tauló',
            subtitle: 'Només publicacions destacades',
            badgeKey: 'more.modules.badges.highlightsOnly',
          },
        ],
      },
    ],
  },
  language: {
    key: 'language',
    descriptionKey: 'more.modules.language.description',
    highlight: { labelKey: 'more.modules.language.highlight', value: 'Català' },
    sections: [
      {
        id: 'languages',
        titleKey: 'more.modules.sections.appLanguage',
        items: [
          {
            id: 'language-ca',
            title: 'Català',
            subtitle: 'Idioma actual de l’aplicació',
            badgeKey: 'more.modules.badges.selected',
            tone: 'success',
          },
          {
            id: 'language-es',
            title: 'Castellano',
            subtitle: 'Disponible',
          },
        ],
      },
    ],
  },
  privacy: {
    key: 'privacy',
    descriptionKey: 'more.modules.privacy.description',
    highlight: { labelKey: 'more.modules.privacy.highlight', value: 'Protegides' },
    sections: [
      {
        id: 'controls',
        titleKey: 'more.modules.sections.yourData',
        items: [
          {
            id: 'privacy-download',
            title: 'Descarregar les meves dades',
            subtitle: 'Sol·licita una còpia de la informació del teu compte',
          },
          {
            id: 'privacy-permissions',
            title: 'Permisos de l’aplicació',
            subtitle: 'Notificacions, càmera i biblioteca de fotos',
          },
          {
            id: 'privacy-policy',
            title: 'Política de privacitat',
            subtitle: 'Última actualització: 1 d’agost de 2026',
          },
        ],
      },
    ],
  },
};

const incidentDetails = new Map<string, IncidentDetail>(
  incidents.map((incident) => [
    incident.id,
    {
      ...incident,
      category: incident.id === 'incident-elevator' ? 'elevator' : 'other',
      description: incident.title,
      updates:
        incident.status === 'received'
          ? []
          : [
              {
                id: `${incident.id}-update`,
                body:
                  incident.status === 'resolved'
                    ? 'La reparació ha finalitzat. La incidència està resolta.'
                    : 'Hem avisat el servei de manteniment i estem coordinant la visita.',
                authorName: 'Administració',
                createdAt: incident.reportedAt,
                status: incident.status,
              },
            ],
    },
  ])
);
let demoIncidentSequence = 0;

function resolveMock<T>(value: T): Promise<T> {
  return Promise.resolve(value);
}

export const mockAppDataSource: AppDataSource = {
  getAccounts: () => resolveMock(accounts),
  getDocuments: () => resolveMock(documents),
  getHome: () =>
    resolveMock({ ...home, incidents: [...incidentDetails.values()].reverse().slice(0, 3) }),
  getIncidents: () => resolveMock([...incidentDetails.values()].reverse()),
  getMoreModule: (key) => resolveMock(moreModules[key]),
  getIncident: async (id) => {
    const incident = incidentDetails.get(id);
    if (!incident) throw new Error('Incident not found');
    return resolveMock(incident);
  },
  createIncident: async (input) => {
    const incident: IncidentDetail = {
      id: `demo-incident-${++demoIncidentSequence}`,
      title: input.title.trim(),
      location: input.location.trim(),
      description: input.description.trim(),
      category: input.category,
      status: 'received',
      reportedAt: new Date().toISOString(),
      updates: [],
      ...(input.photo
        ? { photoUrl: `data:${input.photo.mimeType};base64,${input.photo.base64}` }
        : {}),
    };
    incidentDetails.set(incident.id, incident);
    return resolveMock(incident);
  },
  getDocumentUrl: async () => {
    throw new Error('Demo documents do not contain real files');
  },
  getReceiptUrl: async () => {
    throw new Error('Demo receipts do not contain real files');
  },
};
