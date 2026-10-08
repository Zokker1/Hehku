import { readSetting, writeSetting } from "../storage";

export type Lang = "fi" | "en";

const LANG_KEY = "hehku-lang";

export function loadLang(): Lang {
  try {
    const saved = readSetting(LANG_KEY);
    if (saved === "fi" || saved === "en") return saved;
  } catch {
    // Storage unavailable (e.g. private mode) — fall through to default.
  }
  if (typeof navigator !== "undefined" && navigator.language?.toLowerCase().startsWith("en")) {
    return "en";
  }
  return "fi";
}

export function saveLang(lang: Lang) {
  try {
    writeSetting(LANG_KEY, lang);
  } catch {
    // Storage unavailable — language still applies to this session.
  }
}

export interface UiStrings {
  metaTitle: string;
  metaDescription: string;
  shellLabel: string;
  langLabel: string;
  welcomeKicker: string;
  welcomeLead: string;
  beginLabel: string;
  continueLabel: string;
  ritualLabel: string;
  step1: string;
  step2: string;
  step3: string;
  footer1: string;
  footer2: string;
  footer3: string;
  progressLabel: string;
  gardenWord: string;
  progress(open: number, total: number, carried: number): string;
  muteAria: string;
  unmuteAria: string;
  soundTitle: string;
  pauseAria: string;
  pauseTitle: string;
  breathIn: string;
  breathOut: string;
  breathAriaIn: string;
  breathAriaOut: string;
  pulseReady: string;
  pulseRecharging(seconds: number): string;
  captureMsg: string;
  release(count: number): string;
  pulseMsg: string;
  completeKicker(realm: string): string;
  completeTitle(name: string): string;
  nextLabel: string;
  replayLabel: string;
  journeyKicker: string;
  journeyTitle: string;
  journeyText: string;
  gardenButton: string;
  pauseKicker: string;
  pauseHeading: string;
  pauseText: string;
  resumeLabel: string;
  motionLabel: string;
  soundToggleLabel: string;
  restartLabel: string;
  menuLabel: string;
  safetyNote: string;
  mapKicker: string;
  mapTitle: string;
  mapCloseLabel: string;
  mapOpen: string;
  mapDormant: string;
  mapFlowers(goal: number): string;
  continueWith(name: string): string;
  orientationText: string;
  languageSwitched: string;
  controlsMove: string;
  controlsInhale: string;
  controlsExhale: string;
  controlsPause: string;
  controlsFullscreen: string;
}

const fi: UiStrings = {
  metaTitle: "HEHKU — Hiljaisuuden puutarha",
  metaDescription:
    "HEHKU on rauhallinen, selainpohjainen valopuutarhapeli ilman aikapainetta tai epäonnistumista.",
  shellLabel: "HEHKU-pelin pelialue",
  langLabel: "Kieli",
  welcomeKicker: "HILJAISUUDEN PUUTARHA",
  welcomeLead:
    "Kerää levottomat valonsäikeet hengityksesi rytmiin ja päästä ne takaisin maailmaan kukkina. Täällä ei ole kiirettä eikä väärää tapaa pelata.",
  beginLabel: "Aloita matka",
  continueLabel: "Jatka puutarhaa",
  ritualLabel: "Peliohje",
  step1: "<strong>Liiku</strong><br />hiirellä tai nuolinäppäimillä",
  step2: "<strong>Vedä henkeä</strong><br />pitämällä painike pohjassa",
  step3: "<strong>Vapauta</strong><br />ja katso puutarhan heräävän",
  footer1: "Ei aikarajaa",
  footer2: "Ei epäonnistumista",
  footer3: "6 maailmaa",
  progressLabel: "Tason edistyminen",
  gardenWord: "PUUTARHA",
  progress: (open, total, carried) =>
    carried > 0 ? `${open} / ${total} kukkaa · ${carried} mukana` : `${open} / ${total} kukkaa`,
  muteAria: "Mykistä äänet",
  unmuteAria: "Ota äänet käyttöön",
  soundTitle: "Äänet",
  pauseAria: "Keskeytä peli",
  pauseTitle: "Tauko",
  breathIn: "PIDÄ · SISÄÄN",
  breathOut: "VAPAUTA · ULOS",
  breathAriaIn: "Pidä pohjassa vetääksesi henkeä",
  breathAriaOut: "Vapauta hengittääksesi ulos",
  pulseReady: "Pulssi valmis",
  pulseRecharging: (seconds) => `Pulssi palautuu · ${seconds} s`,
  captureMsg: "Valosäie rauhoittui. Vapauta hengitys istuttaaksesi sen.",
  release: (count) => `${count} uutta kukkaa avautui.`,
  pulseMsg: "Tyyneyspulssi kulki puutarhan läpi.",
  completeKicker: (realm) => `${realm.toUpperCase()} ON HEREILLÄ`,
  completeTitle: (name) => `${name} hengittää`,
  nextLabel: "Seuraava puutarha",
  replayLabel: "Viivy vielä täällä",
  journeyKicker: "KAIKKI KUUSI PUUTARHAA",
  journeyTitle: "Valo kulkee nyt kanssasi",
  journeyText:
    "Hiljaisuus ei ollut päämäärä, vaan tila jonka osaat löytää uudelleen. Puutarhat jäävät avoimiksi aina kun haluat palata.",
  gardenButton: "Palaa puutarhakartalle",
  pauseKicker: "OMA HETKI",
  pauseHeading: "Puutarha odottaa",
  pauseText: "Pysähdy tähän niin pitkäksi aikaa kuin tarvitset.",
  resumeLabel: "Jatka",
  motionLabel: "Rauhallisempi liike",
  soundToggleLabel: "Äänet",
  restartLabel: "Aloita puutarha alusta",
  menuLabel: "Palaa alkuun",
  safetyNote: "Ei välkettä, ei aikapainetta. Edistyminen tallentuu vain tälle laitteelle.",
  mapKicker: "HILJAISUUDEN PUUTARHA",
  mapTitle: "Valitse paikka, johon palaat",
  mapCloseLabel: "Sulje kartta",
  mapOpen: "AVOINNA",
  mapDormant: "LEPO TILASSA",
  mapFlowers: (goal) => `${goal} valokukkaa`,
  continueWith: (name) => `Jatka: ${name}`,
  orientationText: "Käännä laite vaakasuoraan, jotta puutarhalla on tilaa hengittää.",
  languageSwitched: "Kieli vaihdettu suomeksi.",
  controlsMove: "osoitin tai WASD/nuolinäppäimet",
  controlsInhale: "pidä hiiren painiketta, välilyöntiä tai hengityspainiketta pohjassa",
  controlsExhale: "vapauta",
  controlsPause: "P tai Esc",
  controlsFullscreen: "F",
};

