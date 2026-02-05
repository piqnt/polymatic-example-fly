// Copyright (c) Ali Shakiba
// Licensed under the MIT License

import * as Stage from "stage-js";
import { type Vec2Value } from "stage-js";

import { Binder, Driver, Middleware } from "polymatic";

import { type MainContext } from "./Main";
import { Plane } from "./Data";

interface PlaneRender {
  position: Stage.Node;
  plane: Stage.Sprite;
  shadow: Stage.Sprite;
}

export class Terminal extends Middleware<MainContext> {
  constructor() {
    super();
    this.on("activate", this.handleActivate);
    this.on("frame-render", this.handleFrameRender);
  }

  handleActivate = () => {
    const stage = this.context.stage;
    stage.on("viewport", this.handleViewport);

    stage.on(Stage.POINTER_DOWN, this.handlePointerDown);
    stage.on(Stage.POINTER_MOVE, this.handlePointerMove);
    stage.on(Stage.POINTER_UP, this.handlePointerUp);

    document.addEventListener("keydown", this.handleKeydown);
    document.addEventListener("keyup", this.handleKeyup);

    this.handleViewport();
    this.emit("terminal-start");
  };

  handleViewport = () => {
    const stage = this.context.stage;
    const width = stage.pin("width");
    const height = stage.pin("height");

    this.emit("terminal-size", { width, height });
  };

  handleFrameRender = () => {
    this.binder.data(this.context.planes);
  };

  pointerDown = false;

  handlePointerDown = (point: Vec2Value) => {
    this.pointerDown = true;
    this.context.control = { circle: { x: point.x, y: point.y } };
    this.context.running = true;
  };

  handlePointerMove = (point: Vec2Value) => {
    if (!this.pointerDown) return;
    this.context.control = { circle: { x: point.x, y: point.y } };
  };

  handlePointerUp = (point: Vec2Value) => {
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
    this.context.stage.touch();
  };

  renderPlane = Driver.create<Plane, PlaneRender>({
    filter: (d: Plane) => true,
    enter: (d: Plane) => {
      const position = Stage.component();
      position.pin("handle", 0.5);
      const plane = Stage.sprite("plane");
      plane.pin("handle", 0.5);
      plane.appendTo(position);
      const shadow = Stage.sprite("shadow");
      shadow.pin("handle", 0.5);
      shadow.pin({
        alpha: 0.2,
        offsetX: 30,
        offsetY: 30,
      });
      shadow.appendTo(position);
      position.appendTo(this.context.stage);
      return {
        shadow,
        plane: plane,
        position,
      };
    },
    update: (d: Plane, ui: PlaneRender) => {
      const tilt = 1 - (Math.abs(d.tilt) / Math.PI) * 400;
      ui.plane.rotate(d.angle).scale(1, tilt);
      ui.shadow.rotate(d.angle).scale(1, tilt);
      ui.position.offset(d.position);
    },
    exit: (d: Plane, ui: PlaneRender) => {
      ui.position.remove();
    },
  });

  binder = Binder.create<Plane>({
    key: (object) => object.key,
  }).addDriver(this.renderPlane);
}
