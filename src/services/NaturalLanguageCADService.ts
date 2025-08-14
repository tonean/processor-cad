import * as THREE from 'three';
import * as CANNON from 'cannon-es';

// CAD Specification Schema
export interface CADSpecification {
  intent: 'create' | 'modify' | 'action';
  objects: CADObject[];
  actions: CADAction[];
  warnings: string[];
  explain: string;
  next_steps_suggestion: string[];
}

export interface CADObject {
  id: string;
  type: 'sphere' | 'box' | 'cylinder' | 'mesh';
  name: string;
  diameter_m?: number;
  radius_m?: number;
  width_m?: number;
  height_m?: number;
  depth_m?: number;
  density_kg_m3: number;
  mass_kg: number;
  material: string;
  position?: { x: number; y: number; z: number };
  meta: {
    createdAt: string;
    assumptions: string[];
    extraction_source?: string;
    confidence: number;
  };
}

export interface CADAction {
  type: 'set_restitution' | 'apply_impulse' | 'set_friction' | 'apply_force' | 'spawn' | 'remove';
  target: string;
  value?: number;
  impulse_Ns?: number;
  direction?: number[];
  force_N?: number;
}

export interface PhysicsWorld {
  world: CANNON.World;
  bodies: Map<string, CANNON.Body>;
  meshes: Map<string, THREE.Mesh>;
  scene: THREE.Scene;
  camera: THREE.Camera;
  renderer: THREE.WebGLRenderer;
  animationId?: number;
}

export class NaturalLanguageCADService {
  private physicsWorld: PhysicsWorld | null = null;
  private currentSpec: CADSpecification | null = null;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private world: CANNON.World;
  private bodies: Map<string, CANNON.Body> = new Map();
  private meshes: Map<string, THREE.Mesh> = new Map();
  private clock: THREE.Clock;
  private animationId: number | null = null;

  constructor() {
    // Initialize Three.js
    this.scene = new THREE.Scene();
    // No background - transparent so we see the dots
    this.scene.background = null;
    
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.01,
      1000
    );
    this.camera.position.set(0.3, 0.5, 1);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(0x000000, 0); // Fully transparent
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Initialize Cannon-ES physics
    this.world = new CANNON.World();
    this.world.gravity.set(0, -9.82, 0);
    this.world.broadphase = new CANNON.NaiveBroadphase();
    this.world.solver.iterations = 10;

    // Add invisible ground plane for physics only (no visual)
    const groundShape = new CANNON.Plane();
    const groundBody = new CANNON.Body({
      mass: 0,
      shape: groundShape,
      position: new CANNON.Vec3(0, -0.5, 0)
    });
    groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
    this.world.addBody(groundBody);

    // No ground mesh - keep canvas transparent

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.near = 0.1;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -5;
    directionalLight.shadow.camera.right = 5;
    directionalLight.shadow.camera.top = 5;
    directionalLight.shadow.camera.bottom = -5;
    this.scene.add(directionalLight);

