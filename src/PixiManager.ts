// Copyright (c) Ali Shakiba
// Licensed under the MIT License

import { Application, Assets, Container, Rectangle, Texture } from "pixi.js";
import { Middleware } from "polymatic";

import mainImg from "../media/main.png";

import { type MainContext } from "./Main";
import { type FrameLoopEvent } from "./FrameLoop";

export interface Textures {
  plane: Texture;
  shadow: Texture;
  explode: Texture;
}

/**
 * Creates and owns the Pixi application, loads textures, and drives Pixi's
 * ticker from the FrameLoop so there is a single loop.
 */
export class PixiManager extends Middleware<MainContext> {
  constructor() {
    super();
    this.on("activate", this.handleActivate);
    this.on("deactivate", this.handleDeactivate);
    this.on("frame-after", this.handleFrameAfter);
  }

  handleActivate = async () => {
    // Textures
    // The atlas image is 256x256 at pixel ratio 4, so it is 64x64 logical pixels.
    // Each cell is 16 logical pixels, frames below are in logical pixels.
    const atlas = await Assets.load<Texture>({ src: mainImg, data: { resolution: 4 } });
    const ppu = 16;
    const cell = (x: number, y: number, width: number, height: number) =>
      new Texture({
        source: atlas.source,
        frame: new Rectangle(x * ppu, y * ppu, width * ppu, height * ppu),
      });
    const textures: Textures = {
      plane: cell(0, 0, 1, 1),
      shadow: cell(0, 1, 1, 1),
      explode: cell(1, 0, 3, 3),
    };

    const pixi = new Application();
    await pixi.init({
      resizeTo: window,
      backgroundAlpha: 0,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
      antialias: true,
      // ticker is updated manually in handleFrameAfter, see FrameLoop
      autoStart: false,
    });
    document.body.appendChild(pixi.canvas);

    // scene container, scaled and centered by Terminal to fit the viewbox
    const scene = new Container();
    pixi.stage.addChild(scene);

    this.setContext((context) => {
      context.pixi = pixi;
      context.scene = scene;
      context.textures = textures;
    });

    this.emit("pixi-ready");
  };

  handleDeactivate = () => {
    this.context.pixi?.destroy({ removeView: true }, { children: true });
  };

  handleFrameAfter = (ev: FrameLoopEvent) => {
    if (!this.context.pixi) return;
    // runs ticker listeners and then renders the stage
    this.context.pixi.ticker.update(ev.now);
  };
}
