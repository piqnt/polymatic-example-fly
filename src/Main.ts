// Copyright (c) Ali Shakiba
// Licensed under the MIT License

import { type Application, type Container } from "pixi.js";
import { Middleware } from "polymatic";

import { type Plane, type Field, type PlaneControl } from "./Data";
import { Airspace } from "./Airspace";
import { Terminal } from "./Terminal";
import { PixiManager, type Textures } from "./PixiManager";
import { FrameLoop } from "./FrameLoop";

export interface MainContext {
  pixi?: Application;
  scene?: Container;
  textures?: Textures;

  planes?: Plane[];
  control: PlaneControl;
  running: boolean;
  field: Field;
}

export class Main extends Middleware<MainContext> {
  constructor() {
    super();
    this.use(new FrameLoop());
    this.use(new PixiManager());
    this.on("pixi-ready", this.handlePixiReady);
  }

  handlePixiReady = () => {
    this.use(new Airspace());
    this.use(new Terminal());
  };
}
