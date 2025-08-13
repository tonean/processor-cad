import * as THREE from 'three';

export interface HammerComponents {
  handle: THREE.BufferGeometry;
  head: THREE.BufferGeometry;
  claw: THREE.BufferGeometry;
  wedge: THREE.BufferGeometry;
  grip: THREE.BufferGeometry;
}

export class HammerGenerator {
  /**
   * Generates a realistic 3D hammer model with proper proportions
   */
  public static generateHammer(): { geometries: HammerComponents; scene: THREE.Scene } {
    const scene = new THREE.Scene();
    const geometries: HammerComponents = {} as HammerComponents;
    
    // Hammer dimensions (in units, scaled realistically)
    const handleLength = 12;
    const handleRadius = 0.5;
    const headWidth = 4;
    const headHeight = 2;
    const headDepth = 1.5;
    const clawLength = 3;
    const gripLength = 4;
    
    // 1. Create the handle (wooden shaft)
    const handleGeometry = new THREE.CylinderGeometry(
      handleRadius * 0.9,  // Top radius (slightly tapered)
      handleRadius,        // Bottom radius
      handleLength,        // Height
      16,                  // Radial segments
      4                    // Height segments
    );
    geometries.handle = handleGeometry;
    
    const handleMaterial = new THREE.MeshPhongMaterial({
      color: 0x8B4513,  // Saddle brown for wood
      roughness: 0.8,
      metalness: 0.0
    });
    
    const handleMesh = new THREE.Mesh(handleGeometry, handleMaterial);
    handleMesh.position.set(0, 0, 0);
    handleMesh.castShadow = true;
    handleMesh.receiveShadow = true;
    scene.add(handleMesh);
    
    // 2. Create the hammer head (metal striking surface)
    const headShape = new THREE.Shape();
    
    // Create a slightly tapered hammer head profile
    headShape.moveTo(-headWidth/2, -headHeight/2);
    headShape.lineTo(headWidth/2, -headHeight/2);
    headShape.lineTo(headWidth/2 - 0.2, headHeight/2);
    headShape.lineTo(-headWidth/2 + 0.2, headHeight/2);
    headShape.closePath();
    
    const extrudeSettings = {
      depth: headDepth,
      bevelEnabled: true,
      bevelThickness: 0.1,
      bevelSize: 0.1,
      bevelSegments: 2
    };
    
    const headGeometry = new THREE.ExtrudeGeometry(headShape, extrudeSettings);
    geometries.head = headGeometry;
    
    const headMaterial = new THREE.MeshPhongMaterial({
      color: 0x4A4A4A,  // Dark metal gray
      metalness: 0.9,
      roughness: 0.2
    });
    
    const headMesh = new THREE.Mesh(headGeometry, headMaterial);
    headMesh.rotation.y = Math.PI / 2;
    headMesh.position.set(0, handleLength/2 + headHeight/2, 0);
    headMesh.castShadow = true;
    headMesh.receiveShadow = true;
    scene.add(headMesh);
    
    // 3. Create the claw (curved back part for pulling nails)
    const clawCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(-0.5, 0.3, 0),
      new THREE.Vector3(-1.5, 0.8, 0),
      new THREE.Vector3(-2.5, 1.5, 0),
      new THREE.Vector3(-3, 2.5, 0)
    ]);
    
    const clawGeometry = new THREE.TubeGeometry(
      clawCurve,
      20,      // Tube segments
      0.3,     // Tube radius
      8,       // Radial segments
      false    // Closed
    );
    geometries.claw = clawGeometry;
    
    const clawMesh = new THREE.Mesh(clawGeometry, headMaterial);
    clawMesh.position.set(-headWidth/2 - 0.5, handleLength/2 + headHeight/2, 0);
    clawMesh.castShadow = true;
    clawMesh.receiveShadow = true;
    scene.add(clawMesh);
    
    // Create the split in the claw (V-shaped gap for nail pulling)
    const wedgeGeometry = new THREE.BoxGeometry(0.2, 2, headDepth * 0.8);
    geometries.wedge = wedgeGeometry;
    
    const wedgeMesh = new THREE.Mesh(wedgeGeometry, headMaterial);
    wedgeMesh.position.set(-headWidth/2 - 2, handleLength/2 + headHeight/2 + 1.5, 0);
    wedgeMesh.rotation.z = -Math.PI / 6;
    scene.add(wedgeMesh);
    
    // 4. Create the grip (rubber/textured bottom part of handle)
    const gripGeometry = new THREE.CylinderGeometry(
      handleRadius * 1.2,  // Top radius (slightly wider for grip)
      handleRadius * 1.3,  // Bottom radius
      gripLength,          // Height
      16,                  // Radial segments
      8                    // Height segments with ridges
    );
    
    // Add some texture to the grip by modifying vertices
    const gripPositions = gripGeometry.attributes.position;
    for (let i = 0; i < gripPositions.count; i++) {
      const y = gripPositions.getY(i);
      const ridgeEffect = Math.sin(y * 10) * 0.02; // Create ridges
      const x = gripPositions.getX(i);
      const z = gripPositions.getZ(i);
      const length = Math.sqrt(x * x + z * z);
      if (length > 0) {
        gripPositions.setX(i, x * (1 + ridgeEffect));
        gripPositions.setZ(i, z * (1 + ridgeEffect));
      }
    }
    gripGeometry.attributes.position.needsUpdate = true;
    geometries.grip = gripGeometry;
    
    const gripMaterial = new THREE.MeshPhongMaterial({
      color: 0x1A1A1A,  // Black rubber
      roughness: 0.9,
      metalness: 0.0
    });
    
    const gripMesh = new THREE.Mesh(gripGeometry, gripMaterial);
    gripMesh.position.set(0, -handleLength/2 + gripLength/2, 0);
    gripMesh.castShadow = true;
    gripMesh.receiveShadow = true;
    scene.add(gripMesh);
    
    // Add additional details
    
    // Metal band connecting head to handle
    const bandGeometry = new THREE.CylinderGeometry(
      handleRadius * 1.5,
      handleRadius * 1.5,
      0.5,
      16
    );
    const bandMesh = new THREE.Mesh(bandGeometry, headMaterial);
    bandMesh.position.set(0, handleLength/2 - 0.5, 0);
    scene.add(bandMesh);
    
    // Add lighting to the scene
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.near = 0.1;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -10;
    directionalLight.shadow.camera.right = 10;
    directionalLight.shadow.camera.top = 10;
    directionalLight.shadow.camera.bottom = -10;
    scene.add(directionalLight);
    
    return { geometries, scene };
  }
  
  /**
   * Creates a complete hammer mesh group
   */
  public static createHammerGroup(): THREE.Group {
    const group = new THREE.Group();
    const { geometries } = this.generateHammer();
    
    // Handle
    const handleMaterial = new THREE.MeshPhongMaterial({
      color: 0x8B4513,
      roughness: 0.8,
      metalness: 0.0
    });
    const handleMesh = new THREE.Mesh(geometries.handle, handleMaterial);
    group.add(handleMesh);
    
    // Head
    const headMaterial = new THREE.MeshPhongMaterial({
      color: 0x4A4A4A,
      metalness: 0.9,
      roughness: 0.2
    });
    const headMesh = new THREE.Mesh(geometries.head, headMaterial);
    headMesh.rotation.y = Math.PI / 2;
    headMesh.position.set(0, 6 + 1, 0);
    group.add(headMesh);
    
    // Claw
    const clawMesh = new THREE.Mesh(geometries.claw, headMaterial);
    clawMesh.position.set(-2.5, 7, 0);
    group.add(clawMesh);
    
    // Wedge
    const wedgeMesh = new THREE.Mesh(geometries.wedge, headMaterial);
    wedgeMesh.position.set(-4, 8.5, 0);
    wedgeMesh.rotation.z = -Math.PI / 6;
    group.add(wedgeMesh);
    
    // Grip
    const gripMaterial = new THREE.MeshPhongMaterial({
      color: 0x1A1A1A,
      roughness: 0.9,
      metalness: 0.0
    });
    const gripMesh = new THREE.Mesh(geometries.grip, gripMaterial);
    gripMesh.position.set(0, -4, 0);
    group.add(gripMesh);
    
    // Metal band
    const bandGeometry = new THREE.CylinderGeometry(0.75, 0.75, 0.5, 16);
    const bandMesh = new THREE.Mesh(bandGeometry, headMaterial);
    bandMesh.position.set(0, 5.5, 0);
    group.add(bandMesh);
    
    return group;
  }
}
