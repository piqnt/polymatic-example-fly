// Copyright (c) Ali Shakiba
// Licensed under the MIT License

import { Middleware } from "polymatic";

import { type MainContext } from "./Main";
import { Plane, type PlaneControl } from "./Data";
import { Calc } from "./Calc";
import { type FrameLoopEvent } from "./FrameLoop";

export class Airspace extends Middleware<MainContext> {
  constructor() {
    super();
    this.on("activate", this.handleActivate);
    this.on("terminal-start", this.handleTerminalStart);
    this.on("terminal-size", this.handleTerminalSize);
    this.on("frame-update", this.handleFrameUpdate);
  }

  handleActivate = () => {
    this.context.running = false;
    this.context.planes = [];
  };

  handleTerminalStart = () => {
    const speed = 100 / 1000;
    const acc = (speed * 2) / 1000;

    const plane = new Plane({
      vMin: speed,
      vMax: speed * 2,
      aMax: acc,
    });

    this.context.planes.push(plane);
  };

  handleTerminalSize = (size: { width: number; height: number }) => {
    this.context.field = {
      width: size.width,
      height: size.height,
      xMin: -size.width / 2,
      yMin: -size.height / 2,
      xMax: +size.width / 2,
      yMax: +size.height / 2,
    };
  };

  handleFrameUpdate = (ev: FrameLoopEvent) => {
    if (!this.context.running) return;
    const dt = Math.min(100, ev.dt);

    this.controlPlane(dt, this.context.planes[0]);

    for (let i = 0, n = this.context.planes.length; i < n; i++) {
      this.stepPlane(dt, this.context.planes[i]);
    }
  };

  controlPlane = (dt: number, plane: Plane) => {
    let aSide = 0;
    let aMain = 0;

    if (this.context.control.circle) {
      const p = plane.position.x - this.context.control.circle.x;
      const q = plane.position.y - this.context.control.circle.y;
      const inn = p * plane.velocity.x + q * plane.velocity.y;
      const out = p * plane.velocity.y - q * plane.velocity.x;
      const b = (out * 2) / dt;
      const v2 = plane.v * plane.v;
      let d = b * b - 4 * v2 * (v2 + (inn * 2) / dt);
      if (d >= 0) {
        d = Math.sqrt(d);
        const m1 = (((b - d) / 2 / v2) * plane.v) / dt;
        const m2 = (((-b - d) / 2 / v2) * plane.v) / dt;
        aSide = Math.abs(m1) <= Math.abs(m2) ? -m1 : m2;
      }
      // var x = plane.accCY - plane.y;
      // var y = -(plane.accCX - plane.x);
      // var out = x * plane.vy - y * plane.vx;
      // var inn = x * plane.vx + y * plane.vy;
      // if (out < 0) {
      // m = out / inn / t / (plane.aMax / plane.v);
      // }
    } else if (this.context.control.direction) {
      const x = this.context.control.direction.x;
      const y = this.context.control.direction.y;
      const d = Calc.vec2Length(x, y);
      aSide = ((x * plane.velocity.y - y * plane.velocity.x) / plane.v / d) * plane.aMax;
    } else if (this.context.control.trust) {
      aMain = this.context.control.trust.main * 0.001;
      aSide = this.context.control.trust.side * plane.aMax;
    }

    if (aSide || aMain) {
      aSide = Calc.clampNumber(aSide, -plane.aMax, plane.aMax);
      aSide = aSide / plane.v;

      plane.velocity.x += +plane.velocity.x * aMain * dt;
      plane.velocity.y += +plane.velocity.y * aMain * dt;

      plane.velocity.x += +plane.velocity.y * aSide * dt;
      plane.velocity.y += -plane.velocity.x * aSide * dt;

      let v = Calc.vec2Length(plane.velocity.x, plane.velocity.y);
      plane.v = Calc.clampNumber(v, plane.vMin, plane.vMax);
      v = plane.v / v;
      plane.velocity.x *= v;
      plane.velocity.y *= v;

      const angle = Math.atan2(plane.velocity.y, plane.velocity.x);
      plane.tilt = (plane.tilt * (200 - dt) + Calc.wrapNumber(plane.angle - angle, -Math.PI, Math.PI)) / 200;
      plane.angle = angle;
    } else {
      plane.tilt = (plane.tilt * (200 - dt)) / 200;
    }
  };

  stepPlane = (dt: number, plane: Plane) => {
    const px = plane.position.x + plane.velocity.x * dt;
    const py = plane.position.y + plane.velocity.y * dt;

    plane.position.x = Calc.wrapNumber(px, this.context.field.xMin, this.context.field.xMax);
    plane.position.y = Calc.wrapNumber(py, this.context.field.yMin, this.context.field.yMax);
  };
}
