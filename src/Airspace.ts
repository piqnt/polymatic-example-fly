// Copyright (c) Ali Shakiba
// Licensed under the MIT License

import { Middleware } from "polymatic";

import { type MainContext } from "./Main";
import { Drone, type DroneControl } from "./Data";
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
    this.context.drones = [];
  };

  handleTerminalStart = () => {
    const speed = 100 / 1000;
    const acc = (speed * 2) / 1000;

    const drone = new Drone({
      vMin: speed,
      vMax: speed * 2,
      aMax: acc,
    });

    this.context.drones.push(drone);
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

    this.controlDrone(dt, this.context.drones[0]);

    for (let i = 0, n = this.context.drones.length; i < n; i++) {
      this.stepDrone(dt, this.context.drones[i]);
    }
  };

  controlDrone = (dt: number, drone: Drone) => {
    let aSide = 0;
    let aMain = 0;

    if (this.context.control.circle) {
      const p = drone.position.x - this.context.control.circle.x;
      const q = drone.position.y - this.context.control.circle.y;
      const inn = p * drone.velocity.x + q * drone.velocity.y;
      const out = p * drone.velocity.y - q * drone.velocity.x;
      const b = (out * 2) / dt;
      const v2 = drone.v * drone.v;
      let d = b * b - 4 * v2 * (v2 + (inn * 2) / dt);
      if (d >= 0) {
        d = Math.sqrt(d);
        const m1 = (((b - d) / 2 / v2) * drone.v) / dt;
        const m2 = (((-b - d) / 2 / v2) * drone.v) / dt;
        aSide = Math.abs(m1) <= Math.abs(m2) ? -m1 : m2;
      }
      // var x = drone.accCY - drone.y;
      // var y = -(drone.accCX - drone.x);
      // var out = x * drone.vy - y * drone.vx;
      // var inn = x * drone.vx + y * drone.vy;
      // if (out < 0) {
      // m = out / inn / t / (drone.aMax / drone.v);
      // }
    } else if (this.context.control.direction) {
      const x = this.context.control.direction.x;
      const y = this.context.control.direction.y;
      const d = Calc.vec2Length(x, y);
      aSide = ((x * drone.velocity.y - y * drone.velocity.x) / drone.v / d) * drone.aMax;
    } else if (this.context.control.trust) {
      aMain = this.context.control.trust.main * 0.001;
      aSide = this.context.control.trust.side * drone.aMax;
    }

    if (aSide || aMain) {
      aSide = Calc.clampNumber(aSide, -drone.aMax, drone.aMax);
      aSide = aSide / drone.v;

      drone.velocity.x += +drone.velocity.x * aMain * dt;
      drone.velocity.y += +drone.velocity.y * aMain * dt;

      drone.velocity.x += +drone.velocity.y * aSide * dt;
      drone.velocity.y += -drone.velocity.x * aSide * dt;

      let v = Calc.vec2Length(drone.velocity.x, drone.velocity.y);
      drone.v = Calc.clampNumber(v, drone.vMin, drone.vMax);
      v = drone.v / v;
      drone.velocity.x *= v;
      drone.velocity.y *= v;

      const angle = Math.atan2(drone.velocity.y, drone.velocity.x);
      drone.tilt = (drone.tilt * (200 - dt) + Calc.wrapNumber(drone.angle - angle, -Math.PI, Math.PI)) / 200;
      drone.angle = angle;
    } else {
      drone.tilt = (drone.tilt * (200 - dt)) / 200;
    }
  };

  stepDrone = (dt: number, drone: Drone) => {
    const px = drone.position.x + drone.velocity.x * dt;
    const py = drone.position.y + drone.velocity.y * dt;

    drone.position.x = Calc.wrapNumber(px, this.context.field.xMin, this.context.field.xMax);
    drone.position.y = Calc.wrapNumber(py, this.context.field.yMin, this.context.field.yMax);
  };
}
