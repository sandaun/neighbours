"""Generate repeatable pilot content and transactional SQL using only the standard library.

Never creates Auth users, uploads files, or sends mail.
"""

import argparse
import calendar
import json
from datetime import date, timedelta
from pathlib import Path
from uuid import UUID, uuid5

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--community-id', required=True, type=UUID)
parser.add_argument('--unit-id', required=True, type=UUID)
parser.add_argument('--reporter-id', required=True, type=UUID)
parser.add_argument('--date', required=True, type=date.fromisoformat)
parser.add_argument('--output', type=Path, default=Path('.sample-data'))
args = parser.parse_args()
community, unit, reporter = map(str, (args.community_id, args.unit_id, args.reporter_id))
root = args.output
root.mkdir(parents=True, exist_ok=True)
namespace = UUID('8b9747ac-ce7f-4f14-a8b3-21892a02bff2')


def identifier(key):
    return str(uuid5(namespace, f'{community}:{unit}:{key}'))


def timestamp(days, hour=10):
    day = args.date + timedelta(days=days)
    return f'{day.isoformat()}T{hour:02}:00:00Z'


def month_date(offset, day=1):
    index = args.date.year * 12 + args.date.month - 1 + offset
    year, month = divmod(index, 12)
    return date(year, month + 1, min(day, calendar.monthrange(year, month + 1)[1]))


