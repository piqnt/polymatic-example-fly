// Copyright (c) Ali Shakiba
// Licensed under the MIT License

import * as Stage from "stage-js";
import { Middleware } from "polymatic";

import { type Plane, type Field, type PlaneControl } from "./Data";
import { Airspace } from "./Airspace";
import { Terminal } from "./Terminal";
import { Loader } from "./Loader";
import { FrameLoop } from "./FrameLoop";

export interface MainContext {
  stage?: Stage.Root;

  planes?: Plane[];
  control: PlaneControl;
  running: boolean;
  field: Field;
}

export class Main extends Middleware<MainContext> {
  constructor() {
    super();
    this.use(new FrameLoop())
    this.use(new Loader());
    this.on("stage-ready", this.handleStageReady);
  }

  handleStageReady = () => {
    this.use(new Airspace());
    this.use(new Terminal());
  };
}
