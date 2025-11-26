// Tractor physics with torque curves, wheel slip, weather effects
// Based on empirical data from real tractor pulls + arcade tuning

export interface TractorPhysicsConfig {
  mass: number; // kg
  engine: {
    maxTorque: number; // Nm at peak RPM
    redline: number; // max RPM
    torqueCurve: [number, number][]; // [RPM, torque%] pairs
  };
  drivetrain: {
    gearRatios: number[];
    finalDrive: number;
    transmission: 'auto' | 'manual';
  };
  tires: {
    radius: number; // meters
    width: number; // meters
    grip: number; // coefficient (0-1, modified by weather)
  };
  aero: {
    dragCoefficient: number;
    frontalArea: number; // m²
  };
}

export interface WeatherCondition {
  type: 'clear' | 'rain' | 'mud';
  gripModifier: number; // multiplier for tire grip
  visibilityModifier: number;
}

export class TractorPhysics {
  private config: TractorPhysicsConfig;
  private state = {
    position: 0, // meters from start
    velocity: 0, // m/s
    rpm: 800, // idle RPM
    throttle: 0, // 0-1
    wheelSlip: 0, // 0-1 (1 = full spin)
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

  // Main physics step - call at 60Hz minimum
  update(deltaTime: number, inputThrottle: number): void {
    this.state.throttle = Math.max(0, Math.min(1, inputThrottle));
    
    // Auto transmission logic
    if (this.config.drivetrain.transmission === 'auto') {
      this.updateAutoTransmission();
    }
    
    // Calculate engine output
    const engineTorque = this.calculateEngineTorque();
    const wheelTorque = this.calculateWheelTorque(engineTorque);
    
    // Calculate tire forces with slip
    const { tractionForce, slipRatio } = this.calculateTireForces(wheelTorque);
    this.state.wheelSlip = slipRatio;
    
    // External forces
    const dragForce = this.calculateDrag();
    const rollingResistance = this.calculateRollingResistance();
    
    // Net force and acceleration
    const netForce = tractionForce - dragForce - rollingResistance;
    const acceleration = netForce / this.config.mass;
    
    // Integrate velocity and position (Euler method, sufficient for this)
    this.state.velocity += acceleration * deltaTime;
    this.state.velocity = Math.max(0, this.state.velocity); // No reverse
    this.state.position += this.state.velocity * deltaTime;
    
    // Update RPM based on wheel speed
    this.updateRPM();
  }

  private calculateEngineTorque(): number {
    // Interpolate torque curve based on current RPM
    const curve = this.config.engine.torqueCurve;
    const rpm = this.state.rpm;
    
    // Find surrounding points on curve
    let lowerPoint = curve[0];
    let upperPoint = curve[curve.length - 1];
    
    for (let i = 0; i < curve.length - 1; i++) {
      if (rpm >= curve[i][0] && rpm <= curve[i + 1][0]) {
        lowerPoint = curve[i];
        upperPoint = curve[i + 1];
        break;
      }
    }
    
    // Linear interpolation
    const t = (rpm - lowerPoint[0]) / (upperPoint[0] - lowerPoint[0]);
    const torquePercent = lowerPoint[1] + t * (upperPoint[1] - lowerPoint[1]);
    
    // Apply throttle and return absolute torque
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
    // Maximum traction force based on weight and grip
    const normalForce = this.config.mass * 9.81; // Weight force
    const baseGrip = this.config.tires.grip * this.weather.gripModifier;
    const maxTraction = normalForce * baseGrip;
    
    // Theoretical force from wheel torque
    const wheelRadius = this.config.tires.radius;
    const theoreticalForce = wheelTorque / wheelRadius;
    
    // Calculate slip ratio (Pacejka tire model simplified)
    const wheelSpeed = this.state.velocity; // Linear speed
    const theoreticalWheelSpeed = (wheelTorque / wheelRadius) / this.config.mass;
    
    let slipRatio = 0;
    if (wheelSpeed > 0.1) {
      slipRatio = Math.abs(theoreticalWheelSpeed - wheelSpeed) / wheelSpeed;
    } else {
      // Static friction at launch
      slipRatio = theoreticalForce / maxTraction;
    }
    
    slipRatio = Math.min(1, slipRatio);
    
    // Traction force with slip curve (peaks at ~10% slip, then drops)
    const peakSlip = 0.1;
    let tractionMultiplier: number;
    
    if (slipRatio < peakSlip) {
      tractionMultiplier = slipRatio / peakSlip;
    } else {
      // Exponential falloff after peak
      tractionMultiplier = Math.exp(-(slipRatio - peakSlip) * 3);
    }
    
    const actualTraction = Math.min(theoreticalForce, maxTraction * tractionMultiplier);
    
    return {
      tractionForce: actualTraction,
      slipRatio: slipRatio,
    };
  }

  private calculateDrag(): number {
    // Aerodynamic drag: F = 0.5 * ρ * v² * Cd * A
    const airDensity = 1.225; // kg/m³ at sea level
    const velocity = this.state.velocity;
    return 0.5 * airDensity * velocity * velocity * 
           this.config.aero.dragCoefficient * this.config.aero.frontalArea;
  }

  private calculateRollingResistance(): number {
    // Rolling resistance: F = Crr * N
    const rollingCoefficient = 0.015; // Typical for tractor tires on dirt
    const normalForce = this.config.mass * 9.81;
    return rollingCoefficient * normalForce;
  }

  private updateRPM(): void {
    // Calculate RPM from wheel speed
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

  // Public API
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

  // For replays/determinism
  serialize(): string {
    return JSON.stringify(this.state);
  }

  deserialize(data: string): void {
    this.state = JSON.parse(data);
  }
}

// Preset tractor configurations
export const TRACTOR_PRESETS: Record<string, TractorPhysicsConfig> = {
  'rookie-rust-bucket': {
    mass: 2500,
    engine: {
      maxTorque: 800,
      redline: 2200,
      torqueCurve: [
        [800, 0.6],   // idle
        [1200, 0.85], // low-end grunt
        [1600, 1.0],  // peak torque
        [2000, 0.9],
        [2200, 0.75], // redline falloff
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
      dragCoefficient: 0.9, // Brick-like
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
