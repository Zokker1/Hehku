import Phaser from "phaser";
import { inputBridge } from "./input";
import { CalmModel, type ActionFrame, type CalmEvent } from "./CalmModel";
import type { LevelPalette } from "../content/levels";

interface SceneCallbacks {
  onProgress: (open: number, total: number, carried: number) => void;
  onEvent: (event: CalmEvent) => void;
  onBreathing: (inhaling: boolean) => void;
  onPulseCooldown: (cooldown: number) => void;
}

interface AmbientBlob {
  image: Phaser.GameObjects.Image;
  baseX: number;
  baseY: number;
  driftX: number;
  driftY: number;
  phase: number;
}

export class CalmScene extends Phaser.Scene {
  private model: CalmModel;
  private callbacks: SceneCallbacks;
  private background?: Phaser.GameObjects.Image;
  private backgroundKey?: string;
  private ambient: AmbientBlob[] = [];
  private flowerViews: Phaser.GameObjects.Graphics[] = [];
  private knotViews = new Map<number, Phaser.GameObjects.Graphics>();
  private carriedViews: Phaser.GameObjects.Image[] = [];
  private playerGlow?: Phaser.GameObjects.Image;
  private playerCore?: Phaser.GameObjects.Image;
  private auraGraphics?: Phaser.GameObjects.Graphics;
  private currentPalette!: LevelPalette;
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys?: Record<string, Phaser.Input.Keyboard.Key>;
  private pointerTarget: { x: number; y: number } | null = null;
  private pointerSeen = false;
  private pulseWasDown = false;
  private lastBreathing = false;
  private lastOpen = -1;
  private lastCarried = -1;
  private deterministic = false;

  constructor(model: CalmModel, callbacks: SceneCallbacks) {
    super({ key: "calm" });
    this.model = model;
    this.callbacks = callbacks;
  }

