# HEHKU — Garden of Silence

A calm, browser-based game: gather restless threads of light with a hold-and-release breathing mechanic and release them back into the world as flowers. No time pressure, no failure, no wrong way to play.

> 🇫🇮 Suomenkielinen kuvaus alempana.

![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue) ![Phaser](https://img.shields.io/badge/Phaser-3.90-purple) ![Vite](https://img.shields.io/badge/Vite-7-yellow) ![License](https://img.shields.io/badge/license-MIT-green)

## ✨ Features

- **6 progressive gardens** — from Morning Dew to Inner Sun, each with its own palette, mood and mechanics
- **Bilingual UI (FI / EN)** — language switcher on the welcome screen, preference saved locally
- **Breathing mechanic** — hold to inhale (attract light threads), release to exhale (plant flowers)
- **Calm pulse ability** (gardens 3+) — soothe nearby threads with the `E` key
- **Procedural everything** — backgrounds, flowers, light knots and the Web Audio ambience are all generated in code, zero external assets
- **Accessibility features** — keyboard controls, ARIA live announcements, dialog focus containment and a calmer-motion option that freezes decorative animation and disables particle bursts and expanding rings. Gameplay movement remains enabled. These features do not constitute a full accessibility audit.
- **Local persistence** — unlocked gardens, language, sound and motion settings saved in `localStorage` only; the game also works without storage, with settings kept for the current session

## 🚀 Quick start

Requires **Node.js 20.19+ or 22.12+** (a supported LTS release is recommended).

On Windows, double-click **`start-dev.bat`** — it installs dependencies if needed, starts the dev server and opens the game in your browser. No terminal required.

Or manually:

```bash
npm ci
npm run dev      # → http://localhost:5173
```

Other scripts:

```bash
npm run build    # typecheck + production build → dist/
npm run preview  # serve the production build locally
```

Or double-click **`start-preview.bat`** to build and preview the production bundle.

## 🎮 Controls

| Action  | Input                                        |
| ------- | -------------------------------------------- |
| Move    | Mouse / touch / WASD / arrow keys            |
| Inhale  | Hold left mouse button, `Space` or the breath button |
| Exhale  | Release                                      |
| Pulse   | `E` (gardens 3+)                             |
| Pause   | `P` or `Esc`                                 |
| Fullscreen | `F`                                       |

## 🛠️ Tech

- **Phaser 3** for rendering (simulation kept separate in `CalmModel` for testability)
- **TypeScript** (strict) + **Vite**
- **Web Audio API** — generative ambient soundscape, no audio files
- Test hooks: `window.render_game_to_text()` and `window.advanceTime(ms)` for automated QA

```
src/
├── main.ts            # UI wiring, i18n, game bootstrap
├── styles.css         # all styling
├── content/
│   ├── levels.ts      # 6 gardens (FI + EN texts)
│   └── i18n.ts        # FI/EN dictionary + language state
├── game/
│   ├── CalmModel.ts   # headless simulation
│   ├── CalmScene.ts   # Phaser rendering
│   └── input.ts       # input bridge
└── audio/
    └── AudioEngine.ts # generative audio
```

## 📦 Deploy

Any static host works — the production build is just `dist/`:

```bash
npm run build
```

Deploy `dist/` to a static host. Vite uses relative asset URLs, so the build works both at a domain root and under a GitHub Pages repository path.

For GitHub Pages, publish the contents of `dist/` using a Pages deployment workflow or a publishing branch, and configure that source in the repository's **Settings → Pages**. Uploading the source code alone does not publish a playable demo. Do not commit `node_modules/` or `dist/` to the source branch.

---

# HEHKU — Hiljaisuuden puutarha

Rauhallinen selainpeli: kerää levottomat valonsäikeet pitämällä hengityspainiketta pohjassa ja vapauta ne kukiksi. Ei aikapainetta, ei epäonnistumista, ei väärää tapaa pelata.

## ✨ Ominaisuudet

- **6 etenevää puutarhaa** — Aamukasteesta Sisäiseen aurinkoon, jokaisella oma värimaailma ja mekaniikka
- **Kaksikielinen käyttöliittymä (FI / EN)** — kielivalitsin aloitusnäytössä, valinta tallentuu
- **Hengitysmekaniikka** — pidä pohjassa (sisäänhengitys kerää valosäikeitä), vapauta (istuttaa kukat)
- **Tyyneyspulssi** (puutarhat 3+) — rauhoita läheiset säikeet `E`-näppäimellä
- **Kaikki proseduraalista** — taustat, kukat, valosolmut ja Web Audio -äänimaisema generoidaan koodissa, ei ulkoisia assetteja
- **Saavutettavuusominaisuudet** — näppäimistöohjaus, ARIA-tiedotteet, dialogien sisälle rajattu fokus ja rauhallisemman liikkeen asetus, joka pysäyttää koristeanimaatiot ja poistaa hiukkas- ja rengastehosteet. Pelin liikkuminen säilyy käytössä. Kattavaa saavutettavuusauditointia ei ole tehty.
- **Paikallinen tallennus** — avatut puutarhat, kieli, äänet ja liikeasetukset vain `localStorage`:ssa; tallennuksen ollessa estetty peli toimii ja asetukset säilyvät nykyisen istunnon ajan

## 🚀 Käynnistys

Vaatii **Node.js 20.19+ tai 22.12+** -version (suosituksena tuettu LTS-versio).

Windowsissa kaksoisklikkaa **`start-dev.bat`** — se asentaa riippuvuudet tarvittaessa, käynnistää dev-serverin ja avaa pelin selaimessa. Komentoriviä ei tarvita.

Tai manuaalisesti:

```bash
npm ci
npm run dev      # → http://localhost:5173
```

Muut komennot:

```bash
npm run build    # tyyppitarkistus + tuotantobuild → dist/
npm run preview  # tarjoile tuotantobuild paikallisesti
```

Tai kaksoisklikkaa **`start-preview.bat`** tuotantoversion rakentamiseen ja esikatseluun.

## Julkaiseminen

Julkaise tuotantobuildin `dist/`-sisältö staattisella palvelimella. Suhteelliset tiedostopolut tukevat myös GitHub Pagesin repositoriokohtaista osoitetta. GitHub Pagesissa valitse julkaisulähde repositorion **Settings → Pages** -asetuksista. Pelkän lähdekoodin lisääminen GitHubiin ei julkaise pelattavaa demoa. Tarkemmat ohjeet ovat yllä englanniksi.

## 🎮 Ohjaus

| Toiminto | Syöte                                           |
| -------- | ----------------------------------------------- |
| Liiku    | Hiiri / kosketus / WASD / nuolinäppäimet        |
| Sisään   | Pidä hiiren painiketta, `Space` tai hengitysnappia pohjassa |
| Ulos     | Vapauta                                         |
| Pulssi   | `E` (puutarhat 3+)                              |
| Tauko    | `P` tai `Esc`                                   |
| Kokoruutu| `F`                                             |

## License

MIT — see [LICENSE](LICENSE).
