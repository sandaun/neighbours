# Design System — App comunitat de veïns (GimTic)

**Estat:** v1 · agost 2026
**Implementació:** NativeWind (Tailwind per a React Native) + components propis
**Font dels valors:** extrets del CSS real del prototip https://gimtic.com/comunidad/
**Document relacionat:** `Full-de-ruta-app-veins.md`

> Aquest document és un artefacte **viu**: viu al repo a `/design-system/` i s'actualitza amb cada component nou. Els tokens són la font única de veritat — cap color, radi ni ombra "a mà" al codi.

---

## 1. Tokens de color (extrets del prototip)

### 1.1 Mode clar (valors reals del CSS)

| Token | Valor | Ús al prototip |
|---|---|---|
| `primary` | `#803EF6` | Botons principals, capçaleres, tabbar actiu, FAB |
| `primary-dark` | `#6714DD` | Estat *pressed*, anell de focus |
| `on-primary` | `#FFFFFF` | Text sobre morat |
| `secondary` | `#50E3C2` | Verd menta — badge "Resuelta", icones del directori |
| `secondary-txt` | `#006B58` | Text sobre verd menta |
| `tertiary` | `#FFBA00` | Ambre — badge "En gestión" |
| `tertiary-txt` | `#6C4D00` | Text sobre ambre |
| `surface-hi` | `#F0E3FF` | Lila clar — badge "Recibida", avatars, xips actius |
| `surface` | `#FFFFFF` | Targetes |
| `bg` | `#FAFBFC` | Fons de pantalla |
| `text` | `#321461` | Morat fosc — text principal i titulars |
| `text-soft` | `#4A4455` | Text secundari, metadades |
| `outline` | `#CCC3D8` | Vores, divisors, botons outline |
| `error` | `#BA1A1A` | Capçalera d'urgències, accions destructives |
| `error-dark` | `#8F1414` | Estat pressed de perill |
| `error-soft` | `#C13B3B` | Variant suau d'error |
| `highlight` | `#D2BCFF` | Lila mitjà — dies marcats del calendari, seleccions |
| `muted` | `#7B7487` | Text desactivat / placeholders |

### 1.2 Mode fosc (PROPOSTA — no existeix al prototip)

Derivació mantenint la identitat morada. **Cal validació visual de l'equip abans d'implementar.**

| Token clar | Token fosc proposat |
|---|---|
| `bg #FAFBFC` | `#140A24` |
| `surface #FFFFFF` | `#1E1132` |
| `surface-hi #F0E3FF` | `#33204F` |
| `text #321461` | `#EFE7FF` |
| `text-soft #4A4455` | `#B9AECC` |
| `outline #CCC3D8` | `#44355E` |
| `primary #803EF6` | `#9B6BFF` (pujat de lluminositat per contrast AA sobre fons fosc) |

---

## 2. Tipografia (extreta del prototip)

| Rol | Família | Pesos | Ús |
|---|---|---|---|
| Display / titulars | **Playfair Display** | 600, 700 | Títols de pantalla ("¿Qué está fallando?", "Votación online") |
| Cos | **Plus Jakarta Sans** | 400, 500, 600 | Text general, targetes, llistats |
| Etiquetes / botons | **Montserrat** | 500, 600, 700 | Botons, xips, badges, labels de formulari, tabbar |

**Escala proposada** (el prototip no la formalitza):

| Token | Mida | Línia | Ús |
|---|---|---|---|
| `display` | 28 | 34 | Títol de pantalla (Playfair 700) |
| `title` | 20 | 26 | Títols de targeta/modal (Playfair 600) |
| `body` | 15 | 22 | Text principal (Jakarta 400) |
| `body-strong` | 15 | 22 | (Jakarta 600) |
| `label` | 13 | 18 | Botons, xips (Montserrat 600) |
| `caption` | 12 | 16 | Metadades, "Reportada hace 2 días" (Jakarta 500) |
| `overline` | 11 | 14 | Caps de secció en majúscules ("INCIDENCIAS RECIENTES") |