incident_specs = [
    ('Ascensor aturat a la planta baixa', 'Vestíbul · escala A', 'elevator', 'La cabina no respon als botons del replà. La porta està tancada i no hi ha persones a dins.'),
    ('Fuita a la clau de pas del garatge', 'Aparcament · planta -1', 'plumbing', 'La unió de la canonada degota de manera contínua i s’ha delimitat la zona humida.'),
    ('Llum del replà intermitent', '3r pis · escala B', 'electrical', 'El fluorescent s’encén i s’apaga cada pocs segons quan es prem el temporitzador.'),
    ('Porta del portal no tanca bé', 'Portal principal', 'other', 'El tancaportes deixa la porta oberta uns centímetres i cal ajustar el mecanisme.'),
    ('Soroll al motor de l’ascensor', 'Sala de màquines · escala B', 'elevator', 'Durant la pujada se sent una vibració més forta de l’habitual a les plantes superiors.'),
    ('Humitat a la paret del traster', 'Trasters · passadís nord', 'plumbing', 'Ha aparegut una taca d’humitat després de la pluja. La zona està senyalitzada.'),
    ('Sensor del garatge sense resposta', 'Rampa d’accés', 'electrical', 'El llum de la rampa no s’activa en detectar el pas de vehicles al vespre.'),
    ('Rajola solta al vestíbul', 'Vestíbul · escala A', 'other', 'La rajola al costat de les bústies es mou quan es trepitja i convé fixar-la.'),
    ('Aixeta del jardí degota', 'Jardí interior', 'plumbing', 'L’aixeta del punt de reg no queda completament tancada i perd aigua.'),
    ('Botó del segon pis desgastat', 'Ascensor · escala A', 'elevator', 'El botó interior necessita diverses pulsacions per seleccionar el segon pis.'),
    ('Timbre comunitari sense so', 'Entrada · escala B', 'electrical', 'El polsador de servei no emet so al receptor de la consergeria.'),
    ('Barana fluixa a l’escala', 'Escala B · entre 2n i 3r', 'other', 'Un dels ancoratges de la barana té joc. S’ha avisat per revisar-ne la fixació.'),
    ('Desguàs de terrassa embussat', 'Terrassa comunitària', 'plumbing', 'Després de la pluja queda aigua acumulada al voltant del baixant principal.'),
    ('Enllumenat d’emergència apagat', 'Sortida del garatge', 'electrical', 'El pilot de la llum d’emergència no s’encén durant la comprovació habitual.'),
    ('Mirall de l’ascensor esquerdat', 'Cabina · escala B', 'elevator', 'Hi ha una esquerda petita a la cantonada inferior del mirall de la cabina.'),
    ('Pany de la sala comunitària dur', 'Sala comunitària', 'other', 'La clau gira amb dificultat i s’ha de revisar abans que es bloquegi el pany.'),
    ('Pèrdua d’aigua al comptador', 'Quart de comptadors', 'plumbing', 'S’observa humitat a la base d’una connexió del comptador general.'),
    ('Interruptor del passadís trencat', 'Trasters · accés sud', 'electrical', 'La tapa del polsador està desencaixada i el mecanisme queda enfonsat.'),
    ('Porta d’ascensor lenta', '1r pis · escala A', 'elevator', 'La porta tarda més de l’habitual a obrir-se i fa un soroll de fregament.'),
    ('Pintura aixecada al sostre', 'Vestíbul · escala B', 'other', 'La pintura del sostre s’ha aixecat en una zona petita després de reparar una filtració.'),
    ('Reg automàtic fora d’horari', 'Parterre de l’entrada', 'plumbing', 'El reg s’activa al migdia en lloc de fer-ho a primera hora del matí.'),
    ('Punt de llum exterior fos', 'Accés al jardí', 'electrical', 'El fanal que il·lumina l’accés al jardí no s’encén a la nit.'),
    ('Indicador de planta incorrecte', 'Ascensor · escala B', 'elevator', 'La pantalla indica la tercera planta quan la cabina és a la segona.'),
    ('Bústia comunitària desajustada', 'Zona de bústies', 'other', 'La porta de la bústia de l’administració queda oberta perquè la frontissa té joc.'),
    ('Olor al sifó del garatge', 'Aparcament · planta -2', 'plumbing', 'Es nota olor persistent a prop del desguàs després de diversos dies sense pluja.'),
    ('Temporitzador massa curt', 'Escala A · replans', 'electrical', 'La llum s’apaga abans d’arribar a la planta superior caminant amb normalitat.'),
    ('Passamà de cabina solt', 'Ascensor · escala A', 'elevator', 'El suport dret del passamà interior de la cabina es mou lleugerament.'),
    ('Topall de porta desprès', 'Accés als trasters', 'other', 'El topall ha caigut i la maneta colpeja la paret en obrir del tot la porta.'),
    ('Baixant amb degoteig puntual', 'Pati interior', 'plumbing', 'La junta del baixant perd unes gotes quan es fa servir aigua a les plantes superiors.'),
    ('Llum de la sala sense resposta', 'Sala comunitària', 'electrical', 'Una de les dues línies de llum no s’encén tot i accionar l’interruptor.'),
]
incidents, updates = [], []
for index, (title, location, category, description) in enumerate(incident_specs):
    status = ['received', 'in-progress', 'resolved'][index % 3]
    days = -(index * 2 + 1)
    incident_id = identifier(f'incident-{index}')
    incidents.append(dict(id=incident_id, community_id=community, reporter_id=reporter,
                          title=title, description=description, location=location,
                          category=category, status=status, reported_at=timestamp(days)))
    updates.append(dict(id=identifier(f'update-{index}-received'), incident_id=incident_id,
                        body='Avís de mostra registrat. L’administració en revisarà els detalls.',
                        author_name='Administració · Mostra', status='received', created_at=timestamp(days, 11)))
    if status != 'received':
        updates.append(dict(id=identifier(f'update-{index}-progress'), incident_id=incident_id,
                            body='El servei de manteniment ha confirmat la visita per revisar l’avaria.',
                            author_name='Administració · Mostra', status='in-progress', created_at=timestamp(days + 1, 9)))
    if status == 'resolved':
        updates.append(dict(id=identifier(f'update-{index}-resolved'), incident_id=incident_id,
                            body='Reparació finalitzada i funcionament comprovat amb el servei tècnic.',
                            author_name='Administració · Mostra', status='resolved', created_at=timestamp(days + 2, 12)))

