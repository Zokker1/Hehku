import Phaser from "phaser";
import "./styles.css";
import { getLevels } from "./content/levels";
import { STRINGS, loadLang, saveLang, type Lang } from "./content/i18n";
import { AudioEngine } from "./audio/AudioEngine";
import { CalmModel, type CalmEvent, type GameMode } from "./game/CalmModel";
import { CalmScene } from "./game/CalmScene";
import { inputBridge } from "./game/input";
import { readSetting, writeSetting } from "./storage";

declare global {
  interface Window {
    render_game_to_text: () => string;
    advanceTime: (ms: number) => void;
  }
}

const $ = <T extends HTMLElement>(selector: string) => document.querySelector<T>(selector)!;

let lang: Lang = loadLang();
let LEVELS = getLevels(lang);
let t = STRINGS[lang];

const model = new CalmModel(lang);
const audio = new AudioEngine();

const welcome = $("#welcome");
const hud = $("#hud");
const levelComplete = $("#level-complete");
const journeyComplete = $("#journey-complete");
const pauseScreen = $("#pause-screen");
const gardenMap = $("#garden-map");
const breathButton = $("#breath-button");
const breathLabel = $("#breath-label");
const abilityChip = $("#ability-chip");
const statusLive = $("#status-live");
const beginButton = $("#begin-button");
const continueButton = $("#continue-button");

const savedUnlocked = Number(readSetting("hehku-unlocked") ?? "0");
let highestUnlocked = Number.isFinite(savedUnlocked) ? Math.max(0, Math.min(5, Math.floor(savedUnlocked))) : 0;
let currentLevel = 0;
let pausedFrom: GameMode = "playing";
let overlayTimer = 0;
let motionReduced =
  readSetting("hehku-reduced-motion") === "true" ||
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let muted = readSetting("hehku-muted") === "true";

inputBridge.reducedMotion = motionReduced;
document.body.classList.toggle("reduced-motion", motionReduced);
audio.setMuted(muted);

function refreshBreathLabel() {
  const inhaling = model.state.inhaling;
  breathButton.classList.toggle("is-inhaling", inhaling);
  breathLabel.textContent = inhaling ? t.breathOut : t.breathIn;
  breathButton.setAttribute("aria-label", inhaling ? t.breathAriaOut : t.breathAriaIn);
}

function refreshPulseChip() {
  if (model.config.id < 3 || abilityChip.hidden) return;
  const cooldown = model.state.pulseCooldown;
  abilityChip.classList.toggle("cooling", cooldown > 0);
  $("#ability-text").textContent =
    cooldown > 0 ? t.pulseRecharging(Math.ceil(cooldown)) : (model.config.abilityHint ?? t.pulseReady);
}

function refreshProgress(open?: number, total?: number, carried?: number) {
  const blossoms = model.state.blossoms;
  const o = open ?? blossoms.filter(Boolean).length;
  const tot = total ?? blossoms.length;
  const c = carried ?? model.state.carried;
  $("#progress-fill").style.width = `${tot === 0 ? 0 : (o / tot) * 100}%`;
  $("#progress-label").textContent = t.progress(o, tot, c);
}

const scene = new CalmScene(model, {
  onProgress: (open, total, carried) => {
    refreshProgress(open, total, carried);
  },
  onEvent: (event) => handleGameEvent(event),
  onBreathing: () => {
    refreshBreathLabel();
    audio.setBreathing(model.state.inhaling);
  },
  onPulseCooldown: () => {
    refreshPulseChip();
  },
});

const phaser = new Phaser.Game({
  type: Phaser.AUTO,
  parent: "game-shell",
  width: 1280,
  height: 720,
  backgroundColor: "#071519",
  transparent: false,
  antialias: true,
  pixelArt: false,
  render: {
    antialias: true,
    roundPixels: false,
    powerPreference: "high-performance",
    preserveDrawingBuffer: true,
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1280,
    height: 720,
  },
  scene,
  input: {
    keyboard: true,
    mouse: true,
    touch: true,
  },
});

function syncOverlayFocus() {
  const activeOverlay = document.querySelector<HTMLElement>(".overlay.active");
  for (const child of Array.from($("#app").children)) {
    if (child instanceof HTMLElement) {
      child.inert = activeOverlay !== null && child !== activeOverlay && child !== statusLive;
    }
  }
}