  create() {
    this.createBaseTextures();
    this.cursors = this.input.keyboard?.createCursorKeys();
    if (this.input.keyboard) {
      this.keys = this.input.keyboard.addKeys("W,A,S,D,E,SPACE,F") as Record<
        string,
        Phaser.Input.Keyboard.Key
      >;
    }

    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      this.pointerTarget = { x: pointer.worldX, y: pointer.worldY };
      this.pointerSeen = true;
    });
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      this.pointerTarget = { x: pointer.worldX, y: pointer.worldY };
      this.pointerSeen = true;
    });
    this.events.on("shutdown", () => {
      this.input.removeAllListeners();
    });

    this.buildLevel();
    this.scale.on("resize", () => this.refreshCamera());
    this.refreshCamera();
  }

  private refreshCamera() {
    this.cameras.main.setViewport(0, 0, this.scale.width, this.scale.height);
  }

  startLevel(index: number) {
    this.model.loadLevel(index);
    if (this.sys.isActive()) this.buildLevel();
  }

  clearMotionEffects() {
    if (!this.sys.isActive()) return;
    this.tweens.killAll();
    for (const child of this.children.list.slice()) {
      if (child.getData("motionEffect")) child.destroy();
    }
  }

  private buildLevel() {
    this.currentPalette = this.model.config.palette;
    this.lastOpen = -1;
    this.lastCarried = -1;
    this.pointerTarget = null;
    this.pointerSeen = false;

    this.background?.destroy();
    if (this.backgroundKey && this.textures.exists(this.backgroundKey)) {
      this.textures.remove(this.backgroundKey);
    }
    this.ambient.forEach((blob) => blob.image.destroy());
    this.ambient = [];
    this.flowerViews.forEach((view) => view.destroy());
    this.flowerViews = [];
    this.knotViews.forEach((view) => view.destroy());
    this.knotViews.clear();
    this.carriedViews.forEach((view) => view.destroy());
    this.carriedViews = [];
    this.playerGlow?.destroy();
    this.playerCore?.destroy();
    this.auraGraphics?.destroy();

    const key = `background-${this.model.config.id}-${Date.now()}`;
    this.backgroundKey = key;
    this.makeBackgroundTexture(key, this.currentPalette, this.model.config.seed);
    this.background = this.add.image(640, 360, key).setDepth(-20);

    for (let index = 0; index < 9; index += 1) {
      const angle = (index / 9) * Math.PI * 2;
      const radius = 210 + (index % 3) * 75;
      const image = this.add
        .image(640 + Math.cos(angle) * radius, 360 + Math.sin(angle) * radius * 0.55, "soft-glow")
        .setTint(Phaser.Display.Color.HexStringToColor(index % 2 ? this.currentPalette.glow : this.currentPalette.mist).color)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setAlpha(0.07 + (index % 3) * 0.018)
        .setScale(2.3 + (index % 4) * 0.65)
        .setDepth(-10);
      this.ambient.push({
        image,
        baseX: image.x,
        baseY: image.y,
        driftX: 15 + (index % 4) * 8,
        driftY: 10 + (index % 3) * 7,
        phase: index * 0.73,
      });
    }

    const flowerPositions = this.getFlowerPositions(this.model.config.goal);
    this.flowerViews = flowerPositions.map((position, index) => {
      const flower = this.add.graphics().setPosition(position.x, position.y).setDepth(-1);
      flower.setData("index", index);
      flower.setData("phase", index * 0.83);
      return flower;
    });

    for (const knot of this.model.state.knots) {
      const view = this.add.graphics().setDepth(3);
      this.knotViews.set(knot.id, view);
    }

    this.auraGraphics = this.add.graphics().setDepth(1);
    this.playerGlow = this.add
      .image(640, 360, "soft-glow")
      .setTint(Phaser.Display.Color.HexStringToColor(this.currentPalette.glow).color)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setScale(0.72)
      .setDepth(4);
    this.playerCore = this.add
      .image(640, 360, "core")
      .setTint(Phaser.Display.Color.HexStringToColor(this.currentPalette.accent).color)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(5);

    this.carriedViews = Array.from({ length: this.model.config.goal }, () =>
      this.add
        .image(640, 360, "spark")
        .setTint(Phaser.Display.Color.HexStringToColor(this.currentPalette.warm).color)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setVisible(false)
        .setDepth(5),
    );

    this.syncViews(0);
  }

  update(_time: number, deltaMs: number) {
    if (this.deterministic) return;
    this.step(Math.min(deltaMs, 34) / 1000);
  }

  advanceDeterministic(ms: number) {
    this.deterministic = true;
    const steps = Math.max(1, Math.round(ms / (1000 / 60)));
    for (let index = 0; index < steps; index += 1) this.step(1 / 60);
    this.deterministic = false;
  }

  private step(dt: number) {
    const state = this.model.state;
    if (state.mode === "playing") {
      const left = Boolean(this.cursors?.left.isDown || this.keys?.A.isDown);
      const right = Boolean(this.cursors?.right.isDown || this.keys?.D.isDown);
      const up = Boolean(this.cursors?.up.isDown || this.keys?.W.isDown);
      const down = Boolean(this.cursors?.down.isDown || this.keys?.S.isDown);
      const pulseDown = Boolean(this.keys?.E.isDown || inputBridge.pulseRequested);
      const action: ActionFrame = {
        moveX: Number(right) - Number(left),
        moveY: Number(down) - Number(up),
        pointerTarget: this.pointerSeen ? this.pointerTarget : null,
        inhaling: Boolean(this.input.activePointer.isDown || this.keys?.SPACE.isDown || inputBridge.domBreathing),
        pulse: pulseDown && !this.pulseWasDown,
      };
      this.pulseWasDown = pulseDown;
      inputBridge.pulseRequested = false;
      this.model.update(dt, action);

      if (this.keys?.F && Phaser.Input.Keyboard.JustDown(this.keys.F)) this.toggleFullscreen();
    }

    if (state.inhaling !== this.lastBreathing) {
      this.lastBreathing = state.inhaling;
      this.callbacks.onBreathing(state.inhaling);
    }

    for (const event of this.model.drainEvents()) {
      this.playEvent(event);
      this.callbacks.onEvent(event);
    }

    this.syncViews(dt);
    this.callbacks.onPulseCooldown(state.pulseCooldown);
  }

  private syncViews(_dt: number) {
    const state = this.model.state;
    const time = inputBridge.reducedMotion ? 0 : state.elapsed;

    for (const blob of this.ambient) {
      blob.image.x = blob.baseX + Math.sin(time * 0.09 + blob.phase) * blob.driftX;
      blob.image.y = blob.baseY + Math.cos(time * 0.075 + blob.phase) * blob.driftY;
      blob.image.rotation = Math.sin(time * 0.04 + blob.phase) * 0.08;
    }

    const player = state.player;
    this.playerGlow?.setPosition(player.x, player.y);
    this.playerCore?.setPosition(player.x, player.y);
    const breathPulse = state.inhaling ? 1 + Math.sin(time * 1.65) * 0.05 : 1 + Math.sin(time * 0.8) * 0.025;
    this.playerGlow?.setScale((state.inhaling ? 1.02 : 0.72) * breathPulse);
    this.playerCore?.setScale(0.9 + Math.sin(time * 1.2) * 0.04);

    this.auraGraphics?.clear();
    if (this.auraGraphics) {
      const auraColor = Phaser.Display.Color.HexStringToColor(this.currentPalette.glow).color;
      this.auraGraphics.lineStyle(1.2, auraColor, state.inhaling ? 0.24 : 0.09);
      this.auraGraphics.strokeCircle(player.x, player.y, state.aura);
      this.auraGraphics.lineStyle(1, auraColor, state.inhaling ? 0.09 : 0.035);
      this.auraGraphics.strokeCircle(player.x, player.y, state.aura * 0.74);
      if (state.stillness > 2 && this.model.config.id >= 3) {
        this.auraGraphics.lineStyle(1.5, auraColor, Math.min(0.3, (state.stillness - 2) * 0.12));
        this.auraGraphics.strokeCircle(player.x, player.y, state.aura * 1.06);
      }
    }

    for (const knot of state.knots) {
      const view = this.knotViews.get(knot.id);
      if (!view) continue;
      if (!knot.alive) {
        view.setVisible(false);
        continue;
      }
      view.setVisible(true).setPosition(knot.x, knot.y);
      this.drawKnot(view, knot.phase + time * 0.17, knot.soothed > 0);
    }

    state.blossoms.forEach((open, index) => {
      this.drawFlower(this.flowerViews[index], open, time + index * 0.7);
    });

    this.carriedViews.forEach((view, index) => {
      const visible = index < state.carried;
      view.setVisible(visible);
      if (visible) {
        const angle = time * (0.7 + index * 0.06) + (index / Math.max(1, state.carried)) * Math.PI * 2;
        const radius = 32 + (index % 3) * 8;
        view.setPosition(player.x + Math.cos(angle) * radius, player.y + Math.sin(angle) * radius);
        view.setScale(0.7 + Math.sin(time * 2 + index) * 0.1);
      }
    });

    const open = state.blossoms.filter(Boolean).length;
    if (open !== this.lastOpen || state.carried !== this.lastCarried) {
      this.lastOpen = open;
      this.lastCarried = state.carried;
      this.callbacks.onProgress(open, state.blossoms.length, state.carried);
    }
  }

  private drawKnot(graphics: Phaser.GameObjects.Graphics, phase: number, soothed: boolean) {
    graphics.clear();
    const color = Phaser.Display.Color.HexStringToColor(
      soothed ? this.currentPalette.warm : this.currentPalette.accent,
    ).color;
    graphics.lineStyle(1.25, color, soothed ? 0.72 : 0.52);
    for (let layer = 0; layer < 3; layer += 1) {
      const points: Phaser.Math.Vector2[] = [];
      const count = 18;
      for (let index = 0; index <= count; index += 1) {
        const angle = (index / count) * Math.PI * 2;
        const wobble = Math.sin(angle * (3 + layer) + phase * (1 + layer * 0.2)) * (5 - layer);
        const radius = 13 + layer * 4 + wobble;
        points.push(new Phaser.Math.Vector2(Math.cos(angle) * radius, Math.sin(angle) * radius * 0.78));
      }
      graphics.strokePoints(points, true);
    }
    graphics.fillStyle(color, soothed ? 0.3 : 0.16);
    graphics.fillCircle(0, 0, soothed ? 4 : 3);
  }

  private drawFlower(graphics: Phaser.GameObjects.Graphics, open: boolean, time: number) {
    graphics.clear();
    const accent = Phaser.Display.Color.HexStringToColor(this.currentPalette.glow).color;
    const warm = Phaser.Display.Color.HexStringToColor(this.currentPalette.warm).color;
    if (!open) {
      graphics.lineStyle(1, accent, 0.16);
      graphics.strokeCircle(0, 0, 8 + Math.sin(time * 0.8) * 1.2);
      graphics.fillStyle(accent, 0.16);
      graphics.fillCircle(0, 0, 3);
      return;
    }
    const petals = 7;
    for (let index = 0; index < petals; index += 1) {
      const angle = (index / petals) * Math.PI * 2 + time * 0.015;
      const length = 18 + Math.sin(time * 0.6 + index) * 2;
      const x = Math.cos(angle) * 13;
      const y = Math.sin(angle) * 13;
      graphics.fillStyle(index % 2 ? accent : warm, 0.38);
      graphics.fillEllipse(x, y, 9, length);
    }
    graphics.fillStyle(warm, 0.8);
    graphics.fillCircle(0, 0, 4.5);
    graphics.lineStyle(1, accent, 0.17);
    graphics.strokeCircle(0, 0, 28 + Math.sin(time * 0.4) * 2);
  }

  private playEvent(event: CalmEvent) {
    if (inputBridge.reducedMotion) return;
    if (event.type === "capture") {
      this.burst(event.x ?? 0, event.y ?? 0, this.currentPalette.warm, 9, 36);
    }
    if (event.type === "release") {
      const x = event.x ?? this.model.state.player.x;
      const y = event.y ?? this.model.state.player.y;
      this.ringWave(x, y, this.currentPalette.glow);
      this.burst(x, y, this.currentPalette.glow, Math.min(24, 8 + (event.count ?? 1) * 3), 105);
    }
    if (event.type === "pulse") {
      this.ringWave(event.x ?? 0, event.y ?? 0, this.currentPalette.warm, 360);
    }
  }

  private burst(x: number, y: number, colorHex: string, count: number, distance: number) {
    const color = Phaser.Display.Color.HexStringToColor(colorHex).color;
    for (let index = 0; index < count; index += 1) {
      const spark = this.add
        .image(x, y, "spark")
        .setData("motionEffect", true)
        .setTint(color)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(8)
        .setScale(0.5 + Math.random() * 0.6);
      const angle = (index / count) * Math.PI * 2 + Math.random() * 0.35;
      const radius = distance * (0.45 + Math.random() * 0.55);
      this.tweens.add({
        targets: spark,
        x: x + Math.cos(angle) * radius,
        y: y + Math.sin(angle) * radius,
        alpha: 0,
        scale: 0.1,
        duration: inputBridge.reducedMotion ? 250 : 850 + Math.random() * 450,
        ease: "Cubic.easeOut",
        onComplete: () => spark.destroy(),
      });
    }
  }

  private ringWave(x: number, y: number, colorHex: string, maxRadius = 230) {
    const ring = this.add.graphics().setDepth(7).setData("motionEffect", true);
    const color = Phaser.Display.Color.HexStringToColor(colorHex).color;
    const proxy = { radius: 20, alpha: 0.5 };
    this.tweens.add({
      targets: proxy,
      radius: maxRadius,
      alpha: 0,
      duration: inputBridge.reducedMotion ? 350 : 1300,
      ease: "Sine.easeOut",
      onUpdate: () => {
        ring.clear();
        ring.lineStyle(1.4, color, proxy.alpha);
        ring.strokeCircle(x, y, proxy.radius);
      },
      onComplete: () => ring.destroy(),
    });
  }

  private getFlowerPositions(count: number) {
    return Array.from({ length: count }, (_, index) => {
      const angle = (index / count) * Math.PI * 2 - Math.PI / 2;
      const radiusX = 490 - (index % 2) * 45;
      const radiusY = 270 - (index % 3) * 18;
      return { x: 640 + Math.cos(angle) * radiusX, y: 370 + Math.sin(angle) * radiusY };
    });
  }

  private createBaseTextures() {
    if (!this.textures.exists("soft-glow")) {
      const texture = this.textures.createCanvas("soft-glow", 256, 256);
      const context = texture!.context;
      const gradient = context.createRadialGradient(128, 128, 0, 128, 128, 128);
      gradient.addColorStop(0, "rgba(255,255,255,0.95)");
      gradient.addColorStop(0.12, "rgba(255,255,255,0.54)");
      gradient.addColorStop(0.42, "rgba(255,255,255,0.12)");
      gradient.addColorStop(1, "rgba(255,255,255,0)");
      context.fillStyle = gradient;
      context.fillRect(0, 0, 256, 256);
      texture!.refresh();
    }
    if (!this.textures.exists("core")) {
      const texture = this.textures.createCanvas("core", 48, 48);
      const context = texture!.context;
      const gradient = context.createRadialGradient(24, 24, 0, 24, 24, 24);
      gradient.addColorStop(0, "rgba(255,255,255,1)");
      gradient.addColorStop(0.25, "rgba(255,255,255,0.92)");
      gradient.addColorStop(0.55, "rgba(255,255,255,0.3)");
      gradient.addColorStop(1, "rgba(255,255,255,0)");
      context.fillStyle = gradient;
      context.fillRect(0, 0, 48, 48);
      texture!.refresh();
    }
    if (!this.textures.exists("spark")) {
      const texture = this.textures.createCanvas("spark", 18, 18);
      const context = texture!.context;
      const gradient = context.createRadialGradient(9, 9, 0, 9, 9, 9);
      gradient.addColorStop(0, "rgba(255,255,255,1)");
      gradient.addColorStop(0.2, "rgba(255,255,255,0.75)");
      gradient.addColorStop(1, "rgba(255,255,255,0)");
      context.fillStyle = gradient;
      context.fillRect(0, 0, 18, 18);
      texture!.refresh();
    }
  }

  private makeBackgroundTexture(key: string, palette: LevelPalette, seed: number) {
    const texture = this.textures.createCanvas(key, 1280, 720);
    const context = texture!.context;
    const gradient = context.createLinearGradient(0, 0, 1280, 720);
    gradient.addColorStop(0, palette.deep);
    gradient.addColorStop(0.52, palette.mid);
    gradient.addColorStop(1, palette.deep);
    context.fillStyle = gradient;
    context.fillRect(0, 0, 1280, 720);

    const color = Phaser.Display.Color.HexStringToColor(palette.mist);
    for (let index = 0; index < 7; index += 1) {
      const x = ((seed * (index + 3) * 47) % 1180) + 50;
      const y = ((seed * (index + 7) * 29) % 620) + 50;
      const radius = 170 + ((seed + index * 71) % 220);
      const mist = context.createRadialGradient(x, y, 0, x, y, radius);
      mist.addColorStop(0, `rgba(${color.red},${color.green},${color.blue},0.13)`);
      mist.addColorStop(1, `rgba(${color.red},${color.green},${color.blue},0)`);
      context.fillStyle = mist;
      context.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    }

    context.save();
    context.globalCompositeOperation = "screen";
    for (let index = 0; index < 1100; index += 1) {
      const x = (index * 97 + seed * 13) % 1280;
      const y = (index * 53 + seed * 7) % 720;
      const alpha = 0.015 + ((index * 17) % 23) / 2100;
      context.fillStyle = `rgba(225,255,243,${alpha})`;
      context.fillRect(x, y, 1, 1);
    }
    context.restore();

    context.strokeStyle = "rgba(225,255,243,0.035)";
    context.lineWidth = 1;
    for (let band = 0; band < 5; band += 1) {
      context.beginPath();
      for (let x = -40; x <= 1320; x += 20) {
        const y = 110 + band * 128 + Math.sin(x * 0.007 + seed + band) * (22 + band * 3);
        if (x === -40) context.moveTo(x, y);
        else context.lineTo(x, y);
      }
      context.stroke();
    }
    texture!.refresh();
  }

  private toggleFullscreen() {
    if (this.scale.isFullscreen) this.scale.stopFullscreen();
    else this.scale.startFullscreen();
  }
}