> **React Native:** les tres famílies es carreguen amb `expo-font` / `@expo-google-fonts/playfair-display`, `plus-jakarta-sans`, `montserrat`. Respectar sempre Dynamic Type / mida de font del sistema (no bloquejar l'escala).

---

## 3. Radi, espaiat i ombres (extrets del prototip)

### 3.1 Radis

| Token | Valor | Ús |
|---|---|---|
| `radius-sm` | 10 | Petits elements, inputs |
| `radius-md` | 12 | Botons, badges |
| `radius-lg` | 16 | Targetes estàndard |
| `radius-xl` | 20 | Targetes destacades |
| `radius-2xl` | 24 | Contenidors de secció (top), capçaleres (bottom) |
| `radius-pill` | 34 | Xips, botons pill |
| `radius-full` | 50% | FAB, avatars, icones circulars |

### 3.2 Ombres (valors reals)

```js
shadow1:    0px 10px 24px rgba(103,20,221,0.35)  // FAB / botó primary elevat
shadowCard: 0px 10px 32px rgba(50,20,97,0.16)    // targeta estàndard
shadowModal:0px 20px 48px rgba(50,20,97,0.28)    // modals (detall incidència)
shadowBar:  0px -10px 32px rgba(50,20,97,0.18)   // tabbar inferior
shadowSoft: 0px -4px 20px rgba(50,20,97,0.06)    // superfícies subtils
focusRing:  0 0 0 2px #6714DD                     // focus accessible
```

### 3.3 Espaiat

Escala de 4px: `4, 8, 12, 16, 20, 24, 32`. Padding estàndard de targeta: 16. Gaps entre targetes: 12. Padding lateral de pantalla: 20.

---

## 4. Materials per plataforma

| Superfície | iOS 26+ | iOS < 26 | Android |
|---|---|---|---|
| Tabbar inferior | **Liquid Glass** automàtic: `NativeTabs` d'expo-router → `UITabBarController` natiu | Barra nativa translúcida | Barra inferior nativa Material (mateix `NativeTabs`) |
| Modals (detall incidència) | Efecte de vidre sobre el contingut | Blur + ombra `shadowModal` | Targeta M3 + scrim |
| FAB "+" | Vidre tintat `primary` | `primary` pla + `shadow1` | `primary` + elevació M3 |
| Targetes | `surface` + `radius-lg` (sense vidre) | igual | igual |
| Capçalera condensada en scroll | Vidre | Blur | Elevació progressiva M3 |

**Regles:**
1. Vidre només en superfícies **flotants** (tabbar, FAB, modals, capçalera condensada). Mai com a fons de pantalla sencer ni sota text llarg.
2. Cap funcionalitat pot dependre del vidre: és cosmètic, amb fallback garantit.
3. Android **no imita** el vidre: usa els materials oficials de M3. El que és idèntic a les dues plataformes són tokens, layout i components — no el material.

---

## 5. Catàleg de components

Tots els components viuen a `/design-system/components/`, són controlats pels tokens d'amunt i tenen tres estats obligatoris: **default / pressed / disabled**, més `loading` on escaigui.

### 5.1 Nucli
| Component | Variants | Notes |
|---|---|---|
| `Button` | `primary` · `outline` · `danger` · `ghost` | "Votar a favor" (primary), "Votar en contra" (outline), "Eliminar" (danger) |
| `Card` | `default` · `elevated` | Contenidor base de tot el mockup |
| `Chip` | `selectable` · `filter` | Categories d'incidència, temes del tauló, filtres de mes |
| `StatusBadge` | `received` (surface-hi) · `in-progress` (tertiary) · `resolved` (secondary) | Estats d'incidència: Recibida / En gestión / Resuelta |
| `SectionHeader` | — | Overline majúscula ("PRÓXIMOS EVENTOS") |
| `ListItem` | amb icona / avatar / chevron | Perfil, urgències, documents |
| `Avatar` | iniciales | MV, SM, JR sobre `surface-hi` |

### 5.2 Navegació i superfícies
| Component | Notes |
|---|---|
| `TabBar` | 5 pestanyes: Inicio · Incidencias · Documentos · Cuentas · Más. Glass a iOS, M3 a Android |
| `ScreenHeader` | Bloc morat `radius-2xl` inferior amb overline + display serif |
| `CollapsibleScreen` | Scroll container for the five primary tabs; expanded `ScreenHeader` transitions to a compact title as content scrolls |
| `GlassModal` | Detall d'incidència i futures fitxes. Vidre iOS / targeta M3 |
| `FAB` | "+" crear (incidència, missatge de tauló, reserva) |
| `EmptyState` | Il·lustració + text + acció ("Toca un día marcado…") |

### 5.3 Formularis
| Component | Notes |
|---|---|
| `TextArea` | Descripció d'incidència, missatge de tauló |
| `PhotoPicker` | Zona puntejada "Toca para añadir una foto" (`expo-image-picker`) |
| `CategoryChips` | Selector d'una opció (chip actiu: `primary` ple) |
| `CallButton` | Botó circular verd de trucada (urgències, directori) |

### 5.4 Components de domini (específics del producte)
| Component | Pantalla |
|---|---|
| `IncidentCard` | Inici, Incidències |
| `ExpenseDonut` | Despeses (gràfic anella + llegenda per categoria) |
| `VoteBar` | Votació (barra % a favor/en contra) |
| `DelegateCard` | Delegació de vot amb coeficient |
| `ReservationSlot` | Reserves (disponible / ocupada) |
| `AccessCard` | Accessos (portal, garatge, piscina) + badge "No disponible" |
| `GuestPassRow` | Accés temporal amb validesa i "Revocar" |
| `CalendarMonth` | Calendari amb dies marcats (`highlight`) |
| `QuotaCard` / `DerramaCard` | Rebuts |
| `BankAccountCard` | Domiciliació amb IBAN emmascarat |

---

## 6. Implementació: config NativeWind a punt

`tailwind.config.js` inicial amb els tokens reals:

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './design-system/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#803EF6', dark: '#6714DD', on: '#FFFFFF' },
        secondary: { DEFAULT: '#50E3C2', txt: '#006B58' },
        tertiary: { DEFAULT: '#FFBA00', txt: '#6C4D00' },
        surface: { DEFAULT: '#FFFFFF', hi: '#F0E3FF' },
        bg: '#FAFBFC',
        ink: { DEFAULT: '#321461', soft: '#4A4455', muted: '#7B7487' },
        outline: '#CCC3D8',
        danger: { DEFAULT: '#BA1A1A', dark: '#8F1414', soft: '#C13B3B' },
        highlight: '#D2BCFF',
        // Mode fosc (proposta pendent de validació):
        'bg-dark': '#140A24',
        'surface-dark': { DEFAULT: '#1E1132', hi: '#33204F' },
        'ink-dark': { DEFAULT: '#EFE7FF', soft: '#B9AECC' },
        'outline-dark': '#44355E',
        'primary-darkmode': '#9B6BFF',
      },
      fontFamily: {
        display: ['PlayfairDisplay_700Bold'],
        'display-semi': ['PlayfairDisplay_600SemiBold'],
        body: ['PlusJakartaSans_400Regular'],
        'body-semi': ['PlusJakartaSans_600SemiBold'],
        label: ['Montserrat_600SemiBold'],
      },
      borderRadius: {
        sm: '10px', md: '12px', lg: '16px', xl: '20px',
        '2xl': '24px', pill: '34px',
      },
    },
  },
};
```

Ús als components:

```tsx
<Text className="font-display text-[28px] text-ink">¿Qué está fallando?</Text>
<View className="bg-primary rounded-md shadow-lg">…</View>
<StatusBadge status="in-progress" />  // → bg-tertiary/15 text-tertiary-txt
```

---

## 7. Checklist de qualitat per a cada component

- [ ] Usa només tokens (cap hex escrit a mà)
- [ ] Estats default / pressed / disabled (+ loading si cal)
- [ ] Mode clar i fosc
- [ ] Contrast WCAG AA (compte: `on-primary` blanc sobre `#803EF6`; validar amb Dynamic Type)
- [ ] Funciona idèntic a iOS i Android (el material canvia, el comportament no)
- [ ] Textos per i18n (ca/es), cap string dur

---

## 8. Pendents / decisions obertes

1. **Validar paleta de mode fosc** (proposta pròpia, no extreta del prototip).
2. **Iconografia:** definir llibreria (proposta: `lucide-react-native`, consistent i lleugera) — el mockup usa icones diverses sense sistema.
3. **Il·lustracions d'estats buits:** definir estil (lineal morat?).
4. **Motion:** primary tab headers collapse with scroll using Reanimated opacity and transforms. Large and compact titles use separate visibility ranges to avoid overlapping text. Home retains the same brand purple across light and dark appearances, without a divider. Safe areas and bottom tab clearance are handled by `CollapsibleScreen`; native tabs disable automatic content insets. Header height follows text layout, reduced motion removes the fade and translation, and reselecting a tab scrolls to the top. Modal, tab transition, and vote feedback motion remain pending.
