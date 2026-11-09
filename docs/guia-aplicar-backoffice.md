# Guia: aplicar el backoffice a Supabase

Aquesta guia aplica les 3 migracions del backoffice al projecte real
(`ttrgbzqedarelznbdiye`) i comprova que tot funciona. Temps aproximat: 20 minuts.

Les migracions **només afegeixen permisos per als administradors**. No esborren ni
modifiquen cap dada, i els veïns continuen exactament igual.

| Migració | Què permet a l'admin |
|---|---|
| `20261109100000_admin_incident_updates` | Respondre incidències i canviar-ne l'estat |
| `20261109110000_admin_community_content` | Gestionar calendari, tauló i directori |
| `20261109120000_admin_documents_receipts` | Pujar documents i rebuts amb PDF |

Necessites: Node.js, el repo clonat i accés de propietari al projecte de Supabase
(incloent-hi la contrasenya de la base de dades: *Project Settings → Database*).

---

## 1. Baixa la branca

```sh
git fetch origin claude/modest-cannon-evfse4
git checkout claude/modest-cannon-evfse4
git pull origin claude/modest-cannon-evfse4
```

## 2. Connecta't al projecte

```sh
npx supabase@2.121.0 login
npx supabase@2.121.0 link --project-ref ttrgbzqedarelznbdiye
```

El `login` obre el navegador. El `link` et demana la contrasenya de la base de dades.

## 3. Comprova l'historial (no canvia res)

```sh
npx supabase@2.121.0 migration list
```

Has de veure 7 files. Les 4 primeres amb data a **Local** i a **Remote**; les 3
noves (`20261109…`) només a **Local**:

```text
  Local          | Remote         | Time (UTC)
 ----------------|----------------|---------------------
  20261018100713 | 20261018100713 | ...
  20261018102837 | 20261018102837 | ...
  20261027222906 | 20261027222906 | ...
  20261027223735 | 20261027223735 | ...
  20261109100000 |                | ...
  20261109110000 |                | ...
  20261109120000 |                | ...
```

> 🛑 **Para** si alguna de les 4 primeres no surt a Remote, o si hi ha files que
> només surten a Remote. Envia'm la sortida i ho mirem.

## 4. Simulació (no canvia res)

```sh
npx supabase@2.121.0 db push --dry-run
```

Ha de llistar **exactament** les 3 migracions `20261109…`. Si en surt cap altra, para.

## 5. Aplica

```sh
npx supabase@2.121.0 db push
```

Respon `Y`. Després torna a fer `migration list`: les 7 han de sortir a Local i Remote.

## 6. Comprova la seguretat amb els tests

Al dashboard de Supabase, obre **SQL Editor**. Per a cada un d'aquests fitxers de
`supabase/tests/`, copia'n tot el contingut, enganxa'l i prem **Run**:

1. `resident_rls.test.sql`
2. `community_content_rls.test.sql`
3. `admin_incident_updates.test.sql`
4. `admin_community_content.test.sql`
5. `admin_documents_receipts.test.sql`

Cada test crea dades de prova i **les desfà totes en acabar** (`rollback`). Si no surt
cap error en vermell, ha passat. Si surt un error, copia'm el missatge.

Després, a **Advisors → Security Advisor**, no hi ha d'haver cap error nou.

## 7. Fes-te admin d'una comunitat de prova

Al **SQL Editor**, primer busca el teu usuari i la comunitat:

```sql
select m.user_id, m.community_id, c.name, m.role, u.email
from public.community_members m
join public.communities c on c.id = m.community_id
join auth.users u on u.id = m.user_id
order by u.email;
```

Després, amb els valors de la fila que vulguis (fes servir la comunitat de prova,
no una de real):

```sql
update public.community_members
set role = 'admin'
where user_id = '<user_id>' and community_id = '<community_id>';
```

A l'app dels veïns tot continua igual per a aquest compte: veu només els rebuts del
seu pis.

## 8. Obre el backoffice al teu ordinador

```sh
cd admin
npm ci
cp .env.example .env.local
```

Edita `admin/.env.local` i posa-hi la mateixa clau pública que l'app
(`EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, comença per `sb_publishable_`). **Mai** la
clau secreta.

```sh
npm run dev
```

Obre <http://localhost:5173> i entra amb el teu email i contrasenya.

## 9. Prova-ho

- [ ] Veus la comunitat i, a dins, les pestanyes.
- [ ] **Incidències:** respon-ne una i canvia-li l'estat. A l'app, la resposta hi surt.
- [ ] **Calendari:** crea un esdeveniment. Surt a l'app.
- [ ] **Tauló:** crea un anunci. Surt a l'app.
- [ ] **Directori:** crea un contacte. Surt a l'app.
- [ ] **Documents:** puja un PDF. A l'app, el pots obrir.
- [ ] **Rebuts:** crea un rebut amb PDF per al teu pis. A l'app, el pots obrir.
- [ ] Entra al backoffice amb un compte de veí normal: no hi ha de poder entrar.

Si alguna cosa falla, fes una captura del missatge i envia-me-la.

## Si cal desfer-ho

`supabase/operations/rollback_admin_backoffice.sql` treu tots els permisos del
backoffice i deixa els veïns com estaven. No esborra cap dada. Enganxa'l al SQL
Editor i prem Run. Després, perquè l'historial quedi bé:

```sh
npx supabase@2.121.0 migration repair 20261109100000 20261109110000 20261109120000 --status reverted
```

Provat en local el 9 de novembre de 2026: el fitxer desfà els permisos i els tests
originals dels veïns continuen passant.