document.addEventListener("keydown", (event) => {
  if (event.key !== "Tab") return;
  const dialog = document.querySelector<HTMLElement>('.overlay.active[role="dialog"]');
  if (!dialog) return;
  const buttons = Array.from(dialog.querySelectorAll<HTMLButtonElement>("button:not(:disabled)"))
    .filter((button) => !button.hidden && button.getClientRects().length > 0);
  const first = buttons[0];
  const last = buttons[buttons.length - 1];
  if (!first) return;
  const focused = document.activeElement;
  if (!dialog.contains(focused) || (event.shiftKey ? focused === first : focused === last)) {
    event.preventDefault();
    (event.shiftKey ? last : first).focus();
  }
});

function show(element: HTMLElement) {
  element.classList.add("active");
  syncOverlayFocus();
}

function hide(element: HTMLElement) {
  element.classList.remove("active");
  syncOverlayFocus();
}

function updateLevelHeader() {
  const config = LEVELS[currentLevel];
  $("#level-number").textContent = `${t.gardenWord} ${String(config.id).padStart(2, "0")} / 06`;
  $("#level-name").textContent = config.name;
  abilityChip.hidden = config.id < 3;
  document.documentElement.style.setProperty("--accent", config.palette.glow);
  document.documentElement.style.setProperty("--accent-2", config.palette.warm);
}

async function startLevel(index: number) {
  currentLevel = Math.max(0, Math.min(highestUnlocked, index));
  clearTimeout(overlayTimer);
  await audio.start();
  audio.setMuted(muted);
  audio.setLevel(LEVELS[currentLevel]);
  scene.startLevel(currentLevel);
  updateLevelHeader();
  refreshProgress();
  refreshBreathLabel();
  refreshPulseChip();
  hide(welcome);
  hide(levelComplete);
  hide(journeyComplete);
  hide(pauseScreen);
  hide(gardenMap);
  hud.hidden = false;
  breathButton.hidden = false;
  document.body.classList.add("game-active");
  $("#pause-button").focus();
  statusLive.textContent = `${LEVELS[currentLevel].name}. ${LEVELS[currentLevel].subtitle}`;
}

function handleGameEvent(event: CalmEvent) {
  if (event.type === "capture") {
    audio.chime("capture", LEVELS[currentLevel].frequency * 2);
    statusLive.textContent = t.captureMsg;
  }
  if (event.type === "release") {
    audio.chime("release", LEVELS[currentLevel].frequency);
    statusLive.textContent = t.release(event.count ?? 1);
  }
  if (event.type === "pulse") {
    audio.chime("pulse", LEVELS[currentLevel].frequency);
    statusLive.textContent = t.pulseMsg;
  }
  if (event.type === "levelComplete") {
    audio.chime("complete", LEVELS[currentLevel].frequency);
    const nextUnlocked = Math.min(5, currentLevel + 1);
    highestUnlocked = Math.max(highestUnlocked, nextUnlocked);
    writeSetting("hehku-unlocked", String(highestUnlocked));
    overlayTimer = window.setTimeout(() => {
      hud.hidden = true;
      breathButton.hidden = true;
      abilityChip.hidden = true;
      if (currentLevel === LEVELS.length - 1) {
        model.setMode("journeyComplete");
        $("#journey-title").textContent = t.journeyTitle;
        show(journeyComplete);
        $("#garden-button").focus();
      } else {
        $("#complete-kicker").textContent = t.completeKicker(LEVELS[currentLevel].realm);
        $("#complete-title").textContent = t.completeTitle(LEVELS[currentLevel].name);
        $("#complete-text").textContent = LEVELS[currentLevel].completion;
        show(levelComplete);
        $("#next-button").focus();
      }
    }, motionReduced ? 250 : 1150);
  }
}

function pauseGame() {
  if (model.state.mode !== "playing") return;
  pausedFrom = model.state.mode;
  model.setMode("paused");
  inputBridge.domBreathing = false;
  show(pauseScreen);
  breathButton.hidden = true;
  abilityChip.hidden = true;
  $("#motion-button").setAttribute("aria-pressed", String(motionReduced));
  $("#pause-sound-button").setAttribute("aria-pressed", String(!muted));
  $("#resume-button").focus();
}

function resumeGame() {
  if (model.state.mode !== "paused") return;
  model.setMode(pausedFrom === "playing" ? "playing" : pausedFrom);
  hide(pauseScreen);
  breathButton.hidden = false;
  abilityChip.hidden = model.config.id < 3;
  $("#pause-button").focus();
}

