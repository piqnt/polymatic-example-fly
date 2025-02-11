// Copyright (c) Ali Shakiba
// Licensed under the MIT License

import { nanoid } from "nanoid";

export class Drone {
  key = "drone-" + nanoid(6);

  // config
  vMin: number;
  vMax: number;
  aMax: number;

  // state
  position = { x: 0, y: 0 };
  velocity = { x: 0, y: 0 };
  v: number; // derived from velocity
  angle: number;
  tilt: number;

  constructor(config: DroneConfig) {
    this.vMin = config.vMin;
    this.vMax = config.vMax;
    this.aMax = config.aMax;

    this.velocity.x = this.vMin;
    this.velocity.y = 0;
    this.v = this.vMin;
    this.angle = 0;
    this.tilt = 0;
  }
}

export interface DroneConfig {
  vMin: number;
  vMax: number;
  aMax: number;
}

export interface DroneControl {
  trust?: { main: number; side: number };
  direction?: { x: number; y: number };
  circle?: { x: number; y: number };
}

export interface Field {
  width: number;
  height: number;

  xMin: number;
  xMax: number;

  yMin: number;
  yMax: number;
}
