// Copyright (c) Ali Shakiba
// Licensed under the MIT License

export class Calc {
  static vec2Length(a: number, b: number) {
    return Math.sqrt(a * a + b * b);
  }

  static randomNumber(min?: number, max?: number) {
    if (typeof min === "undefined") {
      max = 1;
      min = 0;
    } else if (typeof max === "undefined") {
      max = min;
      min = 0;
    }
    return min == max ? min : Math.random() * (max - min) + min;
  }

  static wrapNumber(num: number, min?: number, max?: number) {
    if (typeof min === "undefined") {
      max = 1;
      min = 0;
    } else if (typeof max === "undefined") {
      max = min;
      min = 0;
    }
    if (max > min) {
      num = (num - min) % (max - min);
      return num + (num < 0 ? max : min);
    } else {
      num = (num - max) % (min - max);
      return num + (num <= 0 ? min : max);
    }
  }

  static clampNumber(num: number, min?: number, max?: number) {
    if (num < min) {
      return min;
    } else if (num > max) {
      return max;
    } else {
      return num;
    }
  }
}