function openMap() {
  renderLevelMap();
  hide(welcome);
  hide(journeyComplete);
  show(gardenMap);
  document.body.classList.remove("game-active");
  gardenMap.querySelector<HTMLButtonElement>(".level-card:not(:disabled)")?.focus();
}

function returnToMenu() {
  model.setMode("menu");
  inputBridge.domBreathing = false;
  hide(pauseScreen);
  hide(gardenMap);
  hide(levelComplete);
  hide(journeyComplete);
  show(welcome);
  hud.hidden = true;
  breathButton.hidden = true;
  abilityChip.hidden = true;
  document.body.classList.remove("game-active");
  refreshContinueButton();
  beginButton.focus();
}

function refreshContinueButton() {
  continueButton.hidden = highestUnlocked === 0;
  continueButton.textContent = t.continueWith(LEVELS[highestUnlocked].name);
}

function renderLevelMap() {
  const grid = $("#level-grid");
  grid.replaceChildren();
  LEVELS.forEach((level, index) => {
    const button = document.createElement("button");
    button.className = "level-card";
    button.disabled = index > highestUnlocked;
    button.innerHTML = `
      <small>${String(level.id).padStart(2, "0")} · ${index <= highestUnlocked ? t.mapOpen : t.mapDormant}</small>
      <strong>${level.name}</strong>
      <span>${t.mapFlowers(level.goal)}</span>
    `;
    button.addEventListener("click", () => void startLevel(index));
    grid.append(button);
  });
}

function setMuted(value: boolean) {
  muted = value;
  audio.setMuted(muted);
  writeSetting("hehku-muted", String(muted));
  $("#sound-button").textContent = muted ? "×" : "◌";
  $("#sound-button").setAttribute("aria-label", muted ? t.unmuteAria : t.muteAria);
  $("#pause-sound-button").setAttribute("aria-pressed", String(!muted));
}

function setReducedMotion(value: boolean) {
  motionReduced = value;
  inputBridge.reducedMotion = value;
  scene.clearMotionEffects();
  document.body.classList.toggle("reduced-motion", value);
  writeSetting("hehku-reduced-motion", String(value));
  $("#motion-button").setAttribute("aria-pressed", String(value));
}

