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
      image: {
        src: mainImg,
        ratio: 4,
      },
      textures: {
        drone: {
          x: 0,
          y: 0,
          width: 16,
          height: 16,
        },
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
