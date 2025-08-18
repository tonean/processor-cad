import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { AICADInterpreter, AICADCommand } from './AICADInterpreter';

export interface CADObject3D {
  id: string;
  name: string;
  mesh: THREE.Mesh;
  body: CANNON.Body;
  isDraggable: boolean;
  isDragging: boolean;
  dragOffset: THREE.Vector3;
  animations: Map<string, () => void>; // Active animations
  properties: Map<string, any>; // Custom properties
}

export class AICADEngine {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private world: CANNON.World;
  private objects: Map<string, CADObject3D> = new Map();
  private aiInterpreter: AICADInterpreter;
  private animationId: number | null = null;
  private clock: THREE.Clock;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private isDragging: boolean = false;
  private dragObject: CADObject3D | null = null;
  private dragPlane: THREE.Plane;
  private dragIntersection: THREE.Vector3;
  
  constructor(apiKey: string, container?: HTMLElement) {
    // Initialize Three.js
    this.scene = new THREE.Scene();
    this.scene.background = null; // Transparent
    
    // Get actual container dimensions for proper aspect ratio
    const containerWidth = container ? container.clientWidth : window.innerWidth;
    const containerHeight = container ? container.clientHeight : window.innerHeight;
    const aspectRatio = containerWidth / containerHeight;
    
    // Set up camera with correct aspect ratio
    // Use orthographic-like perspective with narrow FOV for less distortion
    this.camera = new THREE.PerspectiveCamera(35, aspectRatio, 0.01, 1000);
    this.camera.position.set(0, 0, 3);  // Move camera back for better view
    this.camera.lookAt(0, 0, 0);
    
    this.renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      preserveDrawingBuffer: true 
    });
    
    // Set renderer size to container dimensions
    this.renderer.setSize(containerWidth, containerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    // IMPORTANT: Clear container first to prevent duplicate canvases
    if (container) {
      // Remove any existing canvas elements first
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
      
      container.appendChild(this.renderer.domElement);
      this.renderer.domElement.style.position = 'absolute';
      this.renderer.domElement.style.top = '0';
      this.renderer.domElement.style.left = '0';
      this.renderer.domElement.style.width = '100%';
      this.renderer.domElement.style.height = '100%';
      this.renderer.domElement.style.pointerEvents = 'auto';
      
      // Handle container resize
      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const width = entry.contentRect.width;
          const height = entry.contentRect.height;
          if (width > 0 && height > 0) {
            this.camera.aspect = width / height;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(width, height);
          }
        }
      });
      resizeObserver.observe(container);
    }
    
    // Initialize physics
    this.world = new CANNON.World();
    this.world.gravity.set(0, -9.82, 0);
    this.world.broadphase = new CANNON.NaiveBroadphase();
    this.world.solver.iterations = 10;
    this.world.defaultContactMaterial.restitution = 0; // No bounce by default
    
    // Initialize contact materials array if it doesn't exist
    if (!this.world.contactMaterials) {
      this.world.contactMaterials = [];
    }
    
    // Add invisible ground
    const groundShape = new CANNON.Plane();
    const groundBody = new CANNON.Body({ 
      mass: 0, 
      shape: groundShape,
      material: new CANNON.Material('ground')
    });
    groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
    groundBody.position.set(0, -0.5, 0);
    this.world.addBody(groundBody);
    
    // Initialize utilities
    this.aiInterpreter = new AICADInterpreter(apiKey);
    this.clock = new THREE.Clock();
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    this.dragIntersection = new THREE.Vector3();
    
    // Add lighting
    this.setupLighting();
    
    // Setup mouse events for dragging
    if (container) {
      this.setupMouseEvents(container);
    }
    
    // Start animation loop
    this.startAnimation();
  }
  
  private setupLighting(): void {
    // Better lighting for proper sphere visualization
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.1;
    directionalLight.shadow.camera.far = 50;
    this.scene.add(directionalLight);
    
    // Add second light from opposite direction for better form
    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.4);
    directionalLight2.position.set(-5, 8, -5);
    this.scene.add(directionalLight2);
    
    const pointLight = new THREE.PointLight(0xffffff, 0.3, 100);
    pointLight.position.set(-5, 5, 5);
    this.scene.add(pointLight);
  }
  
  private setupMouseEvents(container: HTMLElement): void {
    // Set container to not capture mouse events by default
    container.style.pointerEvents = 'none';
    
    // But enable pointer events on the canvas element itself
    if (this.renderer.domElement) {
      this.renderer.domElement.style.pointerEvents = 'auto';
    }
    
    // Use normal event listeners (not capture) to allow better event control
    container.addEventListener('mousedown', this.onMouseDown.bind(this));
    container.addEventListener('mousemove', this.onMouseMove.bind(this));
    container.addEventListener('mouseup', this.onMouseUp.bind(this));
    container.addEventListener('mouseleave', this.onMouseUp.bind(this));
    
    // Prevent default drag behavior
    container.addEventListener('dragstart', (e) => e.preventDefault());
  }
  
  private onMouseDown(event: MouseEvent): void {
    // Calculate mouse position in normalized device coordinates
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    // Cast ray from camera
    this.raycaster.setFromCamera(this.mouse, this.camera);
    
    // Check for intersections with draggable objects
    const draggableMeshes = Array.from(this.objects.values())
      .filter(obj => obj.isDraggable)
      .map(obj => obj.mesh);
    
    const intersects = this.raycaster.intersectObjects(draggableMeshes);
    
    if (intersects.length > 0) {
      // We hit an object - handle the drag
      event.preventDefault();
      event.stopPropagation();
      
      // Find the object
      const intersectedMesh = intersects[0].object as THREE.Mesh;
      const dragObject = Array.from(this.objects.values())
        .find(obj => obj.mesh === intersectedMesh);
      
      if (dragObject) {
        this.isDragging = true;
        this.dragObject = dragObject;
        dragObject.isDragging = true;
        
        // Update cursor to grabbing
        this.renderer.domElement.style.cursor = 'grabbing';
        
        // Store the initial Z position to maintain constant depth
        const initialZ = dragObject.mesh.position.z;
        
        // Create a plane perpendicular to camera view at object's current Z position
        // This ensures the object moves parallel to the screen
        const cameraDirection = new THREE.Vector3();
        this.camera.getWorldDirection(cameraDirection);
        this.dragPlane.setFromNormalAndCoplanarPoint(
          cameraDirection,
          dragObject.mesh.position
        );
        
        // Calculate drag offset
        const intersectionPoint = intersects[0].point;
        this.dragObject.dragOffset.copy(intersectionPoint).sub(dragObject.mesh.position);
        
        // Store initial Z to lock it during drag
        (this.dragObject as any).lockedZ = initialZ;
        
        // Pause physics for this object while dragging
        dragObject.body.type = CANNON.Body.KINEMATIC;
      }
    }
    // If we didn't hit an object, let the event pass through to the canvas
  }
  
  private onMouseMove(event: MouseEvent): void {
    if (!this.isDragging || !this.dragObject) {
      // When not dragging, check if hovering over a draggable object
      const rect = this.renderer.domElement.getBoundingClientRect();
      this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      this.raycaster.setFromCamera(this.mouse, this.camera);
      const draggableMeshes = Array.from(this.objects.values())
        .filter(obj => obj.isDraggable)
        .map(obj => obj.mesh);
      
      const intersects = this.raycaster.intersectObjects(draggableMeshes);
      
      // Update cursor based on hover state
      this.renderer.domElement.style.cursor = intersects.length > 0 ? 'grab' : 'default';
      return;
    }
    
    // We're dragging - prevent default and stop propagation
    event.preventDefault();
    event.stopPropagation();
    
    // Calculate mouse position
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    // Cast ray and find intersection with drag plane
    this.raycaster.setFromCamera(this.mouse, this.camera);
    
    if (this.raycaster.ray.intersectPlane(this.dragPlane, this.dragIntersection)) {
      // Calculate new position
      const newPosition = this.dragIntersection.clone().sub(this.dragObject.dragOffset);
      
      // Lock the Z position to maintain constant distance from camera
      const lockedZ = (this.dragObject as any).lockedZ || 0;
      newPosition.z = lockedZ;
      
      // Much larger bounds for more freedom
      const maxRange = 10;  // Much larger range
      newPosition.x = Math.max(-maxRange, Math.min(maxRange, newPosition.x));
      newPosition.y = Math.max(-maxRange, Math.min(maxRange, newPosition.y));
      
      // Update object position
      this.dragObject.mesh.position.copy(newPosition);
      this.dragObject.body.position.set(newPosition.x, newPosition.y, newPosition.z);
    }
  }
  
  private onMouseUp(event?: MouseEvent): void {
    if (this.isDragging) {
      // Only stop propagation if we were dragging
      if (event) {
        event.stopPropagation();
      }
      
      // Reset cursor
      this.renderer.domElement.style.cursor = 'grab';
    }
    
    if (this.isDragging && this.dragObject) {
      // Resume physics
      this.dragObject.body.type = CANNON.Body.DYNAMIC;
      this.dragObject.isDragging = false;
      this.dragObject = null;
    }
    this.isDragging = false;
  }
  
  public async executeAICommand(input: string): Promise<string> {
    try {
      // Get current context
      const context = {
        objects: Array.from(this.objects.values()).map(obj => ({
          id: obj.id,
          name: obj.name,
          position: obj.mesh.position,
          properties: Object.fromEntries(obj.properties)
        }))
      };
      
      // Get AI interpretation
      const command = await this.aiInterpreter.interpretCommand(input, context);
      
      // Execute the command
      await this.executeCommand(command);
      
      return command.explanation;
    } catch (error) {
      console.error('Error executing AI command:', error);
      return `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }
  
  private async executeCommand(command: AICADCommand): Promise<void> {
    switch (command.action) {
      case 'create_object':
        await this.createObject(command.parameters);
        break;
      case 'apply_physics':
        await this.applyPhysics(command.parameters);
        break;
      case 'animate':
        await this.createAnimation(command.parameters);
        break;
      case 'modify_property':
        await this.modifyProperty(command.parameters);
        break;
      case 'none':
        // Do nothing - just acknowledge
        console.log('No action needed');
        break;
      default:
        console.warn('Unknown command action:', command.action);
    }
  }
  
  private async createObject(params: any): Promise<void> {
    // Only clear if explicitly requested or if we're replacing objects
    // Don't clear if this is the first object
    if (params.clearExisting && this.objects.size > 0) {
      console.log('Clearing existing objects before creating new one');
      this.removeAllObjects();
    }
    
    const id = `obj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const name = params.name || params.type || 'object';
    
    // Create geometry based on type
    let geometry: THREE.BufferGeometry;
    let shape: CANNON.Shape;
    
    switch (params.type) {
      case 'sphere':
        const radius = params.radius || 0.6;  // Much bigger default for better visibility in preview
        geometry = new THREE.SphereGeometry(radius, 64, 64);  // Higher segments for smoother sphere
        shape = new CANNON.Sphere(radius);
        break;
      case 'box':
        const width = params.width || 0.2;
        const height = params.height || 0.2;
        const depth = params.depth || 0.2;
        geometry = new THREE.BoxGeometry(width, height, depth);
        shape = new CANNON.Box(new CANNON.Vec3(width/2, height/2, depth/2));
        break;
      default:
        // Default to sphere
        geometry = new THREE.SphereGeometry(0.1, 32, 32);
        shape = new CANNON.Sphere(0.1);
    }
    
    // Create material with better visual properties
    const material = new THREE.MeshPhysicalMaterial({
      color: params.color || '#3b82f6',
      metalness: 0.3,
      roughness: 0.4,
      clearcoat: 0.5,
      clearcoatRoughness: 0.2,
      envMapIntensity: 0.5,
      reflectivity: 0.5,
    });
    
    // Create mesh
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    
    // Set position - centered and at fixed Z distance from camera
    const pos = params.position || { x: 0, y: 0.2, z: 0 };  // Start slightly above center
    mesh.position.set(pos.x, pos.y, pos.z);
    
    // Create physics body with material that doesn't bounce by default
    const mass = params.mass || 1;
    const objectMaterial = new CANNON.Material('object');
    const body = new CANNON.Body({ 
      mass, 
      shape,
      material: objectMaterial
    });
    body.position.set(pos.x, pos.y, pos.z);
    
    // Set up contact material with ground (no bounce by default)
    const groundMaterial = this.world.bodies[0].material as CANNON.Material; // Ground is first body
    const contactMaterial = new CANNON.ContactMaterial(objectMaterial, groundMaterial, {
      restitution: 0, // No bounce
      friction: 0.4
    });
    this.world.addContactMaterial(contactMaterial);
    
    // Create CAD object
    const cadObject: CADObject3D = {
      id,
      name,
      mesh,
      body,
      isDraggable: true,
      isDragging: false,
      dragOffset: new THREE.Vector3(),
      animations: new Map(),
      properties: new Map()
    };
    
    // Add to scene and world
    this.scene.add(mesh);
    this.world.addBody(body);
    this.objects.set(id, cadObject);
    
    console.log('Created object:', id, 'Total objects:', this.objects.size);
  }
  
  private async applyPhysics(params: any): Promise<void> {
    const objects = Array.from(this.objects.values());
    
    if (params.type === 'bounce') {
      objects.forEach(obj => {
        // Update the material to be bouncy
        const bouncyMaterial = new CANNON.Material('bouncy');
        obj.body.material = bouncyMaterial;
        
        // Update contact material with ground for bouncing
        const groundMaterial = this.world.bodies[0].material as CANNON.Material;
        const bounceContactMaterial = new CANNON.ContactMaterial(bouncyMaterial, groundMaterial, {
          restitution: params.restitution || 0.8,  // Good bounce
          friction: 0.1
        });
        
        // Remove old contact material and add new one
        // Check if contactMaterials exists and is an array
        if (this.world.contactMaterials && Array.isArray(this.world.contactMaterials)) {
          this.world.contactMaterials = this.world.contactMaterials.filter(
            cm => {
              const mat1 = cm.materials[0];
              const mat2 = cm.materials[1];
              // Remove only contact materials involving this object's OLD material
              return !((mat1.id === 'object' || mat1.id === 'bouncy') && mat2 === groundMaterial) &&
                     !((mat2.id === 'object' || mat2.id === 'bouncy') && mat1 === groundMaterial);
            }
          );
        } else {
          // Initialize if it doesn't exist
          this.world.contactMaterials = [];
        }
        this.world.addContactMaterial(bounceContactMaterial);
        
        // Apply initial impulse for bouncing
        const impulse = new CANNON.Vec3(
          params.initial_velocity?.x || 0,
          params.initial_velocity?.y || 5,
          params.initial_velocity?.z || 0
        );
        obj.body.applyImpulse(impulse, obj.body.position);
        
        // Add continuous bouncing animation if requested
        if (params.continuous) {
          const bounceAnimation = () => {
            // Check if object is near ground and has low velocity
            if (obj.body.position.y < -0.35 && Math.abs(obj.body.velocity.y) < 0.5) {
              // Apply upward impulse for continuous bouncing
              const impulse = new CANNON.Vec3(0, params.initial_velocity?.y || 5, 0);
              obj.body.applyImpulse(impulse, obj.body.position);
            }
          };
          obj.animations.set('bounce', bounceAnimation);
        }
      });
    }
    
    if (params.type === 'gravity') {
      this.world.gravity.set(
        params.force.x || 0,
        params.force.y || -9.8,
        params.force.z || 0
      );
    }
    
    if (params.type === 'float') {
      objects.forEach(obj => {
        const floatAnimation = () => {
          const force = new CANNON.Vec3(
            params.force.x || 0,
            params.force.y || 10,
            params.force.z || 0
          );
          obj.body.applyForce(force, obj.body.position);
        };
        obj.animations.set('float', floatAnimation);
      });
    }
  }
  
  private async createAnimation(params: any): Promise<void> {
    const objects = Array.from(this.objects.values());
    
    objects.forEach(obj => {
      if (params.type === 'rotation') {
        const rotationAnimation = () => {
          const speed = params.speed || 0.02;
          switch (params.axis) {
            case 'x':
              obj.mesh.rotation.x += speed;
              break;
            case 'y':
              obj.mesh.rotation.y += speed;
              break;
            case 'z':
              obj.mesh.rotation.z += speed;
              break;
            default:
              obj.mesh.rotation.y += speed;
          }
        };
        obj.animations.set('rotation', rotationAnimation);
      }
      
      if (params.type === 'oscillate') {
        const startY = obj.mesh.position.y;
        const amplitude = params.amplitude || 0.5;
        const frequency = params.frequency || 2;
        let time = 0;
        
        const oscillateAnimation = () => {
          time += 0.016; // ~60fps
          const newY = startY + Math.sin(time * frequency) * amplitude;
          obj.body.position.y = newY;
        };
        obj.animations.set('oscillate', oscillateAnimation);
      }
    });
  }
  
  private async modifyProperty(params: any): Promise<void> {
    const objects = Array.from(this.objects.values());
    
    objects.forEach(obj => {
      switch (params.property) {
        case 'color':
          if (obj.mesh.material instanceof THREE.Material) {
            (obj.mesh.material as any).color = new THREE.Color(params.value);
          }
          break;
        case 'scale':
          obj.mesh.scale.setScalar(params.value);
          // Note: Physics body scale would need recreation for accurate physics
          break;
        case 'opacity':
          if (obj.mesh.material instanceof THREE.Material) {
            (obj.mesh.material as any).transparent = true;
            (obj.mesh.material as any).opacity = params.value;
          }
          break;
      }
      
      obj.properties.set(params.property, params.value);
    });
  }
  
  private startAnimation(): void {
    // Stop any existing animation first
    this.stopAnimation();
    
    const animate = () => {
      this.animationId = requestAnimationFrame(animate);
      
      // Update physics with fixed timestep for stability
      const fixedTimeStep = 1/60; // 60 FPS
      const maxSubSteps = 3;
      this.world.step(fixedTimeStep, this.clock.getDelta(), maxSubSteps);
      
      // Sync meshes with physics bodies (except when dragging)
      this.objects.forEach(obj => {
        if (!obj.isDragging) {
          // Directly copy position to avoid floating point errors
          obj.mesh.position.copy(obj.body.position as any);
          obj.mesh.quaternion.copy(obj.body.quaternion as any);
        }
        
        // Execute animations
        obj.animations.forEach(animation => animation());
      });
      
      // Clear before rendering to prevent ghosting
      this.renderer.clear();
      // Render
      this.renderer.render(this.scene, this.camera);
    };
    
    animate();
  }
  
  public stopAnimation(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }
  
  public removeAllObjects(): void {
    this.objects.forEach(obj => {
      this.scene.remove(obj.mesh);
      this.world.removeBody(obj.body);
      
      // Dispose geometry and materials
      obj.mesh.geometry.dispose();
      if (obj.mesh.material instanceof THREE.Material) {
        obj.mesh.material.dispose();
      }
    });
    this.objects.clear();
  }
  
  public getScene(): THREE.Scene { return this.scene; }
  public getCamera(): THREE.Camera { return this.camera; }
  public getRenderer(): THREE.WebGLRenderer { return this.renderer; }
  public getObjects(): Map<string, CADObject3D> { return this.objects; }
  
  public dispose(): void {
    this.stopAnimation();
    this.removeAllObjects();
    this.renderer.dispose();
  }
}
