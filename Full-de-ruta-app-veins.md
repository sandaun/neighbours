# Full de ruta — App de comunitat de veïns (GimTic)

**Producte:** app mòbil per a veïns de comunitats de propietaris (iOS + Android)
**Referent competitiu:** TucomunidApp (IESA / Aareon Spain)
**Stack proposat:** React Native + Expo (managed), TypeScript
**Data:** agost 2026

---

## 1. Resum executiu

L'objectiu és convertir el prototip navegable actual (https://gimtic.com/comunidad/) en una app real per a iOS i Android, amb un MVP que cobreixi els fluxos del veí i una fase 2 que incorpori comunicació, economia i el backoffice de l'administrador.

**Decisió clau: React Native amb Expo (flux managed).** És l'opció que permet a tot l'equip treballar amb una sola base de codi, provar l'app als mòbils físics sense instal·lar Xcode ni Android Studio (Expo Go), i publicar actualitzacions sense passar per la revisió de les botigues (EAS Update / OTA).

**Decisió de disseny: Liquid Glass a iOS, amb fallback natiu a Android.** El vidre líquid només existeix a iOS 26+; forçar-lo a Android donaria un resultat fals i lent. L'estratègia correcta és glass real on Apple el dona nativament i Material 3 / blur translúcid a Android.

---

## 2. Decisió tecnològica

### 2.1 React Native + Expo: per què sí