const en: UiStrings = {
  metaTitle: "HEHKU — Garden of Silence",
  metaDescription:
    "HEHKU is a calm, browser-based light garden game with no time pressure and no failure.",
  shellLabel: "HEHKU game area",
  langLabel: "Language",
  welcomeKicker: "THE GARDEN OF SILENCE",
  welcomeLead:
    "Gather restless threads of light to the rhythm of your breath and release them back into the world as flowers. There is no hurry here, and no wrong way to play.",
  beginLabel: "Begin the journey",
  continueLabel: "Continue the garden",
  ritualLabel: "How to play",
  step1: "<strong>Move</strong><br />with mouse or arrow keys",
  step2: "<strong>Breathe in</strong><br />by holding the button down",
  step3: "<strong>Release</strong><br />and watch the garden wake",
  footer1: "No time limit",
  footer2: "No failure",
  footer3: "6 worlds",
  progressLabel: "Level progress",
  gardenWord: "GARDEN",
  progress: (open, total, carried) =>
    carried > 0 ? `${open} / ${total} flowers · ${carried} carried` : `${open} / ${total} flowers`,
  muteAria: "Mute sounds",
  unmuteAria: "Turn sound on",
  soundTitle: "Sound",
  pauseAria: "Pause the game",
  pauseTitle: "Pause",
  breathIn: "HOLD · IN",
  breathOut: "RELEASE · OUT",
  breathAriaIn: "Hold down to breathe in",
  breathAriaOut: "Release to breathe out",
  pulseReady: "Pulse ready",
  pulseRecharging: (seconds) => `Pulse recharging · ${seconds} s`,
  captureMsg: "A thread of light has calmed. Release your breath to plant it.",
  release: (count) => (count === 1 ? "1 new flower opened." : `${count} new flowers opened.`),
  pulseMsg: "A calm pulse swept through the garden.",
  completeKicker: (realm) => `${realm.toUpperCase()} HAS AWAKENED`,
  completeTitle: (name) => `${name} breathes`,
  nextLabel: "Next garden",
  replayLabel: "Linger here a while",
  journeyKicker: "ALL SIX GARDENS",
  journeyTitle: "The light travels with you now",
  journeyText:
    "Silence was never the destination, but a place you now know how to find again. The gardens stay open whenever you wish to return.",
  gardenButton: "Return to the garden map",
  pauseKicker: "A MOMENT OF YOUR OWN",
  pauseHeading: "The garden waits",
  pauseText: "Rest here for as long as you need.",
  resumeLabel: "Continue",
  motionLabel: "Calmer motion",
  soundToggleLabel: "Sound",
  restartLabel: "Restart the garden",
  menuLabel: "Back to the beginning",
  safetyNote: "No flashing, no time pressure. Progress is saved only on this device.",
  mapKicker: "THE GARDEN OF SILENCE",
  mapTitle: "Choose where to return",
  mapCloseLabel: "Close the map",
  mapOpen: "OPEN",
  mapDormant: "DORMANT",
  mapFlowers: (goal) => (goal === 1 ? "1 light flower" : `${goal} light flowers`),
  continueWith: (name) => `Continue: ${name}`,
  orientationText: "Turn your device sideways so the garden has room to breathe.",
  languageSwitched: "Language switched to English.",
  controlsMove: "pointer or WASD/arrows",
  controlsInhale: "hold left mouse, Space, or breath button",
  controlsExhale: "release",
  controlsPause: "P or Escape",
  controlsFullscreen: "F",
};

export const STRINGS: Record<Lang, UiStrings> = { fi, en };
