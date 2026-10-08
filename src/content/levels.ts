import type { Lang } from "./i18n";

export type KnotKind = "drift" | "shy" | "orbit" | "echo";

export interface LevelPalette {
  deep: string;
  mid: string;
  glow: string;
  accent: string;
  warm: string;
  mist: string;
}

export interface LevelConfig {
  id: number;
  name: string;
  realm: string;
  subtitle: string;
  completion: string;
  goal: number;
  seed: number;
  kinds: KnotKind[];
  unlock: string | null;
  abilityHint: string | null;
  palette: LevelPalette;
  frequency: number;
}

interface LevelText {
  name: string;
  realm: string;
  subtitle: string;
  completion: string;
  unlock: string | null;
  abilityHint: string | null;
}

type LevelBase = Omit<LevelConfig, keyof LevelText>;

const BASES: LevelBase[] = [
  {
    id: 1,
    goal: 5,
    seed: 2741,
    kinds: ["drift"],
    palette: {
      deep: "#07191c",
      mid: "#123c38",
      glow: "#8ff5c6",
      accent: "#c7ffe3",
      warm: "#ffd69b",
      mist: "#3a8f79",
    },
    frequency: 174,
  },
  {
    id: 2,
    goal: 6,
    seed: 4819,
    kinds: ["drift", "orbit"],
    palette: {
      deep: "#071525",
      mid: "#15395a",
      glow: "#76dce5",
      accent: "#b9fbff",
      warm: "#ffd1a3",
      mist: "#315f8d",
    },
    frequency: 196,
  },
  {
    id: 3,
    goal: 7,
    seed: 9107,
    kinds: ["drift", "shy"],
    palette: {
      deep: "#101b16",
      mid: "#304532",
      glow: "#b6e879",
      accent: "#e0ffae",
      warm: "#f6c97a",
      mist: "#657b43",
    },
    frequency: 220,
  },
  {
    id: 4,
    goal: 8,
    seed: 1283,
    kinds: ["shy", "orbit"],
    palette: {
      deep: "#120f26",
      mid: "#39295f",
      glow: "#bd8cff",
      accent: "#e8ceff",
      warm: "#7ff4d1",
      mist: "#6c4fa2",
    },
    frequency: 233,
  },
  {
    id: 5,
    goal: 9,
    seed: 7733,
    kinds: ["drift", "echo", "orbit"],
    palette: {
      deep: "#111626",
      mid: "#263c59",
      glow: "#f6d88b",
      accent: "#fff0b3",
      warm: "#9bdcf5",
      mist: "#5b658d",
    },
    frequency: 261.6,
  },
  {
    id: 6,
    goal: 10,
    seed: 6047,
    kinds: ["drift", "shy", "orbit", "echo"],
    palette: {
      deep: "#211511",
      mid: "#5b342b",
      glow: "#ffbd79",
      accent: "#ffe0a6",
      warm: "#e88673",
      mist: "#8f5140",
    },
    frequency: 293.7,
  },
];

const TEXTS: Record<Lang, LevelText[]> = {
  fi: [
    {
      name: "Aamukaste",
      realm: "Ensimmäinen puutarha",
      subtitle: "Opettele vetämään levottomat säikeet lähellesi ja päästämään irti.",
      completion: "Pienikin hellittäminen voi saada kokonaisen aamun avautumaan.",
      unlock: "Hengityskehä",
      abilityHint: null,
    },
    {
      name: "Syvä vesi",
      realm: "Toinen puutarha",
      subtitle: "Virtaukset liikuttavat ajatuksia, mutta hengityksesi liikkuu niiden mukana.",
      completion: "Syvyys ei vaatinut sinua kiirehtimään. Se vain kantoi.",
      unlock: "Leveämpi hengityskehä",
      abilityHint: null,
    },
    {
      name: "Sammalholvi",
      realm: "Kolmas puutarha",
      subtitle: "Kun pysähdyt hetkeksi, puutarha tulee itse lähemmäs.",
      completion: "Paikallaan olo ei ollut pysähtymistä. Se oli kuuntelemista.",
      unlock: "Tyyneyspulssi",
      abilityHint: "E · tyyneyspulssi",
    },
    {
      name: "Revontuliverho",
      realm: "Neljäs puutarha",
      subtitle: "Ujot valot vetäytyvät, jos niitä kiirehtii. Lähesty pehmeästi.",
      completion: "Taivas taipui, koska et yrittänyt pitää siitä kiinni.",
      unlock: "Lempeä lähestyminen",
      abilityHint: "E · tyyneyspulssi",
    },
    {
      name: "Tähtiniitty",
      realm: "Viides puutarha",
      subtitle: "Säikeet muistavat toisensa. Yksi rauhoittunut valo kutsuu seuraavaa.",
      completion: "Yksikään valo ei ollut yksin. Jokainen vastasi toisen hehkuun.",
      unlock: "Resonanssiketju",
      abilityHint: "E · resonanssipulssi",
    },
    {
      name: "Sisäinen aurinko",
      realm: "Kuudes puutarha",
      subtitle: "Kaikki oppimasi hengittää yhdessä. Anna puutarhan löytää oma rytminsä.",
      completion: "Valo ei tullut ulkopuolelta. Se odotti, että tekisit sille tilaa.",
      unlock: "Koko puutarha",
      abilityHint: "E · valopulssi",
    },
  ],
  en: [
    {
      name: "Morning Dew",
      realm: "First garden",
      subtitle: "Learn to draw restless threads close to you and let go.",
      completion: "Even a small letting go can open an entire morning.",
      unlock: "Breath ring",
      abilityHint: null,
    },
    {
      name: "Deep Water",
      realm: "Second garden",
      subtitle: "Currents move thoughts, but your breath moves with them.",
      completion: "The depth never asked you to hurry. It simply carried you.",
      unlock: "Wider breath ring",
      abilityHint: null,
    },
    {
      name: "Moss Vault",
      realm: "Third garden",
      subtitle: "When you pause for a moment, the garden itself draws closer.",
      completion: "Stillness was not stopping. It was listening.",
      unlock: "Calm pulse",
      abilityHint: "E · calm pulse",
    },
    {
      name: "Aurora Veil",
      realm: "Fourth garden",
      subtitle: "Shy lights retreat if they are rushed. Approach softly.",
      completion: "The sky bent toward you because you did not try to hold it.",
      unlock: "Gentle approach",
      abilityHint: "E · calm pulse",
    },
    {
      name: "Star Meadow",
      realm: "Fifth garden",
      subtitle: "The threads remember one another. One calmed light calls the next.",
      completion: "No light was alone. Each answered another's glow.",
      unlock: "Resonance chain",
      abilityHint: "E · resonance pulse",
    },
    {
      name: "Inner Sun",
      realm: "Sixth garden",
      subtitle: "Everything you have learned breathes together. Let the garden find its own rhythm.",
      completion: "The light never came from outside. It waited for you to make room for it.",
      unlock: "The whole garden",
      abilityHint: "E · light pulse",
    },
  ],
};

export function getLevels(lang: Lang): LevelConfig[] {
  const texts = TEXTS[lang] ?? TEXTS.fi;
  return BASES.map((base, index) => ({ ...base, ...texts[index] }));
}

/** Finnish levels (default, backwards compatible). */
export const LEVELS: LevelConfig[] = getLevels("fi");
