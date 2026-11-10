# Protecció de dades (RGPD) — estat i pendents

**Actualitzat:** 10 de novembre de 2026

> ⚠️ Aquesta llista no és assessorament legal. Abans de treballar amb comunitats
> reals, cal que la revisi un advocat o un delegat de protecció de dades (DPO).

L'app tracta dades personals de veïns: nom, email, pis, saldo i rebuts, fotos
d'incidències (hi poden sortir persones) i missatges.

## Qui és qui

| Paper (RGPD) | Qui | Què implica |
|---|---|---|
| Responsable del tractament | La comunitat de propietaris (via l'administrador de finques) | Decideix per a què es fan servir les dades |
| Encarregat del tractament | Neighbours | Contracte d'encarregat amb cada comunitat (art. 28) |
| Subencarregat | Supabase | DPA signat; dades preferiblement a la UE |

Fonts: [RGPD](https://eur-lex.europa.eu/eli/reg/2016/679/oj) (art. 28),
[AEPD](https://www.aepd.es) i la LOPDGDD (Llei orgànica 3/2018).

## Ja fet (tècnic)

- Aïllament per comunitat i per pis a la base de dades (RLS), amb tests.
- Fitxers privats (PDF i fotos) amb enllaços que caduquen en minuts.
- La clau secreta de Supabase no és mai al navegador. Registre lliure desactivat.
- Cada admin només gestiona les seves comunitats.

## Pendent

| # | Tema | Tipus | Quan |
|---|---|---|---|
| 1 | Comprovar que el projecte Supabase és a la **UE** | Comprovació | ⛔ Abans de dades reals |
| 2 | Signar el **DPA de Supabase** | Legal | ⛔ Abans de dades reals |
| 3 | **Política de privacitat** i **contracte d'encarregat** amb les comunitats | Legal | ⛔ Abans de dades reals |
| 4 | **Doble factor (MFA)** per als admins del backoffice | Tècnic | ⛔ Abans de dades reals |
| 5 | **Registre d'activitats de tractament** i valorar una **DPIA** | Legal | Abans del llançament |
| 6 | **Drets dels veïns** (accés, rectificació, supressió) des de l'app ("Privacitat i dades") | Tècnic | Abans del llançament |
| 7 | **Esborrar o anonimitzar** un veí que marxa (avui, si ha creat incidències, el seu compte no es pot esborrar) | Tècnic | Amb el mòdul de veïns |
| 8 | **Terminis de conservació** de rebuts, fotos i incidències, i neteja automàtica | Decisió + tècnic | Abans del llançament |
| 9 | **Registre d'auditoria**: qui ha fet què al backoffice | Tècnic | Abans del llançament |
| 10 | **Còpies de seguretat** (pla Pro) i **procediment davant una fuga** (avís a l'AEPD en 72 h) | Decisió + procediment | Abans del llançament |
| 11 | Avisar els veïns que les **fotos d'incidències** no han de mostrar persones | Text a l'app | Abans del llançament |

**Per al pilot amb dades de prova**, el que hi ha és suficient.
