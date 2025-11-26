import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export interface TractorPart {
  id: string;
  category: 'body' | 'cab' | 'wheels' | 'exhaust' | 'hat' | 'cow_catcher' | 'decal';
  model: string; // URL to glTF file
  socketName?: string; // Attachment point on parent part
  scale?: THREE.Vector3;
  rotation?: THREE.Euler;
  materials?: Record<string, THREE.MeshStandardMaterialParameters>;
}

export interface TractorBlueprint {
  body: string;
  cab: string;
  wheels: string;
  exhaust?: string;
  hat?: string;
  cowCatcher?: string;
  decals?: string[];
  paintColor?: THREE.Color;
  paintMetalness?: number;
  paintRoughness?: number;
}

export class PartCombiner {
  private loader: GLTFLoader;
  private partCache: Map<string, THREE.Object3D> = new Map();
  private partCatalog: Map<string, TractorPart>;

  constructor(partCatalog: TractorPart[]) {
    this.partCatalog = new Map(partCatalog.map(p => [p.id, p]));
    
    this.loader = new GLTFLoader();
    
    // Setup Draco decoder for compressed models
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('/draco/');
    this.loader.setDRACOLoader(dracoLoader);
  }

  async buildTractor(blueprint: TractorBlueprint): Promise<THREE.Group> {
    const tractorRoot = new THREE.Group();
    tractorRoot.name = 'Tractor';

    // Load parts in parallel
    const parts = await Promise.all([
      this.loadPart(blueprint.body),
      this.loadPart(blueprint.cab),
      this.loadPart(blueprint.wheels),
      blueprint.exhaust ? this.loadPart(blueprint.exhaust) : null,
      blueprint.hat ? this.loadPart(blueprint.hat) : null,
      blueprint.cowCatcher ? this.loadPart(blueprint.cowCatcher) : null,
      ...(blueprint.decals?.map(d => this.loadPart(d)) || []),
    ]);

    const [body, cab, wheels, exhaust, hat, cowCatcher, ...decals] = parts.filter(Boolean) as THREE.Object3D[];

    // Build hierarchy: body is root, everything attaches to sockets
    const bodyPart = body.clone();
    tractorRoot.add(bodyPart);

    // Attach cab to body's "cab_socket"
    const cabSocket = bodyPart.getObjectByName('cab_socket');
    if (cabSocket && cab) {
      const cabClone = cab.clone();
      cabSocket.add(cabClone);
    }

    // Attach wheels to wheel sockets (typically 4)
    const wheelSockets = ['wheel_fl', 'wheel_fr', 'wheel_rl', 'wheel_rr'];
    for (const socketName of wheelSockets) {
      const socket = bodyPart.getObjectByName(socketName);
      if (socket && wheels) {
        const wheelClone = wheels.clone();
        socket.add(wheelClone);
      }
    }

    // Exhaust
    if (exhaust) {
      const exhaustSocket = bodyPart.getObjectByName('exhaust_socket') || cabSocket;
      if (exhaustSocket) {
        const exhaustClone = exhaust.clone();
        exhaustSocket.add(exhaustClone);
      }
    }

    // Hat (attaches to cab)
    if (hat && cabSocket) {
      const hatSocket = cabSocket.getObjectByName('hat_socket');
      if (hatSocket) {
        const hatClone = hat.clone();
        hatSocket.add(hatClone);
      }
    }

    // Cow catcher (front of body)
    if (cowCatcher) {
      const cowCatcherSocket = bodyPart.getObjectByName('front_socket');
      if (cowCatcherSocket) {
        const cowCatcherClone = cowCatcher.clone();
        cowCatcherSocket.add(cowCatcherClone);
      }
    }

    // Decals (apply as texture overlay or separate mesh)
    for (const decal of decals) {
      if (decal) {
        const decalClone = decal.clone();
        bodyPart.add(decalClone); // Positioned relative to body
      }
    }

    // Apply custom paint
    if (blueprint.paintColor) {
      this.applyPaint(tractorRoot, blueprint.paintColor, blueprint.paintMetalness, blueprint.paintRoughness);
    }

    // Center and scale
    const box = new THREE.Box3().setFromObject(tractorRoot);
    const center = box.getCenter(new THREE.Vector3());
    tractorRoot.position.sub(center);

    return tractorRoot;
  }

  private async loadPart(partId: string): Promise<THREE.Object3D> {
    // Check cache first
    if (this.partCache.has(partId)) {
      return this.partCache.get(partId)!;
    }

    const partData = this.partCatalog.get(partId);
    if (!partData) {
      throw new Error(`Part ${partId} not found in catalog`);
    }

    // Load glTF
    const gltf = await this.loader.loadAsync(partData.model);
    const partObject = gltf.scene;

    // Apply transforms
    if (partData.scale) {
      partObject.scale.copy(partData.scale);
    }
    if (partData.rotation) {
      partObject.rotation.copy(partData.rotation);
    }

    // Apply custom materials if specified
    if (partData.materials) {
      partObject.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material.name in partData.materials!) {
          const matParams = partData.materials![child.material.name];
          child.material = new THREE.MeshStandardMaterial(matParams);
        }
      });
    }

    this.partCache.set(partId, partObject);
    return partObject;
  }

  private applyPaint(
    tractor: THREE.Group,
    color: THREE.Color,
    metalness = 0.3,
    roughness = 0.7
  ): void {
    tractor.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        // Only paint meshes tagged as "paintable"
        if (child.userData.paintable !== false) {
          if (child.material instanceof THREE.MeshStandardMaterial) {
            child.material = child.material.clone();
            child.material.color.copy(color);
            child.material.metalness = metalness;
            child.material.roughness = roughness;
          }
        }
      }
    });
  }

  // Optimize: merge static geometries for draw call reduction
  optimizeTractor(tractor: THREE.Group): THREE.Group {
    const geometries: THREE.BufferGeometry[] = [];
    const materials: THREE.Material[] = [];

    tractor.traverse((child) => {
      if (child instanceof THREE.Mesh && child.userData.static) {
        // Clone geometry with world transform applied
        const geo = child.geometry.clone();
        geo.applyMatrix4(child.matrixWorld);
        geometries.push(geo);
        materials.push(child.material as THREE.Material);
      }
    });

    if (geometries.length === 0) return tractor;

    // Merge geometries (requires same material)
    const mergedGeometry = mergeGeometries(geometries, true);
    const optimizedMesh = new THREE.Mesh(mergedGeometry, materials[0]);
    
    const optimizedGroup = new THREE.Group();
    optimizedGroup.add(optimizedMesh);

    // Add animated parts separately (wheels, exhaust smoke)
    tractor.traverse((child) => {
      if (child.userData.animated) {
        optimizedGroup.add(child.clone());
      }
    });

    return optimizedGroup;
  }

  clearCache(): void {
    this.partCache.clear();
  }
}

// Example part catalog
export const DEFAULT_PARTS: TractorPart[] = [
  {
    id: 'body_rust_bucket',
    category: 'body',
    model: '/assets/models/body_rust_bucket.glb',
  },
  {
    id: 'cab_classic',
    category: 'cab',
    model: '/assets/models/cab_classic.glb',
    socketName: 'cab_socket',
  },
  {
    id: 'wheels_tractor_standard',
    category: 'wheels',
    model: '/assets/models/wheel_standard.glb',
  },
  {
    id: 'exhaust_dual_stack',
    category: 'exhaust',
    model: '/assets/models/exhaust_dual.glb',
    socketName: 'exhaust_socket',
  },
  // ... 996 more parts
];