    this.clock = new THREE.Clock();
  }

  /**
   * Parse natural language input and generate CAD specification
   */
  public parseNaturalLanguage(input: string): CADSpecification {
    const lowerInput = input.toLowerCase();
    const timestamp = new Date().toISOString();
    
    // Detect intent
    let intent: 'create' | 'modify' | 'action' = 'create';
    if (lowerInput.includes('bounce') || lowerInput.includes('bouncy') || 
        lowerInput.includes('jump') || lowerInput.includes('hop')) {
      intent = 'action';
    } else if (lowerInput.includes('change') || lowerInput.includes('modify') || 
               lowerInput.includes('update') || lowerInput.includes('edit')) {
      intent = 'modify';
    }

    // Parse object creation - much more flexible matching
    const ballPatterns = [
      'ball', 'sphere', 'orb', 'globe'
    ];
    const createPatterns = [
      'make', 'create', 'generate', 'build', 'give', 'show', 'add', 'spawn', 'can you'
    ];
    
    const hasBallWord = ballPatterns.some(pattern => lowerInput.includes(pattern));
    const hasCreateWord = createPatterns.some(pattern => lowerInput.includes(pattern));
    
    if (hasBallWord && (hasCreateWord || lowerInput.includes('me a') || lowerInput.includes('me the'))) {
      
      // Extract size if specified
      const sizeMatch = lowerInput.match(/(\d+(?:\.\d+)?)\s*(mm|cm|m|in)?/);
      let diameter_m = 0.12; // Default 12cm
      const assumptions: string[] = [];

      if (sizeMatch) {
        const value = parseFloat(sizeMatch[1]);
        const unit = sizeMatch[2] || 'cm';
        
        switch(unit) {
          case 'mm':
            diameter_m = value / 1000;
            break;
          case 'cm':
            diameter_m = value / 100;
            break;
          case 'm':
            diameter_m = value;
            break;
          case 'in':
            diameter_m = value * 0.0254;
            break;
          default:
            diameter_m = value / 100; // Assume cm
            assumptions.push(`Assumed ${value} cm for diameter`);
        }
      } else {
        assumptions.push('Diameter defaulted to 12cm');
      }

      const radius_m = diameter_m / 2;
      const density_kg_m3 = 1200; // Default density
      assumptions.push('Density defaulted to 1200 kg/m³');
      
      // Calculate volume and mass
      const volume_m3 = (4/3) * Math.PI * Math.pow(radius_m, 3);
      const mass_kg = density_kg_m3 * volume_m3;

      const spec: CADSpecification = {
        intent: 'create',
        objects: [{
          id: 'o1',
          type: 'sphere',
          name: 'ball',
          diameter_m,
          radius_m,
          density_kg_m3,
          mass_kg,
          material: 'default',
          position: { x: 0, y: 0.2, z: 0 }, // Start slightly above ground
          meta: {
            createdAt: timestamp,
            assumptions,
            confidence: 0.95
          }
        }],
        actions: [],
        warnings: [],
        explain: `Create a sphere (diameter ${diameter_m.toFixed(2)} m) with default density`,
        next_steps_suggestion: ['make it bounce', 'change size', 'add another ball']
      };

      this.currentSpec = spec;
      return spec;
    }

    // Parse bounce action - more flexible matching
    const bouncePatterns = [
      'bounce', 'bouncy', 'jump', 'hop', 'bouncing'
    ];
    const hasBounceWord = bouncePatterns.some(pattern => lowerInput.includes(pattern));
    
    if (hasBounceWord && (lowerInput.includes('make') || lowerInput.includes('it') || 
                          lowerInput.includes('ball') || lowerInput.includes('them'))) {
      
      // Check if we have an existing ball
      let objects: CADObject[] = [];
      if (!this.currentSpec || this.currentSpec.objects.length === 0) {
        // Create a default ball first
        const radius_m = 0.06;
        const diameter_m = 0.12;
        const density_kg_m3 = 1200;
        const volume_m3 = (4/3) * Math.PI * Math.pow(radius_m, 3);
        const mass_kg = density_kg_m3 * volume_m3;
        
        objects = [{
          id: 'o1',
          type: 'sphere',
          name: 'ball',
          diameter_m,
          radius_m,
          density_kg_m3,
          mass_kg,
          material: 'default',
          position: { x: 0, y: 0.2, z: 0 },
          meta: {
            createdAt: timestamp,
            assumptions: ['Created default ball', 'Diameter 12cm', 'Density 1200 kg/m³'],
            confidence: 0.95
          }
        }];
      } else {
        // Use existing objects - DON'T clear them!
        objects = this.currentSpec.objects;
      }

      // Calculate impulse for visible bounce
      const targetObject = objects[0];
      const desired_delta_v = 5.0; // m/s for visible bounce
      const impulse_Ns = targetObject.mass_kg * desired_delta_v;

      const spec: CADSpecification = {
        intent: 'action',
        objects,
        actions: [
          {
            type: 'set_restitution',
            target: targetObject.id,
            value: 0.85 // High bounciness
          },
          {
            type: 'apply_impulse',
            target: targetObject.id,
            impulse_Ns,
            direction: [0, 1, 0] // Upward
          }
        ],
        warnings: [],
        explain: `Apply bouncing behavior to sphere with restitution 0.85 and initial impulse ${impulse_Ns.toFixed(2)} N·s`,
        next_steps_suggestion: ['make it less bouncy', 'add another ball', 'change color']
      };

      this.currentSpec = spec;
      return spec;
    }

    // Default response for unrecognized input
    return {
      intent: 'create',
      objects: [],
      actions: [],
      warnings: ['Could not parse input. Try "make me a ball" or "make the ball bounce"'],
      explain: 'Unable to interpret the request',
      next_steps_suggestion: ['make me a ball', 'create a 10cm sphere']
    };
  }

  /**
   * Execute the CAD specification and create/update the 3D scene
   */
  public async executeSpecification(spec: CADSpecification, container?: HTMLElement): Promise<THREE.Scene> {
    // Only clear scene if explicitly creating NEW objects, not when adding actions
    if (spec.intent === 'create' && spec.objects.length > 0) {
      // Check if objects are different from current ones
      const hasNewObjects = spec.objects.some(obj => !this.meshes.has(obj.id));
      if (hasNewObjects) {
        this.clearScene();
      }
    }

    // Create objects
    for (const obj of spec.objects) {
      if (!this.meshes.has(obj.id)) {
        await this.createObject(obj);
      }
    }

    // Execute actions
    for (const action of spec.actions) {
      await this.executeAction(action);
    }

    // Start animation loop if not already running
    if (!this.animationId) {
      this.startAnimation();
    }

    // Attach renderer to container if provided
    if (container && !container.contains(this.renderer.domElement)) {
      container.appendChild(this.renderer.domElement);
      
      // Handle resize
      const handleResize = () => {
        const width = container.clientWidth;
        const height = container.clientHeight;
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
      };
      
      window.addEventListener('resize', handleResize);
      handleResize();
    }

    return this.scene;
  }

  /**
   * Create a 3D object from specification
   */
  private async createObject(obj: CADObject): Promise<void> {
    let geometry: THREE.BufferGeometry;
    let shape: CANNON.Shape;

    switch (obj.type) {
      case 'sphere':
        const radius = obj.radius_m || 0.06;
        geometry = new THREE.SphereGeometry(radius, 32, 32);
        shape = new CANNON.Sphere(radius);
        break;
      
      case 'box':
        const width = obj.width_m || 0.1;
        const height = obj.height_m || 0.1;
        const depth = obj.depth_m || 0.1;
        geometry = new THREE.BoxGeometry(width, height, depth);
        shape = new CANNON.Box(new CANNON.Vec3(width/2, height/2, depth/2));
        break;
      
      case 'cylinder':
        const cylRadius = obj.radius_m || 0.05;
        const cylHeight = obj.height_m || 0.1;
        geometry = new THREE.CylinderGeometry(cylRadius, cylRadius, cylHeight, 32);
        // Cannon-ES doesn't have native cylinder, use box approximation
        shape = new CANNON.Box(new CANNON.Vec3(cylRadius, cylHeight/2, cylRadius));
        break;
      
      default:
        // Default to sphere
        geometry = new THREE.SphereGeometry(0.06, 32, 32);
        shape = new CANNON.Sphere(0.06);
    }

    // Create Three.js mesh with better material
    const material = new THREE.MeshPhysicalMaterial({
      color: 0x3b82f6,
      metalness: 0.3,
      roughness: 0.2,
      clearcoat: 0.5,
      clearcoatRoughness: 0.2,
      envMapIntensity: 0.5,
      emissive: 0x111122,
      emissiveIntensity: 0.1
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    
    // Set position
    const pos = obj.position || { x: 0, y: 0.2, z: 0 };
    mesh.position.set(pos.x, pos.y, pos.z);
    
    this.scene.add(mesh);
    this.meshes.set(obj.id, mesh);

    // Create physics body
    const body = new CANNON.Body({
      mass: obj.mass_kg,
      shape: shape,
      position: new CANNON.Vec3(pos.x, pos.y, pos.z)
    });
    
    this.world.addBody(body);
    this.bodies.set(obj.id, body);
  }

  /**
   * Execute an action on an object
   */
  private async executeAction(action: CADAction): Promise<void> {
    const body = this.bodies.get(action.target);
    if (!body) {
      console.warn(`Target object ${action.target} not found`);
      return;
    }

    switch (action.type) {
      case 'set_restitution':
        // Create contact material for bounciness
        const material = new CANNON.Material('bouncy');
        const contactMaterial = new CANNON.ContactMaterial(
          material,
          material,
          {
            restitution: action.value || 0.8,
            friction: 0.4
          }
        );
        this.world.addContactMaterial(contactMaterial);
        body.material = material;
        break;
      
      case 'apply_impulse':
        if (action.impulse_Ns && action.direction) {
          const impulse = new CANNON.Vec3(
            action.direction[0] * action.impulse_Ns,
            action.direction[1] * action.impulse_Ns,
            action.direction[2] * action.impulse_Ns
          );
          body.applyImpulse(impulse, body.position);
        }
        break;
      
      case 'set_friction':
        // Update friction through material
        const frictionMaterial = new CANNON.Material('friction');
        body.material = frictionMaterial;
        break;
      
      case 'apply_force':
        if (action.force_N && action.direction) {
          const force = new CANNON.Vec3(
            action.direction[0] * action.force_N,
            action.direction[1] * action.force_N,
            action.direction[2] * action.force_N
          );
          body.applyForce(force, body.position);
        }
        break;
    }
  }

  /**
   * Start the animation/physics loop
   */
  private startAnimation(): void {
    const animate = () => {
      this.animationId = requestAnimationFrame(animate);
      
      // Update physics
      const deltaTime = this.clock.getDelta();
      this.world.step(deltaTime);
      
      // Sync Three.js meshes with physics bodies
      this.bodies.forEach((body, id) => {
        const mesh = this.meshes.get(id);
        if (mesh) {
          mesh.position.copy(body.position as any);
          mesh.quaternion.copy(body.quaternion as any);
        }
      });
      
      // Render
      this.renderer.render(this.scene, this.camera);
    };
    
    animate();
  }

  /**
   * Stop the animation loop
   */
  public stopAnimation(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  /**
   * Clear the scene
   */
  private clearScene(): void {
    // Remove meshes from scene
    this.meshes.forEach(mesh => {
      this.scene.remove(mesh);
      if (mesh.geometry) mesh.geometry.dispose();
      if (mesh.material) {
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach(m => m.dispose());
        } else {
          mesh.material.dispose();
        }
      }
    });
    this.meshes.clear();

    // Remove bodies from world
    this.bodies.forEach(body => {
      this.world.removeBody(body);
    });
    this.bodies.clear();
  }

  /**
   * Get the current specification
   */
  public getCurrentSpec(): CADSpecification | null {
    return this.currentSpec;
  }

  /**
   * Get the Three.js scene
   */
  public getScene(): THREE.Scene {
    return this.scene;
  }

  /**
   * Get the Three.js renderer
   */
  public getRenderer(): THREE.WebGLRenderer {
    return this.renderer;
  }

  /**
   * Get the Three.js camera
   */
  public getCamera(): THREE.Camera {
    return this.camera;
  }

  /**
   * Dispose of all resources
   */
  public dispose(): void {
    this.stopAnimation();
    this.clearScene();
    this.renderer.dispose();
  }
}