# Six minutes, four insurance examples, and five rules documents.
document_specs = [(f'Acta de la junta - {month_date(-i).strftime("%m/%Y")}', 'minutes') for i in range(6)]
document_specs += [(title, 'insurance') for title in [
    'Resum de l’assegurança comunitària', 'Annex de cobertures d’aigua',
    'Guia de comunicació de sinistres', 'Revisió anual de cobertures',
]]
document_specs += [(title, 'rules') for title in [
    'Normes de convivència', 'Ús de la sala comunitària', 'Normes de l’aparcament',
    'Recollida selectiva de residus', 'Protocol de manteniment',
]]
documents = []
for index, (title, category) in enumerate(document_specs):
    documents.append(dict(id=identifier(f'document-{index}'), community_id=community, title=title,
                          category=category, file_size_bytes=0,
                          storage_path=None, updated_at=timestamp(-index * 5)))

receipts = []
for index in range(16):
    ordinary = index < 14
    offset = index - 12 if ordinary else index - 14
    issued = month_date(offset, 1 if ordinary else 15)
    amount = 7850 if ordinary else 12500
    status = 'paid' if issued <= args.date else 'scheduled'
    concept = 'Quota ordinària' if ordinary else 'Derrama de rehabilitació'
    period = issued.strftime('%m/%Y') if ordinary else f'Quota {index - 13} de 2 · {issued:%m/%Y}'
    receipts.append(dict(id=identifier(f'receipt-{index}'), community_id=community, unit_id=unit,
                         concept=concept, amount_cents=amount, issued_at=issued.isoformat(),
                         period=period, status=status, storage_path=None))

next_receipt = min((r for r in receipts if r['status'] == 'scheduled'), key=lambda r: r['issued_at'])
next_charge_date = next_receipt['issued_at']
next_charge_cents = sum(r['amount_cents'] for r in receipts if r['status'] == 'scheduled' and r['issued_at'] == next_charge_date)
event_specs = [
    ('Junta ordinària', 'Sala comunitària', 19, 2),
    ('Revisió dels ascensors', 'Escales A i B', 9, 3),
    ('Neteja de l’aparcament', 'Plantes -1 i -2', 8, 4),
    ('Manteniment del jardí', 'Jardí interior', 10, 2),
    ('Revisió de l’enllumenat', 'Zones comunes', 9, 2),
    ('Inspecció de les cobertes', 'Terrassa comunitària', 10, 3),
    ('Revisió d’extintors', 'Vestíbuls i garatge', 9, 2),
    ('Trobada de veïns', 'Sala comunitària', 18, 2),
    ('Lectura de comptadors', 'Quart de comptadors', 11, 1),
    ('Revisió del porter automàtic', 'Portal principal', 10, 2),
    ('Neteja de vidres', 'Escales A i B', 9, 3),
    ('Revisió de portes del garatge', 'Aparcament', 9, 2),
    ('Sessió de pressupostos', 'Sala comunitària', 19, 1),
]
events = []
for index in range(25):
    title, location, hour, duration = event_specs[index % len(event_specs)]
    # Include two events today and spread the rest across past/future months.
    offset = 0 if index in (8, 9) else (index - 8) * 4
    events.append(dict(id=identifier(f'event-{index}'), community_id=community, title=title,
                       location=location, starts_at=timestamp(offset, hour),
                       ends_at=timestamp(offset, hour + duration)))

