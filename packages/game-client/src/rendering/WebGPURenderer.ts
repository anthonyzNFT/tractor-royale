import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

export class WebGPURenderer {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private tractors: Map<string, THREE.Group> = new Map();
  private loader: GLTFLoader;
  private canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
    });
    
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87CEEB);
    this.scene.fog = new THREE.Fog(0x87CEEB, 50, 200);
    
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 15, 30);
    this.camera.lookAt(0, 0, 0);
    
    this.loader = new GLTFLoader();
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('/draco/');
    this.loader.setDRACOLoader(dracoLoader);
    
    this.setupLighting();
    this.setupTrack();
    this.setupEventListeners();
  }

  private setupLighting(): void {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 50, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.left = -50;
    directionalLight.shadow.camera.right = 50;
    directionalLight.shadow.camera.top = 50;
    directionalLight.shadow.camera.bottom = -50;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    this.scene.add(directionalLight);
    
    const hemisphereLight = new THREE.HemisphereLight(0x87CEEB, 0x8B4513, 0.5);
    this.scene.add(hemisphereLight);
  }

  private setupTrack(): void {
    const trackGeometry = new THREE.PlaneGeometry(200, 50);
    const trackMaterial = new THREE.MeshStandardMaterial({
      color: 0x8B4513,
      roughness: 0.9,
      metalness: 0.1,
    });
    const track = new THREE.Mesh(trackGeometry, trackMaterial);
    track.rotation.x = -Math.PI / 2;
    track.receiveShadow = true;
    this.scene.add(track);
    
    const laneCount = 8;
    const laneWidth = 50 / laneCount;
    
    for (let i = 1; i < laneCount; i++) {
      const lineGeometry = new THREE.BoxGeometry(200, 0.1, 0.2);
      const lineMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
      const line = new THREE.Mesh(lineGeometry, lineMaterial);
      line.position.set(0, 0.05, -25 + i * laneWidth);
      this.scene.add(line);
    }
    
    const startLineGeometry = new THREE.BoxGeometry(0.5, 0.2, 50);
    const startLineMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
    const startLine = new THREE.Mesh(startLineGeometry, startLineMaterial);
    startLine.position.set(-95, 0.1, 0);
    this.scene.add(startLine);
    
    const finishLineGeometry = new THREE.BoxGeometry(0.5, 0.2, 50);
    const finishLineMaterial = new THREE.MeshBasicMaterial({
      color: 0x000000,
    });
    const finishLine = new THREE.Mesh(finishLineGeometry, finishLineMaterial);
    finishLine.position.set(95, 0.1, 0);
    this.scene.add(finishLine);
    
    const checkerCount = 10;
    for (let i = 0; i < checkerCount; i++) {
      const checkerGeometry = new THREE.BoxGeometry(0.5, 0.2, 50 / checkerCount);
      const checkerMaterial = new THREE.MeshBasicMaterial({
        color: i % 2 === 0 ? 0xFFFFFF : 0x000000,
      });
      const checker = new THREE.Mesh(checkerGeometry, checkerMaterial);
      checker.position.set(95, 0.15, -25 + i * (50 / checkerCount) + (50 / checkerCount) / 2);
      this.scene.add(checker);
    }
  }

  private setupEventListeners(): void {
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  createTractor(playerId: string, config: any): void {
    const tractorGroup = new THREE.Group();
    tractorGroup.name = playerId;
    
    const bodyGeometry = new THREE.BoxGeometry(4, 2, 2);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: config.paintColor || 0x8B4513,
      roughness: 0.7,
      metalness: 0.3,
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.castShadow = true;
    body.receiveShadow = true;
    tractorGroup.add(body);
    
    const cabGeometry = new THREE.BoxGeometry(2, 2.5, 1.8);
    const cabMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.6,
      metalness: 0.4,
    });
    const cab = new THREE.Mesh(cabGeometry, cabMaterial);
    cab.position.set(-1, 1.5, 0);
    cab.castShadow = true;
    tractorGroup.add(cab);
    
    const wheelPositions = [
      { x: 1.5, y: -0.5, z: 1.2 },
      { x: 1.5, y: -0.5, z: -1.2 },
      { x: -1.5, y: -0.5, z: 1.2 },
      { x: -1.5, y: -0.5, z: -1.2 },
    ];
    
    wheelPositions.forEach((pos, index) => {
      const wheelGeometry = new THREE.CylinderGeometry(0.8, 0.8, 0.5, 16);
      const wheelMaterial = new THREE.MeshStandardMaterial({
        color: 0x1a1a1a,
        roughness: 0.9,
      });
      const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(pos.x, pos.y, pos.z);
      wheel.castShadow = true;
      wheel.name = `wheel_${index}`;
      tractorGroup.add(wheel);
    });
    
    const exhaustGeometry = new THREE.CylinderGeometry(0.2, 0.2, 2, 8);
    const exhaustMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.8,
      metalness: 0.6,
    });
    const exhaust = new THREE.Mesh(exhaustGeometry, exhaustMaterial);
    exhaust.position.set(-2, 2, 0.5);
    exhaust.rotation.x = Math.PI / 8;
    tractorGroup.add(exhaust);
    
    tractorGroup.position.set(-90, 1, 0);
    
    this.scene.add(tractorGroup);
    this.tractors.set(playerId, tractorGroup);
  }

  updateTractor(playerId: string, position: number, wheelRotation: number): void {
    const tractor = this.tractors.get(playerId);
    if (!tractor) return;
    
    const startX = -90;
    const endX = 90;
    const trackLength = 100;
    const tractorX = startX + (position / trackLength) * (endX - startX);
    
    tractor.position.x = tractorX;
    
    tractor.children.forEach((child) => {
      if (child.name.startsWith('wheel_')) {
        child.rotation.y += wheelRotation * 5;
      }
    });
    
    this.updateCamera(tractorX);
  }

  private updateCamera(focusX: number): void {
    const targetX = focusX;
    const cameraX = THREE.MathUtils.lerp(this.camera.position.x, targetX, 0.05);
    
    this.camera.position.x = cameraX;
    this.camera.lookAt(targetX, 0, 0);
  }

  removeTractor(playerId: string): void {
    const tractor = this.tractors.get(playerId);
    if (tractor) {
      this.scene.remove(tractor);
      this.tractors.delete(playerId);
    }
  }

  render(deltaTime: number): void {
    this.renderer.render(this.scene, this.camera);
  }

  destroy(): void {
    this.renderer.dispose();
    this.tractors.clear();
  }
}
