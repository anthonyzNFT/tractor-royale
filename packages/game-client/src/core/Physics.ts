export interface TractorPhysicsConfig {
  mass: number;
  engine: {
    maxTorque: number;
    redline: number;
    torqueCurve: [number, number][];
  };
  drivetrain: {
    gearRatios: number[];
    finalDrive: number;
    transmission: 'auto' | 'manual';
  };
  tires: {
    radius: number;
    width: number;
    grip: number;
  };
  aero: {
    dragCoefficient: number;
    frontalArea: number;
  };
}

export interface WeatherCondition {
  type: 'clear' | 'rain' | 'mud';
  gripModifier: number;
  visibilityModifier: number;
}

export class TractorPhysics {
  private config: TractorPhysicsConfig;
  private state = {
    position: 0,
    velocity: 0,
    rpm: 800,
    throttle: 0,
    wheelSlip: 0,
    currentGear: 1,
  };
  
  private weather: WeatherCondition = {
    type: 'clear',
    gripModifier: 1.0,
    visibilityModifier: 1.0,
  };

  constructor(config: TractorPhysicsConfig) {
    this.config = config;
  }

  update(deltaTime: number, inputThrottle: number): void {
    this.state.throttle = Math.max(0, Math.min(1, inputThrottle));
    
    if (this.config.drivetrain.transmission === 'auto') {
      this.updateAutoTransmission();
    }
    
    const engineTorque = this.calculateEngineTorque();
    const wheelTorque = this.calculateWheelTorque(engineTorque);
    
    const { tractionForce, slipRatio } = this.calculateTireForces(wheelTorque);
    this.state.wheelSlip = slipRatio;
    
    const dragForce = this.calculateDrag();
    const rollingResistance = this.calculateRollingResistance();
    
    const netForce = tractionForce - dragForce - rollingResistance;
    const acceleration = netForce / this.config.mass;
    
    this.state.velocity += acceleration * deltaTime;
    this.state.velocity = Math.max(0, this.state.velocity);
    this.state.position += this.state.velocity * deltaTime;
    
    this.updateRPM();
  }

  private calculateEngineTorque(): number {
    const curve = this.config.engine.torqueCurve;
    const rpm = this.state.rpm;
    
    let lowerPoint = curve[0];
    let upperPoint = curve[curve.length - 1];
    
    for (let i = 0; i < curve.length - 1; i++) {
      if (rpm >= curve[i][0] && rpm <= curve[i + 1][0]) {
        lowerPoint = curve[i];
        upperPoint = curve[i + 1];
        break;
      }
    }
    
    const t = (rpm - lowerPoint[0]) / (upperPoint[0] - lowerPoint[0]);
    const torquePercent = lowerPoint[1] + t * (upperPoint[1] - lowerPoint[1]);
    
    return this.config.engine.maxTorque * torquePercent * this.state.throttle;
  }

  private calculateWheelTorque(engineTorque: number): number {
    const gearRatio = this.config.drivetrain.gearRatios[this.state.currentGear - 1];
    const finalDrive = this.config.drivetrain.finalDrive;
    return engineTorque * gearRatio * finalDrive;
  }

  private calculateTireForces(wheelTorque: number): {
    tractionForce: number;
    slipRatio: number;
  } {
    const normalForce = this.config.mass * 9.81;
    const baseGrip = this.config.tires.grip * this.weather.gripModifier;
    const maxTraction = normalForce * baseGrip;
    
    const wheelRadius = this.config.tires.radius;
    const theoreticalForce = wheelTorque / wheelRadius;
    
    const wheelSpeed = this.state.velocity;
    const theoreticalWheelSpeed = (wheelTorque / wheelRadius) / this.config.mass;
    
    let slipRatio = 0;
    if (wheelSpeed > 0.1) {
      slipRatio = Math.abs(theoreticalWheelSpeed - wheelSpeed) / wheelSpeed;
    } else {
      slipRatio = theoreticalForce / maxTraction;
    }
    
    slipRatio = Math.min(1, slipRatio);
    
    const peakSlip = 0.1;
    let tractionMultiplier: number;
    
    if (slipRatio < peakSlip) {
      tractionMultiplier = slipRatio / peakSlip;
    } else {
      tractionMultiplier = Math.exp(-(slipRatio - peakSlip) * 3);
    }
    
    const actualTraction = Math.min(theoreticalForce, maxTraction * tractionMultiplier);
    
    return {
      tractionForce: actualTraction,
      slipRatio: slipRatio,
    };
  }