post_specs = [
    ('Revisió dels ascensors', 'Demà al matí es revisaran les dues instal·lacions. El servei s’aturarà per torns i s’avisarà a cada escala.', 'Administració', 'Manteniment'),
    ('Plaça de garatge en lloguer', 'Llogo la meva plaça de garatge (la núm. 35) per si algun veí/na de la finca està interessat.', 'Marta Vidal', 'Parking'),
    ('Claus trobades al vestíbul', 'S’ha trobat un clauer blau al costat de les bústies. Si és vostre, contacteu amb l’administració.', 'Jordi Roca', 'Objectes perduts'),
    ('Neteja del garatge', 'Recordeu retirar els objectes de les zones de pas abans de la neteja programada. Gràcies per la col·laboració.', 'Administració', 'Neteja'),
    ('Llibres per compartir', 'Deixarem una petita selecció de llibres a la sala comunitària per intercanviar durant la trobada de veïns.', 'Laia Soler', 'Veïnat'),
    ('Respectem el descans', 'Us recordem els horaris de descans. Si feu una mudança, aviseu amb antelació per facilitar l’accés.', 'Marta Vidal', 'Convivència'),
    ('Revisió de l’assegurança', 'L’administració ha penjat un resum de mostra de les cobertures a l’apartat Documents.', 'Administració', 'Documents'),
    ('Paraigua trobat', 'Hi ha un paraigua vermell a consergeria des de la darrera pluja. El guardarem durant aquesta setmana.', 'Pau Ferrer', 'Objectes perduts'),
    ('Cura del jardí interior', 'L’equip de jardineria revisarà el reg i podarà les plantes del pati. Mantingueu lliure l’accés de servei.', 'Administració', 'Jardí'),
    ('Benvinguda al veïnat', 'Donem la benvinguda als nous veïns de l’escala B. Al directori trobareu els contactes útils de la finca.', 'Anna Costa', 'Veïnat'),
    ('Reciclatge i cartrons', 'Plegueu les caixes abans de portar-les al contenidor de paper per deixar espai a la resta del veïnat.', 'Jordi Roca', 'Convivència'),
    ('Sala comunitària recollida', 'Després de les activitats, deixeu les taules netes i les cadires al seu lloc. Entre tots cuidem l’espai.', 'Laia Soler', 'Espais comuns'),
    ('Actualització de documents', 'Hem afegit les actes de mostra dels darrers mesos i les normes de convivència perquè les pugueu consultar.', 'Administració', 'Documents'),
    ('Bicicletes a les zones de pas', 'Feu servir els espais habilitats i mantingueu lliures els accessos als ascensors i les sortides.', 'Marta Vidal', 'Convivència'),
    ('Trobada de tardor', 'Ens trobarem a la sala comunitària per compartir propostes de millora. Consulteu el dia i l’hora al calendari.', 'Pau Ferrer', 'Veïnat'),
    ('Revisió dels extintors', 'El servei de manteniment comprovarà els extintors i la senyalització. No cal entrar als habitatges.', 'Administració', 'Manteniment'),
    ('Consulta dels rebuts', 'Ja teniu disponible un historial de rebuts de mostra amb quotes ordinàries i una derrama de rehabilitació.', 'Administració', 'Comptes'),
    ('Gràcies per cuidar la finca', 'La col·laboració del veïnat facilita el seguiment de les incidències i la conservació dels espais comuns.', 'Anna Costa', 'Comunitat'),
]
posts = [dict(id=identifier(f'post-{i}'), community_id=community, title=title, body=body,
              author_name=f'{author} · Mostra', topic=topic, published_at=timestamp(-i * 2, 8))
         for i, (title, body, author, topic) in enumerate(post_specs)]
