import type { TractorPhysics } from '../core/Physics';

export class AIPlayer {
  private playerId: string;
  private physics: TractorPhysics;
  private throttle = 0;
  private targetSpeed = 0;
  private personality: 'aggressive' | 'balanced' | 'cautious';

  constructor(playerId: string, physics: TractorPhysics) {
    this.playerId = playerId;
    this.physics = physics;
    this.personality = this.randomPersonality();
    this.targetSpeed = this.calculateTargetSpeed();
  }

  private randomPersonality(): 'aggressive' | 'balanced' | 'cautious' {
    const rand = Math.random();
    if (rand < 0.3) return 'aggressive';
    if (rand < 0.7) return 'balanced';
    return 'cautious';
  }

  private calculateTargetSpeed(): number {
    switch (this.personality) {
      case 'aggressive':
        return 25 + Math.random() * 5;
      case 'balanced':
        return 20 + Math.random() * 5;
      case 'cautious':
        return 15 + Math.random() * 5;
    }
  }

  update(deltaTime: number): void {
    const currentSpeed = this.physics.getSpeedKPH();
    
    if (currentSpeed < this.targetSpeed) {
      this.throttle = 1.0;
    } else if (currentSpeed > this.targetSpeed * 1.1) {
      this.throttle = 0.5;
    } else {
      this.throttle = 0.8;
    }

    const wheelSlip = this.physics.getWheelSlip();
    if (wheelSlip > 0.3 && this.personality === 'cautious') {
      this.throttle *= 0.7;
    }

    this.throttle += (Math.random() - 0.5) * 0.1;
    this.throttle = Math.max(0, Math.min(1, this.throttle));
  }

  getThrottle(): number {
    return this.throttle;
  }
}
