// Copyright (c) Ali Shakiba
// Licensed under the MIT License

import { Container, Sprite, type FederatedPointerEvent } from "pixi.js";

import { Binder, Driver, Middleware } from "polymatic";

import { type MainContext } from "./Main";
import { Plane } from "./Data";

// the smaller screen dimension is fitted to this many scene units
const VIEWBOX_WIDTH = 300;
const VIEWBOX_HEIGHT = 300;

interface PlaneRender {
  position: Container;
  plane: Sprite;
  shadow: Sprite;
}

export class Terminal extends Middleware<MainContext> {
  constructor() {
    super();
    this.on("activate", this.handleActivate);
    this.on("deactivate", this.handleDeactivate);
    this.on("frame-render", this.handleFrameRender);
  }

  handleActivate = () => {
    const pixi = this.context.pixi;
    pixi.renderer.on("resize", this.handleViewport);

    // receive pointer events anywhere on the screen, not just on sprites
    pixi.stage.eventMode = "static";
    pixi.stage.hitArea = pixi.screen;
    pixi.stage.on("pointerdown", this.handlePointerDown);
    pixi.stage.on("pointermove", this.handlePointerMove);
    pixi.stage.on("pointerup", this.handlePointerUp);
    pixi.stage.on("pointerupoutside", this.handlePointerUp);

    document.addEventListener("keydown", this.handleKeydown);
    document.addEventListener("keyup", this.handleKeyup);

    this.handleViewport();
    this.emit("terminal-start");
  };

  handleDeactivate = () => {
    this.context.pixi?.renderer.off("resize", this.handleViewport);
    document.removeEventListener("keydown", this.handleKeydown);
    document.removeEventListener("keyup", this.handleKeyup);
  };

  /**
   * Fit the viewbox inside the screen, and center scene origin on the screen.
   */
  handleViewport = () => {
    const pixi = this.context.pixi;
    const scene = this.context.scene;

    const screenWidth = pixi.screen.width;
    const screenHeight = pixi.screen.height;

    const scale = Math.min(screenWidth / VIEWBOX_WIDTH, screenHeight / VIEWBOX_HEIGHT);
    scene.scale.set(scale);
    scene.position.set(screenWidth / 2, screenHeight / 2);

    // visible area in scene units
    const width = screenWidth / scale;
    const height = screenHeight / scale;

    this.emit("terminal-size", { width, height });
  };

  handleFrameRender = () => {
    this.binder.data(this.context.planes);
  };

  pointerDown = false;

  toScene = (e: FederatedPointerEvent) => {
    return this.context.scene.toLocal(e.global);
  };

  handlePointerDown = (e: FederatedPointerEvent) => {
    this.pointerDown = true;
    const point = this.toScene(e);
    this.context.control = { circle: { x: point.x, y: point.y } };
    this.context.running = true;
  };

  handlePointerMove = (e: FederatedPointerEvent) => {
    if (!this.pointerDown) return;
    const point = this.toScene(e);
    this.context.control = { circle: { x: point.x, y: point.y } };
  };

  handlePointerUp = (e: FederatedPointerEvent) => {
    this.pointerDown = false;
    this.context.control = {};
  };

  downKeys = {};

  updateKeys = () => {
    const accMain = this.downKeys[38] ? +1 : this.downKeys[40] ? -1 : 0;
    const accSide = this.downKeys[37] ? +1 : this.downKeys[39] ? -1 : 0;
    const accX = this.downKeys[65] ? -1 : this.downKeys[68] ? +1 : 0;
    const accY = this.downKeys[87] ? -1 : this.downKeys[83] ? +1 : 0;

    if (accMain || accSide) {
      this.context.control = { trust: { main: accMain, side: accSide } };
    } else if (accX || accSide) {
      this.context.control = { direction: { x: accX, y: accY } };
    } else {
      this.context.control = {};
    }
  };

  handleKeyup = (e: KeyboardEvent) => {
    this.downKeys[e.keyCode] = false;
    this.updateKeys();
  };

  handleKeydown = (e: KeyboardEvent) => {
    this.downKeys[e.keyCode] = true;
    this.updateKeys();
    this.context.running = true;
  };

  renderPlane = Driver.create<Plane, PlaneRender>({
    filter: (d: Plane) => true,
    enter: (d: Plane) => {
      const position = new Container();
      const shadow = new Sprite(this.context.textures.shadow);
      shadow.anchor.set(0.5);
      shadow.alpha = 0.2;
      shadow.position.set(30, 30);
      position.addChild(shadow);
      const plane = new Sprite(this.context.textures.plane);
      plane.anchor.set(0.5);
      position.addChild(plane);
      this.context.scene.addChild(position);
      return {
        shadow,
        plane,
        position,
      };
    },
    update: (d: Plane, ui: PlaneRender) => {
      const tilt = 1 - (Math.abs(d.tilt) / Math.PI) * 400;
      ui.plane.rotation = d.angle;
      ui.plane.scale.set(1, tilt);
      ui.shadow.rotation = d.angle;
      ui.shadow.scale.set(1, tilt);
      ui.position.position.set(d.position.x, d.position.y);
    },
    exit: (d: Plane, ui: PlaneRender) => {
      ui.position.removeFromParent();
      ui.position.destroy({ children: true });
    },
  });

  binder = Binder.create<Plane>({
    key: (object) => object.key,
  }).addDriver(this.renderPlane);
}
