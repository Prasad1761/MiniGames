// Input Manager: Handles responsive coordinate conversion and input events

export interface CanvasPoint {
  x: number;
  y: number;
}

export class InputManager {
  /**
   * Translates client pointer coordinates into canvas logical coordinate space.
   */
  static getCanvasCoords(
    canvas: HTMLCanvasElement,
    clientX: number,
    clientY: number
  ): CanvasPoint {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    // Accounts for devicePixelRatio if canvas is pre-scaled by dpr
    const dpr = window.devicePixelRatio || 1;

    return {
      x: ((clientX - rect.left) * scaleX) / dpr,
      y: ((clientY - rect.top) * scaleY) / dpr,
    };
  }
}