  private calculateDrag(): number {
    const airDensity = 1.225;
    const velocity = this.state.velocity;
    return 0.5 * airDensity * velocity * velocity * 
           this.config.aero.dragCoefficient * this.config.aero.frontalArea;
  }

  private calculateRollingResistance(): number {
    const rollingCoefficient = 0.015;
    const normalForce = this.config.mass * 9.81;
    return rollingCoefficient * normalForce;
  }

  private updateRPM(): void {
    const wheelAngularVelocity = this.state.velocity / this.config.tires.radius;
    const gearRatio = this.config.drivetrain.gearRatios[this.state.currentGear - 1];
    const finalDrive = this.config.drivetrain.finalDrive;
    
    this.state.rpm = (wheelAngularVelocity * gearRatio * finalDrive * 60) / (2 * Math.PI);
    this.state.rpm = Math.max(800, Math.min(this.config.engine.redline, this.state.rpm));
  }

  private updateAutoTransmission(): void {
    const gearCount = this.config.drivetrain.gearRatios.length;
    const upshiftRPM = this.config.engine.redline * 0.85;
    const downshiftRPM = this.config.engine.redline * 0.4;
    
    if (this.state.rpm > upshiftRPM && this.state.currentGear < gearCount) {
      this.state.currentGear++;
    } else if (this.state.rpm < downshiftRPM && this.state.currentGear > 1) {
      this.state.currentGear--;
    }
  }

  setWeather(weather: WeatherCondition): void {
    this.weather = weather;
  }

  getState() {
    return { ...this.state };
  }

  getPosition(): number {
    return this.state.position;
  }

  getVelocity(): number {
    return this.state.velocity;
  }

  getSpeedKPH(): number {
    return this.state.velocity * 3.6;
  }

  getRPM(): number {
    return this.state.rpm;
  }

  getWheelSlip(): number {
    return this.state.wheelSlip;
  }

  serialize(): string {
    return JSON.stringify(this.state);
  }

  deserialize(data: string): void {
    this.state = JSON.parse(data);
  }
}

export const TRACTOR_PRESETS: Record<string, TractorPhysicsConfig> = {
  'rookie-rust-bucket': {
    mass: 2500,
    engine: {
      maxTorque: 800,
      redline: 2200,
      torqueCurve: [
        [800, 0.6],
        [1200, 0.85],
        [1600, 1.0],
        [2000, 0.9],
        [2200, 0.75],
      ],
    },
    drivetrain: {
      gearRatios: [12.0, 8.0, 5.5],
      finalDrive: 4.0,
      transmission: 'auto',
    },
    tires: {
      radius: 0.85,
      width: 0.45,
      grip: 0.7,
    },
    aero: {
      dragCoefficient: 0.9,
      frontalArea: 6.5,
    },
  },
  
  'midnight-thunder': {
    mass: 3200,
    engine: {
      maxTorque: 1800,
      redline: 3000,
      torqueCurve: [
        [800, 0.5],
        [1500, 0.95],
        [2000, 1.0],
        [2500, 0.98],
        [3000, 0.85],
      ],
    },
    drivetrain: {
      gearRatios: [15.0, 10.0, 7.0, 5.0],
      finalDrive: 3.5,
      transmission: 'auto',
    },
    tires: {
      radius: 0.95,
      width: 0.60,
      grip: 0.85,
    },
    aero: {
      dragCoefficient: 0.75,
      frontalArea: 7.2,
    },
  },
};
