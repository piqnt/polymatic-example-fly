// Copyright (c) Ali Shakiba
// Licensed under the MIT License

import * as Stage from "stage-js";
import { Middleware } from "polymatic";

import mainImg from "../media/main.png";

import { type MainContext } from "./Main";

export class Loader extends Middleware<MainContext> {
  constructor() {
    super();
    this.on("activate", this.handleActivate);
  }

  handleActivate = async () => {
    // Textures
    await Stage.atlas({
      image: { src: mainImg, ratio: 4 },
      ppu: 16,
      textures: {
        plane: { x: 0, y: 0, width: 1, height: 1 },
        shadow: { x: 0, y: 1, width: 1, height: 1 },
        explode: { x: 1, y: 0, width: 3, height: 3 },
      },
    });

    const stage = Stage.mount();
    stage.attr("spy", true);

    stage.viewbox(300, 300).pin("handle", -0.5);

    this.setContext((context) => {
      context.stage = stage;
    });

    this.emit("stage-ready");
  };
}