/** Päivitä kaikki staattiset DOM-tekstit valitulle kielelle. */
function applyStaticTexts() {
  document.documentElement.lang = lang;
  document.title = t.metaTitle;
  document.querySelector('meta[name="description"]')?.setAttribute("content", t.metaDescription);
  $("#game-shell").setAttribute("aria-label", t.shellLabel);

  const q = (id: string) => document.querySelector<HTMLElement>(`[data-i18n="${id}"]`);
  const setText = (id: string, value: string) => {
    const el = q(id);
    if (el) el.textContent = value;
  };
  const setHtml = (id: string, value: string) => {
    const el = q(id);
    if (el) el.innerHTML = value;
  };

  setText("welcome-kicker", t.welcomeKicker);
  setText("welcome-lead", t.welcomeLead);
  setHtml("begin-label", t.beginLabel);
  setText("continue-fallback", t.continueLabel);
  q("ritual")?.setAttribute("aria-label", t.ritualLabel);
  setHtml("step-1", t.step1);
  setHtml("step-2", t.step2);
  setHtml("step-3", t.step3);
  setText("footer-1", t.footer1);
  setText("footer-2", t.footer2);
  setText("footer-3", t.footer3);

  $(".hud__progress")?.setAttribute("aria-label", t.progressLabel);
  const soundButton = $("#sound-button");
  soundButton.setAttribute("aria-label", muted ? t.unmuteAria : t.muteAria);
  soundButton.setAttribute("title", t.soundTitle);
  const pauseButton = $("#pause-button");
  pauseButton.setAttribute("aria-label", t.pauseAria);
  pauseButton.setAttribute("title", t.pauseTitle);
  breathButton.setAttribute("aria-label", model.state.inhaling ? t.breathAriaOut : t.breathAriaIn);
  refreshBreathLabel();

  setText("journey-kicker", t.journeyKicker);
  setText("journey-title", t.journeyTitle);
  setText("journey-text", t.journeyText);
  setText("garden-label", t.gardenButton);
  setText("next-label", t.nextLabel);
  setText("replay-label", t.replayLabel);
  setText("pause-kicker", t.pauseKicker);
  setText("pause-title", t.pauseHeading);
  setText("pause-text", t.pauseText);
  setText("resume-label", t.resumeLabel);
  setText("motion-label", t.motionLabel);
  setText("pause-sound-label", t.soundToggleLabel);
  setText("restart-label", t.restartLabel);
  setText("menu-label", t.menuLabel);
  setText("safety-note", t.safetyNote);
  setText("map-kicker", t.mapKicker);
  setText("map-title", t.mapTitle);
  setText("map-close-label", t.mapCloseLabel);
  setText("orientation-note-text", t.orientationText);

  document.querySelectorAll<HTMLButtonElement>(".lang-button").forEach((button) => {
    const active = button.dataset.lang === lang;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  $("#language-switcher")?.setAttribute("aria-label", t.langLabel);

  // Päivitä dynaamiset näkymät kesken olevan pelin päälle.
  refreshContinueButton();
  if (document.body.classList.contains("game-active") || model.state.mode === "playing") {
    updateLevelHeader();
    refreshProgress();
    refreshPulseChip();
  }
  if (gardenMap.classList.contains("active")) renderLevelMap();
}

function setLang(next: Lang) {
  if (next === lang) return;
  lang = next;
  t = STRINGS[lang];
  LEVELS = getLevels(lang);
  saveLang(lang);
  const wasPlaying = model.state.mode === "playing";
  model.setLang(lang);
  audio.setLevel(LEVELS[currentLevel]);
  applyStaticTexts();
  if (wasPlaying) {
    // Lataa nykyinen taso uudelleen uudella kielellä keskeyttämättä peliä.
    model.loadLevel(currentLevel);
    scene.startLevel(currentLevel);
    updateLevelHeader();
    refreshProgress();
    refreshBreathLabel();
    refreshPulseChip();
    statusLive.textContent = `${LEVELS[currentLevel].name}. ${LEVELS[currentLevel].subtitle}`;
  }
  statusLive.textContent = t.languageSwitched;
}

beginButton.addEventListener("click", () => void startLevel(0));
continueButton.addEventListener("click", () => openMap());
$("#next-button").addEventListener("click", () => void startLevel(currentLevel + 1));
$("#replay-button").addEventListener("click", () => void startLevel(currentLevel));
$("#garden-button").addEventListener("click", openMap);
$("#pause-button").addEventListener("click", pauseGame);
$("#resume-button").addEventListener("click", resumeGame);
$("#restart-button").addEventListener("click", () => void startLevel(currentLevel));
$("#menu-button").addEventListener("click", returnToMenu);
$("#map-close-button").addEventListener("click", returnToMenu);
$("#sound-button").addEventListener("click", () => setMuted(!muted));
$("#pause-sound-button").addEventListener("click", () => setMuted(!muted));
$("#motion-button").addEventListener("click", () => setReducedMotion(!motionReduced));
document.querySelectorAll<HTMLButtonElement>(".lang-button").forEach((button) => {
  button.addEventListener("click", () => {
    const next = button.dataset.lang;
    if (next === "fi" || next === "en") setLang(next);
  });
});

breathButton.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  inputBridge.domBreathing = true;
  breathButton.setPointerCapture(event.pointerId);
});

for (const eventName of ["pointerup", "pointercancel", "lostpointercapture"] as const) {
  breathButton.addEventListener(eventName, (event) => {
    event.preventDefault();
    inputBridge.domBreathing = false;
  });
}

window.addEventListener("pointerup", () => {
  inputBridge.domBreathing = false;
});

document.addEventListener("visibilitychange", () => {
  if (document.hidden && model.state.mode === "playing") pauseGame();
});

window.addEventListener("keydown", (event) => {
  if (event.code === "Space" && model.state.mode === "playing") event.preventDefault();
  if (event.code === "KeyE" && model.state.mode === "playing") inputBridge.pulseRequested = true;
  if (!event.repeat && (event.code === "KeyP" || event.code === "Escape")) {
    if (model.state.mode === "playing") pauseGame();
    else if (model.state.mode === "paused") resumeGame();
  }
});

window.render_game_to_text = () => JSON.stringify(model.visibleState());
window.advanceTime = (ms: number) => scene.advanceDeterministic(ms);

setMuted(muted);
applyStaticTexts();
syncOverlayFocus();

// Keep the game instance reachable in devtools without making it part of saved state.
void phaser;
