export class InputManager {
  private keys: Set<string> = new Set();
  private mouseDown = false;
  private touchActive = false;
  private throttle = 0;

  constructor() {
    this.setupKeyboardListeners();
    this.setupMouseListeners();
    this.setupTouchListeners();
  }

  private setupKeyboardListeners(): void {
    window.addEventListener('keydown', (e) => {
      this.keys.add(e.code);
      this.updateThrottle();
    });

    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.code);
      this.updateThrottle();
    });
  }

  private setupMouseListeners(): void {
    window.addEventListener('mousedown', () => {
      this.mouseDown = true;
      this.updateThrottle();
    });

    window.addEventListener('mouseup', () => {
      this.mouseDown = false;
      this.updateThrottle();
    });
  }

  private setupTouchListeners(): void {
    window.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.touchActive = true;
      this.updateThrottle();
    }, { passive: false });

    window.addEventListener('touchend', (e) => {
      e.preventDefault();
      this.touchActive = false;
      this.updateThrottle();
    }, { passive: false });
  }

  private updateThrottle(): void {
    const spacePressed = this.keys.has('Space');
    const wPressed = this.keys.has('KeyW');
    const arrowUpPressed = this.keys.has('ArrowUp');
    
    if (spacePressed || wPressed || arrowUpPressed || this.mouseDown || this.touchActive) {
      this.throttle = 1.0;
    } else {
      this.throttle = 0.0;
    }
  }

  getThrottle(): number {
    return this.throttle;
  }

  isAccelerating(): boolean {
    return this.throttle > 0;
  }

  destroy(): void {
    this.keys.clear();
  }
}