| Criteri | Valoració |
|---|---|
| Una sola base de codi iOS + Android | ✔ Cobreix el requisit de compatibilitat total |
| **Que ho pugui fer tothom** | ✔ Amb **Expo Go**, qualsevol membre de l'equip escaneja un QR i té l'app al seu mòbil físic en segons, sense Xcode, Android Studio ni comptes de desenvolupador |
| TypeScript de sèrie | ✔ |
| Ecosistema madur | ✔ Navegació, notificacions push, càmera (fotos d'incidències), blur/glass, autenticació: tot cobert per paquets oficials Expo |
| OTA updates | ✔ EAS Update permet corregir bugs i desplegar canvis JS sense esperar la revisió d'Apple/Google |
| Web opcional | ✔ Expo exporta a web: útil per al futur portal de l'administrador o una versió d'escriptori |
| Futur | ✔ Si algun dia cal codi natiu (p. ex. integració amb videoporters), es passa a *development builds* sense reescriure res |

### 2.2 Managed vs development build

- **Fase MVP:** flux managed pur + Expo Go. Màxima velocitat, tothom pot executar.
- **Quan calgui (fase 2):** *development builds* amb EAS Build. Serà necessari quan s'incorporin mòduls natius (obertura de portes / videoporter, signatura digital, etc.).
- Regla pràctica: no sortir del managed fins que una funcionalitat ho exigeixi.

### 2.3 Stack recomanat

| Capa | Elecció | Notes |
|---|---|---|
| Framework | **Expo SDK actual + expo-router** | Navegació basada en fitxers; el tabbar inferior del prototip es mapeja 1:1 |
| Llenguatge | **TypeScript estricte** | |
| UI / estils | **NativeWind (Tailwind per a RN)** | DECIDIT: adopció ~6,6× superior a Tamagui, suport oficial d'Expo, mateixa config Tailwind reutilitzable al backoffice web. DS propi a sobre → veure **`DESIGN_SYSTEM.md`** |
| Components natius | **@expo/ui** | Components SwiftUI (iOS) i Jetpack Compose (Android) oficials: tabbar, menús, *pickers*… amb aspecte 100% natiu |
| Estat | **TanStack Query + Zustand** | Query per dades de servidor; Zustand per estat local |
| Backend | **Supabase** (Postgres + Auth + Storage + Edge Functions) | Alternativa: API pròpia; decidir amb el disseny del backoffice |
| Push | **expo-notifications + EAS Push** | Motor de l'app: incidència resolta, nova votació, reserva confirmada |
| Autenticació | **expo-auth-session** + invitació per codi/OTP | El model del negoci és "l'administrador convida", no registre lliure |
| Formularis | react-hook-form + zod | Incidències, tauló, derrames |
| Gràfics | react-native-svg / victory-native | Donut de despeses, barres de votació |
| i18n | **i18next (ca/es des del dia 1)** | El mockup barreja idiomes; el producte real no ho pot fer |
| Qualitat | ESLint + Prettier + Jest + Maestro (E2E) | |

---

## 3. Disseny: Liquid Glass i estratègia visual

### 3.1 Què és aplicable

- **iOS 26+:** el *Liquid Glass* apareix automàticament als components natius (barres de pestanyes, barres de navegació, controls) quan es compila amb el SDK actual. Amb **@expo/ui** i els modificadors d'efecte de vidre es pot aplicar també a targetes, modals i botons flotants propis.
- **iOS < 26:** fallback automàtic a translucidesa clàssica (`expo-blur` / BlurView).
- **Android:** **no hi ha Liquid Glass**. La contrapartida oficial és **Material 3 (Expressive)**: superfícies amb elevació, *blur* translúcid on el sistema ho suporta i els mateixos gestos. No imitar el vidre amb trucs: queda artificial i penalitza rendiment.

> **Document oficial de disseny:** tots els tokens (paleta real extreta del prototip, tipografies, radis, ombres), el catàleg de components amb variants i la config de NativeWind estan especificats a **`DESIGN_SYSTEM.md`**. Aquest full de ruta defineix l'estratègia; el DS defineix els valors i components.

### 3.2 Regles d'aplicació al nostre producte

1. **Vidre només en superfícies flotants:** tabbar inferior, FAB "+", modals (detall d'incidència), capçaleres condensades. Mai com a fons de pantalla sencer.
2. **Ull de vidre amb moderació:** el glass sobre fotos de la comunitat a la capçalera queda molt bé; sobre text llarg, no (llegibilitat).
3. **Token únic de disseny:** un sol sistema de colors (primari morat actual), radi i ombres per a les dues plataformes; el que canvia és el *material* (glass vs M3), no el layout.
4. **Mode fosc des del dia 1** — és gairebé gratuït amb NativeWind i el glass hi destaca especialment.
5. **Accessibilitat:** contrast WCAG AA (compte amb el morat sobre vidre), Dynamic Type / mides de font del sistema respectades.

### 3.3 Identitat

Mantenir l'estil del prototip (morat, tipografia serif als titulars, targetes arrodonides) perquè ja és reconeixible, i elevar-lo amb els materials natius de cada plataforma.

---

## 4. Arquitectura funcional

```
┌─────────────────────┐     ┌──────────────────────┐
│  App veí (Expo)     │     │  Backoffice admin    │
│  iOS / Android      │────▶│  (web, fase 2-3)     │
└─────────┬───────────┘     └──────────┬───────────┘
          │                            │
          ▼                            ▼
┌───────────────────────────────────────────────┐
│  Backend (Supabase o API pròpia)              │
│  · Auth per invitació (OTP/codi)              │
│  · Postgres: comunitats, veïns, incidències,  │
│    votacions, reserves, rebuts, tauló         │
│  · Storage: fotos, PDFs (actes, rebuts)       │
│  · Edge functions: notificacions, quòrum,     │
│    generació d'actes                          │
└───────────────────────────────────────────────┘
```

**Model de dades mínim:** `comunitat`, `unitat` (pis/pàrquing/traster amb coeficient), `veí`, `incidència`, `comentari_incidència`, `votació`, `punt_ordre_dia`, `vot`, `delegació`, `reserva`, `espai_comú`, `rebut`, `derrama`, `document`, `missatge_tauló`, `contacte_urgència`, `accés_temporal`.

---

## 5. MVP — Fase 1 (app del veí, el que ja està validat al prototip)

Objectiu: app publicada a App Store i Google Play amb els fluxos que el prototip ja demostra, alimentada per dades reals.

### 5.1 Funcionalitats MVP

| Mòdul | Abast MVP |
|---|---|
| **Onboarding** | Login + activació per **codi d'invitació** de l'administrador (OTP per SMS/email). Sense registre lliure |
| **Inici** | Resum: incidències recents, propers esdeveniments, últims missatges del tauló |
| **Incidències** | Crear (categoria, foto amb `expo-image-picker`, descripció) · llista amb estats · **detall amb fil d'actualitzacions** de l'administrador |
| **Documents** | Repositori (actes, estatuts, assegurances) amb visualitzador PDF |
| **Despeses** | Gràfic mensual/anual per categories (donut del mockup) |
| **Rebuts** | Quota, proper càrrec, derrames, canvi de domiciliació, **històric descarregable en PDF** |
| **Votacions** | Vot a favor/en contra + **delegació amb coeficient** · resultats en temps real |
| **Reserves** | Espais comuns amb disponibilitat, torns, creació d'esdeveniments |
| **Tauló** | Publicació amb temes (ja prototipat) |
| **Directori** | Categories → fitxes d'empresa amb trucada directa |
| **Calendari** | Vista mensual + esdeveniment del dia |
| **Urgències** | Contactes clau amb trucada directa |
| **Perfil** | Dades, notificacions, privacitat, **idioma ca/es**, tancar sessió |
| **Notificacions push** | Incidència actualitzada, nova votació, reserva confirmada, nou rebut |

### 5.2 Diferenciadors propis que ja tenim (mantenir-los al MVP)

1. **Accessos temporals per a convidats** (repartidor, visita) amb validesa i revocació.
2. **Tauló social entre veïns**.
3. **Transparència de derrames** (import, quotes, calendari de càrrecs).
4. **Pantalla d'urgències** contextualitzada (061/092/088 + mantenidors de la finca).

> Accessos: al MVP, la pantalla pot funcionar en mode "compatible/no compatible" com al mockup; l'obertura real de portes depèn de hardware (videoporter) i va a fase 3.

---

## 6. Fase 2 — comunicació i economia

1. **Missatgeria veí ↔ administrador** (xat amb registre històric). És la mancança més gran respecte a TucomunidApp i el cor del producte.
2. **Saldo personal del veí** (deute/a favor) visible a Rebuts.
3. **Votacions multi-punt** (ordre del dia complet), càlcul de **quòrum**, generació automàtica d'acta amb registre de vots i validesa legal.
4. **Pressupostos des del directori:** demanar pressupost a un proveïdor des de la fitxa; arriba al veí i a l'administrador.
5. **Multi-propietat:** un veí amb pis + pàrquing + traster, o diversos pisos, canvia d'unitat des del perfil.
6. **Factures de despeses de la comunitat** consultables (transparència).
7. **Rol president:** aprovar missatges del tauló, crear votacions i esdeveniments.
8. **Control d'aforament** de piscina/espais.

## 7. Fase 3 — ecosistema

1. **Backoffice web de l'administrador** (Next.js, mateixa API): gestió de comunitats, invitacions, assignació d'incidències a proveïdors, publicació de documents i rebuts, quadre de comandes.
2. **Obertura real de portes:** integració amb videoporters/mandos (requereix development build i convenis amb fabricants).
3. **Portal de proveïdors:** recepció d'ordres de treball, pressupostos, facturació.
4. **Signatura digital** de documents.
5. **Taxació de propietats** i serveis afegits.

---

## 8. Flux de treball per a "que ho puguem fer tots"

| Eina | Per a què |
|---|---|
| **Expo Go** | Qualsevol de l'equip prova l'app al seu mòbil escanejant un QR. Zero configuració nativa |
| **EAS Build** | Binari de producció i *development builds* al núvol (no cal Mac per compilar iOS) |
| **EAS Update (OTA)** | Correccions i millores sense esperar revisió de botiga |
| **EAS Submit** | Pujada a App Store Connect i Google Play des de CI |
| **Internal distribution** | Builds de prova per a testers via TestFlight / Google Play internal testing |
| **GitHub + CI** | Lint + tests a cada PR; build automàtic a `main` |

Comptes necessaris: Apple Developer (99 $/any) i Google Play (25 $ únic). La revisió d'Apple valora molt la privacitat: preparar *privacy manifest* i descripcions d'ús de càmera/fotos.

---

## 9. Riscs i punts d'atenció

| Risc | Mitigació |
|---|---|
| **Glass només a iOS 26+** | Fallback `expo-blur` i M3; no condicionar cap funcionalitat al vidre |
| **Validesa legal del vot online** | Revisió jurídica (LPH): registre de vot, identitat verificada, reflectir a l'acta |
| **RGPD** | Dades de veïns i comptes bancaris: xifrat, drets ARCO des del Perfil ("Privacitat i dades"), DPIA abans del llançament |
| **Obertura de portes** | Depèn de hardware de tercers; mantenir-la fora del MVP |
| **Sense backoffice, l'app no té dades** | Al MVP es pot operar amb un mini-panal d'administració (fins i tot el dashboard de Supabase) mentre arriba la fase 3 |
| **Barreja d'idiomes del mockup** | i18n ca/es des del primer sprint; cap text dur al codi |

---

## 10. Proposta de sprints (orientativa)

| Sprint | Contingut |
|---|---|
| 1–2 | Setup Expo + expo-router + NativeWind, **implementació del DESIGN_SYSTEM.md (tokens + components nucli)**, i18n, CI |
| 3–4 | Auth per invitació + Inici + Perfil |
| 5–6 | Incidències complet (crear, llistar, detall, push) |
| 7–8 | Rebuts + Despeses + Documents |
| 9–10 | Votacions + delegació + Reserves |
| 11 | Tauló + Directori + Calendari + Urgències |
| 12 | Accessos (mode compatibilitat), poliment visual glass/M3, mode fosc |
| 13–14 | QA E2E (Maestro), RGPD, botigues, **llançament MVP** |

---

## 11. Comparativa final amb TucomunidApp (estat objectiu)

| Àrea | TucomunidApp | La nostra app (objectiu) |
|---|---|---|
| Incidències | ✔ | ✔ amb fil d'actualitzacions |
| Votacions legals | ✔ | ✔ + quòrum i acta automàtica (fase 2) |
| Rebuts | ✔ | ✔ + PDF i derrames visibles |
| Reserves | ✔ | ✔ + esdeveniments veïnals |
| Directori | ✔ | ✔ + pressupostos integrats (fase 2) |
| Obrir portes | ✔ | ✔ fase 3 (depèn de hardware) |
| Missatgeria amb admin | ✔ | ✔ fase 2 |
| **Accessos temporals convidats** | ✖ | ✔ **diferenciador MVP** |
| **Tauló social veïnal** | ✖ | ✔ **diferenciador MVP** |
| **Transparència derrames** | ✖ | ✔ **diferenciador MVP** |
| **Urgències contextuals** | ✖ | ✔ **diferenciador MVP** |
| Backoffice admin | ✔ (Gesfincas) | ✔ fase 3 |
| Idiomes | castellà | **ca/es** |

**Conclusió:** amb Expo managed + EAS, un equip petit pot llançar l'MVP en ~3–4 mesos mantenint els quatre diferenciadors que ja distingirien el producte de TucomunidApp, i escalant després cap a comunicació (fase 2) i ecosistema d'administrador (fase 3).
