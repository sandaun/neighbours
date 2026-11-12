# Backoffice — estat i pròxims passos

**Actualitzat:** 9 de novembre de 2026 (aplicat i provat al Supabase real) · **Branca:** `claude/modest-cannon-evfse4`
(encara no fusionada amb `feature/mvp` ni `main`).

El backoffice és una web React a `admin/` perquè l'administrador de cada comunitat
gestioni l'app sense entrar al dashboard de Supabase. Fa servir el mateix Supabase i
els mateixos colors que l'app. L'app dels veïns no canvia.

## 1. Què està fet

| Mòdul | Què pot fer l'admin | Migració | Commit |
|---|---|---|---|
| Accés | Login; els veïns sense rol `admin` queden fora | — | `788ce64` |
| Incidències | Veure-les, filtrar, veure la foto, respondre i canviar l'estat | `20261109100000` | `6c6ef88`, `12f0cce` |
| Calendari, tauló, directori | Crear, editar i esborrar; programar anuncis | `20261109110000` | `e1dd53a` |
| Documents i rebuts | Pujar PDFs privats, substituir-los, obrir-los, esborrar-los | `20261109120000` | `e943fc1` |
| Guia i desfer | Guia d'aplicació i SQL per desfer-ho tot | — | `bd42300` |
| Veïns i pisos (part 1) | Veure els veïns (amb email), canviar-los el nom o el pis, donar-los de baixa; crear i editar pisos amb saldo i proper càrrec | `20261110100000` ⏳ pendent d'aplicar | (aquest commit) |

**Seguretat:** cada admin només pot tocar les seves comunitats; els veïns continuen
només llegint. Ho garanteix la base de dades (RLS), no la web.

**Provat:** 109 tests de l'app, 73 del backoffice i 5 jocs de tests SQL. A cada
migració s'hi han introduït errors a propòsit i els tests els han detectat.

**Aplicat al Supabase real (9 de novembre de 2026):** les 3 migracions estan
aplicades, els 5 tests SQL passen al projecte real i el backoffice s'ha provat amb
dades reals (incidències, calendari, tauló, directori, documents i rebuts amb PDF).
Calia corregir dos tests que només fallaven al projecte real: comptaven dades que ja
hi eren, i Supabase prohibeix esborrar fitxers amb SQL directe (`7d81da9`,
`341d37d`). La seguretat no ha canviat.

**Fitxers existents tocats:**
- La configuració de l'app (`tsconfig`, Jest, ESLint, Metro), perquè ignori `admin/`.
- El CI, amb una feina nova "Backoffice".
- Els tipus compartits.
- Dos tests SQL existents (`resident_rls`, `community_content_rls`): una comprovació de
  "dóna error" ha passat a "no canvia res". És la mateixa protecció per als veïns, i
  passa amb les migracions i sense.

## 2. Com aplicar-ho o tornar-ho a fer

Fet. Per a un altre projecte o per repetir-ho, segueix
[`guia-aplicar-backoffice.md`](guia-aplicar-backoffice.md). Per obrir el backoffice
en local:

```sh
cd admin && npm ci && cp .env.example .env.local   # després, posa-hi la clau sb_publishable_
npm run dev                                        # http://localhost:5173
```

Per desfer-ho: `supabase/operations/rollback_admin_backoffice.sql` (explicat a la guia).

## 3. Què queda pendent

**Decisions teves:**
- **Accés dels veïns nous:** contrasenya que l'admin passa a mà (com ara), o
  invitació per email (cal configurar l'enviament de correus a Supabase).
- **Crear comunitats noves:** de moment es fa al dashboard. Si l'heu de fer
  vosaltres sovint, caldrà un rol de "super-admin".
- **On publicar el backoffice:** Vercel, Netlify, Cloudflare Pages… Cal que totes
  les rutes serveixin `index.html`.
- **Quan fusionar** la branca a `feature/mvp`, un cop provat.

**Protecció de dades (RGPD):** llista completa a
[`proteccio-dades.md`](proteccio-dades.md). Hi ha 4 punts imprescindibles abans de
treballar amb dades reals.

**Feina que faré jo, per ordre:**
1. **Veïns, part 2:** donar d'alta veïns nous (crear el compte). Necessita una Edge
   Function que també s'haurà de desplegar. Inclou anonimitzar un veí que marxa
   (vegeu [`proteccio-dades.md`](proteccio-dades.md)).
2. **Organitzacions:** que una empresa (p. ex. Carbonell) gestioni totes les seves
   comunitats sense fer admin cada treballador una per una. Els rols d'admin, de
   moment, els posa el propietari del projecte.
3. **Qui ha comunicat cada incidència:** ara l'admin no pot veure els noms dels veïns.
4. Votacions i reserves (encara no existeixen a la base de dades).
5. Millores: doble factor (MFA) per als admins, fitxer JavaScript més petit i tests
   SQL al CI.

## 4. Observacions

- El CI només s'executa amb push a `main` o amb PRs cap a `main`. Aquesta branca
  s'ha validat en local.
- En local, el typecheck de l'app necessita el fitxer `expo-env.d.ts`, que genera
  Expo i està ignorat per git. Podria fallar també al CI (no verificat).
