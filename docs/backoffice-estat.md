# Backoffice — estat i pròxims passos

**Actualitzat:** 9 de novembre de 2026 · **Branca:** `claude/modest-cannon-evfse4`
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

**Seguretat:** cada admin només pot tocar les seves comunitats; els veïns continuen
només llegint. Ho garanteix la base de dades (RLS), no la web.

**Provat:** 109 tests de l'app, 73 del backoffice i 5 jocs de tests SQL, sobre un
Postgres local. A cada migració s'hi han introduït errors a propòsit i els tests els
han detectat. **No s'ha provat contra el Supabase real.**

**Fitxers existents tocats:**
- La configuració de l'app (`tsconfig`, Jest, ESLint, Metro), perquè ignori `admin/`.
- El CI, amb una feina nova "Backoffice".
- Els tipus compartits.
- Dos tests SQL existents (`resident_rls`, `community_content_rls`): una comprovació de
  "dóna error" ha passat a "no canvia res". És la mateixa protecció per als veïns, i
  passa amb les migracions i sense.

## 2. Què has de fer tu (ara)

Aplicar les 3 migracions i provar-ho. Detall pas a pas a
[`guia-aplicar-backoffice.md`](guia-aplicar-backoffice.md).

```sh
git checkout claude/modest-cannon-evfse4 && git pull
npx supabase@2.121.0 login
npx supabase@2.121.0 link --project-ref ttrgbzqedarelznbdiye
npx supabase@2.121.0 migration list        # només 3 noves (20261109…)
npx supabase@2.121.0 db push --dry-run     # ha de llistar només aquestes 3
npx supabase@2.121.0 db push
```

Després:
1. Al **SQL Editor**, executa els 5 fitxers de `supabase/tests/`. No ha de sortir
   cap error.
2. Fes-te `admin` d'una **comunitat de prova**. El SQL és a la guia.
3. Obre el backoffice:

   ```sh
   cd admin && npm ci && cp .env.example .env.local   # posa-hi la clau sb_publishable_
   npm run dev                                        # http://localhost:5173
   ```

4. Prova cada pestanya i comprova que el canvi surt a l'app.

**Si cal desfer-ho:** `supabase/operations/rollback_admin_backoffice.sql`. Explicat a
la guia.

## 3. Què queda pendent

**Decisions teves:**
- **Accés dels veïns nous:** contrasenya que l'admin passa a mà (com ara), o
  invitació per email (cal configurar l'enviament de correus a Supabase).
- **Crear comunitats noves:** de moment es fa al dashboard. Si l'heu de fer
  vosaltres sovint, caldrà un rol de "super-admin".
- **On publicar el backoffice:** Vercel, Netlify, Cloudflare Pages… Cal que totes
  les rutes serveixin `index.html`.
- **Quan fusionar** la branca a `feature/mvp`, un cop provat.

**Feina que faré jo, per ordre:**
1. **Veïns:** donar d'alta i de baixa, i assignar pis. Necessita una Edge Function
   que també s'haurà de desplegar.
2. **Pisos i saldos:** editar el saldo i el proper càrrec que el veí veu a Comptes.
3. **Qui ha comunicat cada incidència:** ara l'admin no pot veure els noms dels veïns.
4. Votacions i reserves (encara no existeixen a la base de dades).
5. Millores: doble factor (MFA) per als admins, fitxer JavaScript més petit i tests
   SQL al CI.

## 4. Observacions

- El CI només s'executa amb push a `main` o amb PRs cap a `main`. Aquesta branca
  s'ha validat en local.
- En local, el typecheck de l'app necessita el fitxer `expo-env.d.ts`, que genera
  Expo i està ignorat per git. Podria fallar també al CI (no verificat).
