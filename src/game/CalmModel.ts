import { getLevels, type KnotKind, type LevelConfig } from "../content/levels";
import { STRINGS, type Lang } from "../content/i18n";

export type GameMode = "menu" | "playing" | "paused" | "levelComplete" | "journeyComplete";

export interface Point {
  x: number;
  y: number;
}

export interface KnotState extends Point {
  id: number;
  kind: KnotKind;
  vx: number;
  vy: number;
  phase: number;
  alive: boolean;
  soothed: number;
}

export interface CalmEvent {
  type: "capture" | "release" | "pulse" | "levelComplete";
  x?: number;
  y?: number;
  count?: number;
}

export interface ActionFrame {
  moveX: number;
  moveY: number;
  pointerTarget: Point | null;
  inhaling: boolean;
  pulse: boolean;
}

export interface CalmState {
  mode: GameMode;
  levelIndex: number;
  elapsed: number;
  player: Point & { vx: number; vy: number };
  knots: KnotState[];
  blossoms: boolean[];
  carried: number;
  inhaling: boolean;
  aura: number;
  stillness: number;
  pulseCooldown: number;
}

const WORLD = { width: 1280, height: 720, marginX: 100, marginY: 105 };

function mulberry32(seed: number) {
  return () => {
    let value = (seed += 0x6d2b79f5);
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export class CalmModel {
  state: CalmState;
  config: LevelConfig;
  lang: Lang = "fi";
  private events: CalmEvent[] = [];
  private lastInhaling = false;

  constructor(lang: Lang = "fi") {
    this.lang = lang;
    this.config = getLevels(lang)[0];
    this.state = this.createState(0);
  }

  setLang(lang: Lang) {
    if (this.lang === lang) return;
    this.lang = lang;
    const levelIndex = this.state.levelIndex;
    this.events = [];
    this.lastInhaling = false;
    this.state = this.createState(levelIndex);
    // Kielenvaihto kesken pelin palauttaa tason alkuun rauhallisesti;
    // kuuntelija lataa sen uudelleen sceneen (ks. main.ts).
  }

  private createState(levelIndex: number): CalmState {
    this.config = getLevels(this.lang)[levelIndex];
    const random = mulberry32(this.config.seed);
    const knots: KnotState[] = Array.from({ length: this.config.goal }, (_, index) => {
      const angle = (index / this.config.goal) * Math.PI * 2 + random() * 0.7;
      const radius = 155 + random() * 310;
      return {
        id: index,
        kind: this.config.kinds[index % this.config.kinds.length],
        x: WORLD.width / 2 + Math.cos(angle) * radius,
        y: WORLD.height / 2 + Math.sin(angle) * radius * 0.62,
        vx: (random() - 0.5) * 10,
        vy: (random() - 0.5) * 10,
        phase: random() * Math.PI * 2,
        alive: true,
        soothed: 0,
      };
    });

    return {
      mode: "menu",
      levelIndex,
      elapsed: 0,
      player: { x: WORLD.width / 2, y: WORLD.height / 2, vx: 0, vy: 0 },
      knots,
      blossoms: Array.from({ length: this.config.goal }, () => false),
      carried: 0,
      inhaling: false,
      aura: 120,
      stillness: 0,
      pulseCooldown: 0,
    };
  }

  loadLevel(levelIndex: number) {
    this.events = [];
    this.lastInhaling = false;
    const count = getLevels(this.lang).length;
    this.state = this.createState(Math.max(0, Math.min(count - 1, levelIndex)));
    this.state.mode = "playing";
  }

  setMode(mode: GameMode) {
    this.state.mode = mode;
  }

  update(dt: number, input: ActionFrame) {
    const state = this.state;
    if (state.mode !== "playing") return;

    const safeDt = Math.min(dt, 1 / 30);
    state.elapsed += safeDt;
    state.pulseCooldown = Math.max(0, state.pulseCooldown - safeDt);

    const player = state.player;
    const keyboardMoving = Math.abs(input.moveX) + Math.abs(input.moveY) > 0;
    let desiredVx = 0;
    let desiredVy = 0;

    if (keyboardMoving) {
      const length = Math.hypot(input.moveX, input.moveY) || 1;
      desiredVx = (input.moveX / length) * 230;
      desiredVy = (input.moveY / length) * 230;
    } else if (input.pointerTarget) {
      const dx = input.pointerTarget.x - player.x;
      const dy = input.pointerTarget.y - player.y;
      const distance = Math.hypot(dx, dy);
      const speed = Math.min(210, distance * 2.2);
      if (distance > 7) {
        desiredVx = (dx / distance) * speed;
        desiredVy = (dy / distance) * speed;
      }
    }

    const ease = 1 - Math.exp(-safeDt * 5.5);
    player.vx += (desiredVx - player.vx) * ease;
    player.vy += (desiredVy - player.vy) * ease;
    player.x = Math.max(WORLD.marginX, Math.min(WORLD.width - WORLD.marginX, player.x + player.vx * safeDt));
    player.y = Math.max(WORLD.marginY, Math.min(WORLD.height - WORLD.marginY, player.y + player.vy * safeDt));

    const speed = Math.hypot(player.vx, player.vy);
    state.stillness = speed < 12 ? Math.min(4, state.stillness + safeDt) : Math.max(0, state.stillness - safeDt * 2);
    state.inhaling = input.inhaling;

    const baseAura = this.config.id >= 2 ? 188 : 164;
    const stillnessBonus = this.config.id >= 3 ? Math.min(55, Math.max(0, state.stillness - 1.2) * 25) : 0;
    const targetAura = input.inhaling ? baseAura + stillnessBonus : 110 + stillnessBonus * 0.5;
    state.aura += (targetAura - state.aura) * (1 - Math.exp(-safeDt * 2.8));

    if (input.pulse && this.config.id >= 3 && state.pulseCooldown <= 0) {
      state.pulseCooldown = Math.max(5.5, 9 - this.config.id * 0.5);
      this.events.push({ type: "pulse", x: player.x, y: player.y });
      for (const knot of state.knots) {
        if (!knot.alive) continue;
        const distance = Math.hypot(knot.x - player.x, knot.y - player.y);
        if (distance < 370) {
          knot.soothed = 3.2;
          const strength = (1 - distance / 370) * 85;
          knot.vx += ((player.x - knot.x) / Math.max(distance, 1)) * strength;
          knot.vy += ((player.y - knot.y) / Math.max(distance, 1)) * strength;
        }
      }
    }

    for (const knot of state.knots) {
      if (!knot.alive) continue;
      knot.soothed = Math.max(0, knot.soothed - safeDt);

      const dx = player.x - knot.x;
      const dy = player.y - knot.y;
      const distance = Math.max(1, Math.hypot(dx, dy));
      const driftScale = knot.soothed > 0 ? 0.28 : 1;
      const current = Math.sin(state.elapsed * 0.65 + knot.phase);
      knot.vx += Math.cos(knot.phase * 1.7 + state.elapsed * 0.23) * 3.4 * driftScale * safeDt;
      knot.vy += current * 4.2 * driftScale * safeDt;

      if (knot.kind === "orbit") {
        knot.vx += (-dy / distance) * 4.6 * safeDt;
        knot.vy += (dx / distance) * 4.6 * safeDt;
      }

      if (knot.kind === "shy" && speed > 135 && distance < 220 && knot.soothed <= 0) {
        knot.vx -= (dx / distance) * 20 * safeDt;
        knot.vy -= (dy / distance) * 20 * safeDt;
      }

      const passiveStillness = this.config.id >= 3 && state.stillness > 2.1 && distance < state.aura * 0.85;
      if ((input.inhaling && distance < state.aura) || passiveStillness) {
        const pull = (input.inhaling ? 145 : 48) * (1 - distance / Math.max(state.aura, distance + 1));
        knot.vx += (dx / distance) * pull * safeDt;
        knot.vy += (dy / distance) * pull * safeDt;
      }

      const damping = Math.pow(0.986, safeDt * 60);
      knot.vx *= damping;
      knot.vy *= damping;
      knot.x += knot.vx * safeDt;
      knot.y += knot.vy * safeDt;

      if (knot.x < WORLD.marginX || knot.x > WORLD.width - WORLD.marginX) {
        knot.vx *= -0.8;
        knot.x = Math.max(WORLD.marginX, Math.min(WORLD.width - WORLD.marginX, knot.x));
      }
      if (knot.y < WORLD.marginY || knot.y > WORLD.height - WORLD.marginY) {
        knot.vy *= -0.8;
        knot.y = Math.max(WORLD.marginY, Math.min(WORLD.height - WORLD.marginY, knot.y));
      }

      if ((input.inhaling || passiveStillness) && distance < 34) {
        knot.alive = false;
        state.carried += 1;
        this.events.push({ type: "capture", x: knot.x, y: knot.y });

        if (this.config.id >= 5) {
          const echo = state.knots.find(
            (candidate) =>
              candidate.alive &&
              Math.hypot(candidate.x - knot.x, candidate.y - knot.y) < 150,
          );
          if (echo) {
            echo.soothed = 4;
            echo.vx += (player.x - echo.x) * 0.25;
            echo.vy += (player.y - echo.y) * 0.25;
          }
        }
      }
    }

    if (this.lastInhaling && !input.inhaling && state.carried > 0) {
      const count = state.carried;
      let remaining = count;
      for (let index = 0; index < state.blossoms.length && remaining > 0; index += 1) {
        if (!state.blossoms[index]) {
          state.blossoms[index] = true;
          remaining -= 1;
        }
      }
      state.carried = 0;
      this.events.push({ type: "release", x: player.x, y: player.y, count });

      if (state.blossoms.every(Boolean)) {
        state.mode = "levelComplete";
        this.events.push({ type: "levelComplete" });
      }
    }

    this.lastInhaling = input.inhaling;
  }

  drainEvents() {
    const result = this.events;
    this.events = [];
    return result;
  }

  visibleState() {
    const state = this.state;
    return {
      coordinateSystem: "1280x720; origin top-left; x increases right, y increases down",
      mode: state.mode,
      level: {
        number: state.levelIndex + 1,
        name: this.config.name,
        goal: this.config.goal,
      },
      player: {
        x: Math.round(state.player.x),
        y: Math.round(state.player.y),
        vx: Math.round(state.player.vx),
        vy: Math.round(state.player.vy),
        auraRadius: Math.round(state.aura),
        inhaling: state.inhaling,
        carriedLights: state.carried,
        stillnessSeconds: Number(state.stillness.toFixed(1)),
      },
      knots: state.knots
        .filter((knot) => knot.alive)
        .map((knot) => ({
          id: knot.id,
          kind: knot.kind,
          x: Math.round(knot.x),
          y: Math.round(knot.y),
          soothed: knot.soothed > 0,
        })),
      blossoms: {
        open: state.blossoms.filter(Boolean).length,
        total: state.blossoms.length,
      },
      ability:
        this.config.id >= 3
          ? { name: "calm-pulse", key: "E", cooldown: Number(state.pulseCooldown.toFixed(1)) }
          : null,
      controls: {
        move: STRINGS[this.lang].controlsMove,
        inhale: STRINGS[this.lang].controlsInhale,
        exhale: STRINGS[this.lang].controlsExhale,
        pulse: this.config.id >= 3 ? "E" : "locked",
        pause: STRINGS[this.lang].controlsPause,
        fullscreen: STRINGS[this.lang].controlsFullscreen,
      },
    };
  }
}