contact_specs = [
    ('Administració Finques Mar', 'Administració i gestió de la comunitat', 'administracio', 'Dl–dv, 9:00–17:00'),
    ('Ascensors Litoral', 'Manteniment dels ascensors', 'ascensors', 'Servei de guàrdia 24 h'),
    ('Fontaneria Blau', 'Aigua, baixants i humitats', 'fontaneria', 'Dl–dv, 8:00–18:00'),
    ('Electricitat Riera', 'Enllumenat i instal·lacions comunes', 'electricitat', 'Dl–dv, 8:00–18:00'),
    ('Neteja Clara', 'Escales, vestíbuls i aparcament', 'neteja', 'Dl, dc i dv, 8:00–12:00'),
    ('Jardins del Pati', 'Jardineria i manteniment del reg', 'jardineria', 'Dt i dj, 9:00–13:00'),
    ('Portes i Automatismes Nord', 'Portes del garatge i tancaportes', 'portes', 'Dl–dv, 9:00–18:00'),
    ('Protecció Foc', 'Extintors i senyalització', 'extintors', 'Dl–dv, 9:00–17:00'),
    ('Cobertes Segures', 'Terrasses, cobertes i impermeabilització', 'cobertes', 'Dl–dv, 8:00–16:00'),
    ('Pintures del Barri', 'Pintura d’escales i espais comuns', 'pintura', 'Dl–dv, 8:00–16:00'),
    ('Connexió Portal', 'Porter automàtic i telecomunicacions', 'porter', 'Dl–dv, 9:00–18:00'),
    ('Assegurances Comunitat', 'Consultes sobre cobertures i sinistres', 'assegurances', 'Dl–dv, 9:00–17:00'),
]
contacts = [dict(id=identifier(f'contact-{i}'), community_id=community, name=f'{name} · Mostra',
                 service=service, phone=None, email=f'{email}@example.com', hours=hours, sort_order=i)
            for i, (name, service, email, hours) in enumerate(contact_specs)]

payload = dict(incidents=incidents, incident_updates=updates, documents=documents,
               receipts=receipts, community_events=events, board_posts=posts, directory_contacts=contacts)
(root / 'manifest.json').write_text(json.dumps(dict(referenceDate=args.date.isoformat(),
    communityId=community, unitId=unit, reporterId=reporter, tables=payload), ensure_ascii=False, indent=2) + '\n')

# Deterministic IDs and DO NOTHING preserve previously seeded/operator-edited rows.
# Validate all ownership before inserting anything. Never change membership or Auth.
sql = [f'''-- Generated sample content, anchored at {args.date}. Review before applying.
begin;
do $guard$ begin
  if not exists (select 1 from public.community_members where community_id = '{community}' and user_id = '{reporter}' and unit_id = '{unit}') then
    raise exception 'Sample data target must be an existing resident membership and unit';
  end if;
end $guard$;''']
for table, records in payload.items():
    columns = list(records[0])
    sql.append(f"insert into public.{table} ({', '.join(columns)}) values")
    values = []
    for record in records:
        values.append('(' + ', '.join('null' if record[key] is None else str(record[key]) if isinstance(record[key], int)
            else "'" + str(record[key]).replace("'", "''") + "'" for key in columns) + ')')
    sql.append(',\n'.join(values) + '\non conflict (id) do nothing;')
sql.append(f'''-- Initialize only an unconfigured, zero-balance pilot unit.
update public.units set next_charge_at = '{next_charge_date}', next_charge_cents = {next_charge_cents}
where id = '{unit}' and community_id = '{community}'
  and next_charge_at is null and next_charge_cents is null and balance_cents = 0;
commit;''')
(root / 'seed.sql').write_text('\n\n'.join(sql) + '\n')
# Existing pilot rows are preserved by the seed. Update only the original sample post.
parking_body = post_specs[1][1].replace("'", "''")
(root / 'parking-post-update.sql').write_text(sql[0] + f'''

update public.board_posts
set title = 'Plaça de garatge en lloguer',
    body = '{parking_body}',
    topic = 'Parking'
where id = '{identifier('post-1')}'
  and community_id = '{community}'
  and author_name = 'Marta Vidal · Mostra'
  and title = 'Junta ordinària de tardor'
  and body = 'Ja podeu consultar la convocatòria i preparar les preguntes sobre el pressupost i les obres de la finca.'
  and topic = 'Comunitat';

commit;
''')
print(json.dumps({'output': str(root.resolve()), 'counts': {table: len(rows) for table, rows in payload.items()}, 'uploadedFiles': 0}, indent=2))
