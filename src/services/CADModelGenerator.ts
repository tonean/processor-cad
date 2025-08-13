import * as THREE from 'three';

export interface CADComponent {
  id: string;
  name: string;
  type: 'optical' | 'mechanical' | 'electronic' | 'structural' | 'custom';
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
  position: THREE.Vector3;
  rotation: THREE.Euler;
  scale: THREE.Vector3;
  properties: {
    dimensions?: { width: number; height: number; depth: number };
    material?: string;
    color?: string;
    opacity?: number;
  };
}

export interface CADModel {
  id: string;
  name: string;
  components: CADComponent[];
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  metadata: {
    description: string;
    keywords: string[];
    dimensions: { width: number; height: number; depth: number };
    complexity: 'simple' | 'medium' | 'complex';
  };
}

export class CADModelGenerator {
  private static instance: CADModelGenerator;

  private constructor() {}

  public static getInstance(): CADModelGenerator {
    if (!CADModelGenerator.instance) {
      CADModelGenerator.instance = new CADModelGenerator();
    }
    return CADModelGenerator.instance;
  }

  public async generateModelFromResearch(
    paperContent: string,
    paperTitle: string,
    keywords: string[],
    dimensions: Array<{ value: number; unit: string; context: string }>
  ): Promise<CADModel> {
    console.log('Generating CAD model from research paper:', paperTitle);
    
    // Create a new Three.js scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    
    // Add ambient lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);
    
    // Add directional lighting
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    scene.add(directionalLight);
    
    // Create camera
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    camera.position.set(5, 5, 5);
    camera.lookAt(0, 0, 0);
    
    // Create renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(800, 600);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    const components: CADComponent[] = [];
    
    // Analyze the research paper content to determine what to build
    const modelType = this.analyzeResearchContent(paperContent, keywords);
    console.log('Detected model type:', modelType);
    
    // Generate components based on the research
    switch (modelType) {
      case 'optical_system':
        components.push(...this.generateOpticalSystem(paperContent, dimensions));
        break;
      case 'mechanical_assembly':
        components.push(...this.generateMechanicalAssembly(paperContent, dimensions));
        break;
      case 'electronic_circuit':
        components.push(...this.generateElectronicCircuit(paperContent, dimensions));
        break;
      case 'structural_framework':
        components.push(...this.generateStructuralFramework(paperContent, dimensions));
        break;
      default:
        components.push(...this.generateGenericModel(paperContent, dimensions));
    }
    
    // Add all components to the scene
    components.forEach(component => {
      const mesh = new THREE.Mesh(component.geometry, component.material);
      mesh.position.copy(component.position);
      mesh.rotation.copy(component.rotation);
      mesh.scale.copy(component.scale);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData = { componentId: component.id };
      scene.add(mesh);
    });
    
    // Calculate overall model dimensions
    const modelDimensions = this.calculateModelDimensions(components);
    
    // Create the CAD model
    const cadModel: CADModel = {
      id: `model-${Date.now()}`,
      name: `CAD Model: ${paperTitle}`,
      components,
      scene,
      camera,
      renderer,
      metadata: {
        description: `3D CAD model generated from research paper: ${paperTitle}`,
        keywords: keywords.slice(0, 10),
        dimensions: modelDimensions,
        complexity: components.length > 10 ? 'complex' : components.length > 5 ? 'medium' : 'simple'
      }
    };
    
    console.log('CAD model generated successfully:', cadModel);
    return cadModel;
  }

  private analyzeResearchContent(content: string, keywords: string[]): string {
    const text = content.toLowerCase();
    const keywordString = keywords.join(' ').toLowerCase();
    
    // Check for optical/holographic content
    if (text.includes('optical') || text.includes('holographic') || text.includes('light') || 
        text.includes('lens') || text.includes('mirror') || text.includes('beam') ||
        keywordString.includes('optical') || keywordString.includes('holographic')) {
      return 'optical_system';
    }
    
    // Check for mechanical content
    if (text.includes('mechanical') || text.includes('assembly') || text.includes('gear') ||
        text.includes('bearing') || text.includes('shaft') || text.includes('motor') ||
        keywordString.includes('mechanical')) {
      return 'mechanical_assembly';
    }
    
    // Check for electronic content
    if (text.includes('electronic') || text.includes('circuit') || text.includes('pcb') ||
        text.includes('resistor') || text.includes('capacitor') || text.includes('transistor') ||
        keywordString.includes('electronic')) {
      return 'electronic_circuit';
    }
    
    // Check for structural content
    if (text.includes('structural') || text.includes('framework') || text.includes('support') ||
        text.includes('beam') || text.includes('column') || text.includes('truss') ||
        keywordString.includes('structural')) {
      return 'structural_framework';
    }
    
    return 'generic_model';
  }

  private generateOpticalSystem(content: string, dimensions: Array<{ value: number; unit: string; context: string }>): CADComponent[] {
    const components: CADComponent[] = [];
    
    // Create optical table/base
    const tableGeometry = new THREE.BoxGeometry(10, 0.5, 6);
    const tableMaterial = new THREE.MeshLambertMaterial({ color: 0x2c3e50 });
    components.push({
      id: 'optical-table',
      name: 'Optical Table',
      type: 'structural',
      geometry: tableGeometry,
      material: tableMaterial,
      position: new THREE.Vector3(0, 0, 0),
      rotation: new THREE.Euler(0, 0, 0),
      scale: new THREE.Vector3(1, 1, 1),
      properties: {
        dimensions: { width: 10, height: 0.5, depth: 6 },
        material: 'aluminum',
        color: '#2c3e50'
      }
    });
    
    // Create laser source
    const laserGeometry = new THREE.CylinderGeometry(0.2, 0.2, 1, 8);
    const laserMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000 });
    components.push({
      id: 'laser-source',
      name: 'Laser Source',
      type: 'optical',
      geometry: laserGeometry,
      material: laserMaterial,
      position: new THREE.Vector3(-4, 0.75, 0),
      rotation: new THREE.Euler(0, 0, Math.PI / 2),
      scale: new THREE.Vector3(1, 1, 1),
      properties: {
        dimensions: { width: 1, height: 0.4, depth: 0.4 },
        material: 'metal',
        color: '#ff0000'
      }
    });
    
    // Create beam splitter
    const splitterGeometry = new THREE.BoxGeometry(0.1, 1, 1);
    const splitterMaterial = new THREE.MeshLambertMaterial({ 
      color: 0x87ceeb, 
      transparent: true, 
      opacity: 0.7 
    });
    components.push({
      id: 'beam-splitter',
      name: 'Beam Splitter',
      type: 'optical',
      geometry: splitterGeometry,
      material: splitterMaterial,
      position: new THREE.Vector3(-2, 0.75, 0),
      rotation: new THREE.Euler(0, Math.PI / 4, 0),
      scale: new THREE.Vector3(1, 1, 1),
      properties: {
        dimensions: { width: 0.1, height: 1, depth: 1 },
        material: 'glass',
        color: '#87ceeb',
        opacity: 0.7
      }
    });
    
    // Create mirrors
    const mirrorGeometry = new THREE.BoxGeometry(0.1, 0.8, 0.8);
    const mirrorMaterial = new THREE.MeshLambertMaterial({ 
      color: 0xc0c0c0, 
      transparent: true, 
      opacity: 0.9 
    });
    
    components.push({
      id: 'mirror-1',
      name: 'Mirror 1',
      type: 'optical',
      geometry: mirrorGeometry,
      material: mirrorMaterial,
      position: new THREE.Vector3(0, 0.75, 2),
      rotation: new THREE.Euler(0, Math.PI / 4, 0),
      scale: new THREE.Vector3(1, 1, 1),
      properties: {
        dimensions: { width: 0.1, height: 0.8, depth: 0.8 },
        material: 'mirrored_glass',
        color: '#c0c0c0',
        opacity: 0.9
      }
    });
    
    components.push({
      id: 'mirror-2',
      name: 'Mirror 2',
      type: 'optical',
      geometry: mirrorGeometry,
      material: mirrorMaterial,
      position: new THREE.Vector3(2, 0.75, 0),
      rotation: new THREE.Euler(0, -Math.PI / 4, 0),
      scale: new THREE.Vector3(1, 1, 1),
      properties: {
        dimensions: { width: 0.1, height: 0.8, depth: 0.8 },
        material: 'mirrored_glass',
        color: '#c0c0c0',
        opacity: 0.9
      }
    });
    
    // Create detector/sensor
    const detectorGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.3);
    const detectorMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
    components.push({
      id: 'detector',
      name: 'Detector',
      type: 'electronic',
      geometry: detectorGeometry,
      material: detectorMaterial,
      position: new THREE.Vector3(4, 0.75, 0),
      rotation: new THREE.Euler(0, 0, 0),
      scale: new THREE.Vector3(1, 1, 1),
      properties: {
        dimensions: { width: 0.5, height: 0.5, depth: 0.3 },
        material: 'plastic',
        color: '#333333'
      }
    });
    
    return components;
  }

  private generateMechanicalAssembly(content: string, dimensions: Array<{ value: number; unit: string; context: string }>): CADComponent[] {
    const components: CADComponent[] = [];
    
    // Create base plate
    const baseGeometry = new THREE.BoxGeometry(8, 0.5, 6);
    const baseMaterial = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
    components.push({
      id: 'base-plate',
      name: 'Base Plate',
      type: 'structural',
      geometry: baseGeometry,
      material: baseMaterial,
      position: new THREE.Vector3(0, 0, 0),
      rotation: new THREE.Euler(0, 0, 0),
      scale: new THREE.Vector3(1, 1, 1),
      properties: {
        dimensions: { width: 8, height: 0.5, depth: 6 },
        material: 'steel',
        color: '#8b4513'
      }
    });
    
    // Create support columns
    const columnGeometry = new THREE.CylinderGeometry(0.3, 0.3, 3, 8);
    const columnMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 });
    
    for (let i = 0; i < 4; i++) {
      const x = (i % 2 === 0 ? -2 : 2);
      const z = (i < 2 ? -1.5 : 1.5);
      
      components.push({
        id: `column-${i + 1}`,
        name: `Support Column ${i + 1}`,
        type: 'structural',
        geometry: columnGeometry,
        material: columnMaterial,
        position: new THREE.Vector3(x, 1.75, z),
        rotation: new THREE.Euler(0, 0, 0),
        scale: new THREE.Vector3(1, 1, 1),
        properties: {
          dimensions: { width: 0.6, height: 3, depth: 0.6 },
          material: 'aluminum',
          color: '#696969'
        }
      });
    }
    
    // Create top plate
    const topGeometry = new THREE.BoxGeometry(8, 0.3, 6);
    const topMaterial = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
    components.push({
      id: 'top-plate',
      name: 'Top Plate',
      type: 'structural',
      geometry: topGeometry,
      material: topMaterial,
      position: new THREE.Vector3(0, 3.15, 0),
      rotation: new THREE.Euler(0, 0, 0),
      scale: new THREE.Vector3(1, 1, 1),
      properties: {
        dimensions: { width: 8, height: 0.3, depth: 6 },
        material: 'steel',
        color: '#8b4513'
      }
    });
    
    // Create central mechanism
    const mechanismGeometry = new THREE.CylinderGeometry(0.8, 0.8, 1, 12);
    const mechanismMaterial = new THREE.MeshLambertMaterial({ color: 0x4169e1 });
    components.push({
      id: 'central-mechanism',
      name: 'Central Mechanism',
      type: 'mechanical',
      geometry: mechanismGeometry,
      material: mechanismMaterial,
      position: new THREE.Vector3(0, 1.5, 0),
      rotation: new THREE.Euler(0, 0, 0),
      scale: new THREE.Vector3(1, 1, 1),
      properties: {
        dimensions: { width: 1.6, height: 1, depth: 1.6 },
        material: 'brass',
        color: '#4169e1'
      }
    });
    
    return components;
  }

  private generateElectronicCircuit(content: string, dimensions: Array<{ value: number; unit: string; context: string }>): CADComponent[] {
    const components: CADComponent[] = [];
    
    // Create PCB base
    const pcbGeometry = new THREE.BoxGeometry(6, 0.1, 4);
    const pcbMaterial = new THREE.MeshLambertMaterial({ color: 0x228b22 });
    components.push({
      id: 'pcb-base',
      name: 'PCB Board',
      type: 'electronic',
      geometry: pcbGeometry,
      material: pcbMaterial,
      position: new THREE.Vector3(0, 0, 0),
      rotation: new THREE.Euler(0, 0, 0),
      scale: new THREE.Vector3(1, 1, 1),
      properties: {
        dimensions: { width: 6, height: 0.1, depth: 4 },
        material: 'fiberglass',
        color: '#228b22'
      }
    });
    
    // Create various electronic components
    const componentsData = [
      { name: 'Resistor', color: 0x8b0000, pos: [-2, 0.1, -1] },
      { name: 'Capacitor', color: 0x000080, pos: [-1, 0.1, -1] },
      { name: 'Transistor', color: 0x000000, pos: [0, 0.1, -1] },
      { name: 'IC Chip', color: 0x696969, pos: [1, 0.1, -1] },
      { name: 'LED', color: 0xff0000, pos: [2, 0.1, -1] },
      { name: 'Connector', color: 0x808080, pos: [-2, 0.1, 1] },
      { name: 'Crystal', color: 0xffffff, pos: [-1, 0.1, 1] },
      { name: 'Diode', color: 0x0000ff, pos: [0, 0.1, 1] },
      { name: 'Potentiometer', color: 0x8b4513, pos: [1, 0.1, 1] },
      { name: 'Switch', color: 0x2f4f4f, pos: [2, 0.1, 1] }
    ];
    
    componentsData.forEach((comp, index) => {
      const geometry = new THREE.BoxGeometry(0.3, 0.2, 0.3);
      const material = new THREE.MeshLambertMaterial({ color: comp.color });
      
      components.push({
        id: `component-${index + 1}`,
        name: comp.name,
        type: 'electronic',
        geometry,
        material,
        position: new THREE.Vector3(comp.pos[0], comp.pos[1], comp.pos[2]),
        rotation: new THREE.Euler(0, 0, 0),
        scale: new THREE.Vector3(1, 1, 1),
        properties: {
          dimensions: { width: 0.3, height: 0.2, depth: 0.3 },
          material: 'plastic',
          color: `#${comp.color.toString(16).padStart(6, '0')}`
        }
      });
    });
    
    return components;
  }

  private generateStructuralFramework(content: string, dimensions: Array<{ value: number; unit: string; context: string }>): CADComponent[] {
    const components: CADComponent[] = [];
    
    // Create base foundation
    const foundationGeometry = new THREE.BoxGeometry(12, 1, 8);
    const foundationMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 });
    components.push({
      id: 'foundation',
      name: 'Foundation',
      type: 'structural',
      geometry: foundationGeometry,
      material: foundationMaterial,
      position: new THREE.Vector3(0, 0.5, 0),
      rotation: new THREE.Euler(0, 0, 0),
      scale: new THREE.Vector3(1, 1, 1),
      properties: {
        dimensions: { width: 12, height: 1, depth: 8 },
        material: 'concrete',
        color: '#696969'
      }
    });
    
    // Create vertical beams
    const beamGeometry = new THREE.BoxGeometry(0.3, 6, 0.3);
    const beamMaterial = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
    
    const beamPositions = [
      [-4, 4, -2], [4, 4, -2], [-4, 4, 2], [4, 4, 2],
      [-2, 4, -3], [2, 4, -3], [-2, 4, 3], [2, 4, 3]
    ];
    
    beamPositions.forEach((pos, index) => {
      components.push({
        id: `beam-${index + 1}`,
        name: `Vertical Beam ${index + 1}`,
        type: 'structural',
        geometry: beamGeometry,
        material: beamMaterial,
        position: new THREE.Vector3(pos[0], pos[1], pos[2]),
        rotation: new THREE.Euler(0, 0, 0),
        scale: new THREE.Vector3(1, 1, 1),
        properties: {
          dimensions: { width: 0.3, height: 6, depth: 0.3 },
          material: 'steel',
          color: '#8b4513'
        }
      });
    });
    
    // Create horizontal beams
    const horizontalBeamGeometry = new THREE.BoxGeometry(8, 0.3, 0.3);
    
    // Top horizontal beams
    for (let i = 0; i < 4; i++) {
      const z = (i < 2 ? -2 : 2);
      const y = (i % 2 === 0 ? 6.5 : 7.5);
      
      components.push({
        id: `horizontal-beam-${i + 1}`,
        name: `Horizontal Beam ${i + 1}`,
        type: 'structural',
        geometry: horizontalBeamGeometry,
        material: beamMaterial,
        position: new THREE.Vector3(0, y, z),
        rotation: new THREE.Euler(0, 0, 0),
        scale: new THREE.Vector3(1, 1, 1),
        properties: {
          dimensions: { width: 8, height: 0.3, depth: 0.3 },
          material: 'steel',
          color: '#8b4513'
        }
      });
    }
    
    // Create cross beams
    const crossBeamGeometry = new THREE.BoxGeometry(0.3, 0.3, 4);
    
    for (let i = 0; i < 2; i++) {
      const x = (i === 0 ? -4 : 4);
      
      components.push({
        id: `cross-beam-${i + 1}`,
        name: `Cross Beam ${i + 1}`,
        type: 'structural',
        geometry: crossBeamGeometry,
        material: beamMaterial,
        position: new THREE.Vector3(x, 7, 0),
        rotation: new THREE.Euler(0, 0, 0),
        scale: new THREE.Vector3(1, 1, 1),
        properties: {
          dimensions: { width: 0.3, height: 0.3, depth: 4 },
          material: 'steel',
          color: '#8b4513'
        }
      });
    }
    
    return components;
  }

  private generateGenericModel(content: string, dimensions: Array<{ value: number; unit: string; context: string }>): CADComponent[] {
    const components: CADComponent[] = [];
    
    // Create a simple geometric model
    const baseGeometry = new THREE.BoxGeometry(4, 0.5, 4);
    const baseMaterial = new THREE.MeshLambertMaterial({ color: 0x4682b4 });
    components.push({
      id: 'base',
      name: 'Base',
      type: 'structural',
      geometry: baseGeometry,
      material: baseMaterial,
      position: new THREE.Vector3(0, 0.25, 0),
      rotation: new THREE.Euler(0, 0, 0),
      scale: new THREE.Vector3(1, 1, 1),
      properties: {
        dimensions: { width: 4, height: 0.5, depth: 4 },
        material: 'metal',
        color: '#4682b4'
      }
    });
    
    // Create central body
    const bodyGeometry = new THREE.CylinderGeometry(1, 1, 3, 8);
    const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x32cd32 });
    components.push({
      id: 'body',
      name: 'Main Body',
      type: 'custom',
      geometry: bodyGeometry,
      material: bodyMaterial,
      position: new THREE.Vector3(0, 2, 0),
      rotation: new THREE.Euler(0, 0, 0),
      scale: new THREE.Vector3(1, 1, 1),
      properties: {
        dimensions: { width: 2, height: 3, depth: 2 },
        material: 'plastic',
        color: '#32cd32'
      }
    });
    
    // Create top cap
    const capGeometry = new THREE.SphereGeometry(1.2, 8, 6);
    const capMaterial = new THREE.MeshLambertMaterial({ color: 0xff6347 });
    components.push({
      id: 'cap',
      name: 'Top Cap',
      type: 'custom',
      geometry: capGeometry,
      material: capMaterial,
      position: new THREE.Vector3(0, 4, 0),
      rotation: new THREE.Euler(0, 0, 0),
      scale: new THREE.Vector3(1, 1, 1),
      properties: {
        dimensions: { width: 2.4, height: 2.4, depth: 2.4 },
        material: 'rubber',
        color: '#ff6347'
      }
    });
    
    return components;
  }

  private calculateModelDimensions(components: CADComponent[]): { width: number; height: number; depth: number } {
    if (components.length === 0) {
      return { width: 1, height: 1, depth: 1 };
    }
    
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;
    
    components.forEach(component => {
      const pos = component.position;
      const scale = component.scale;
      
      // Rough estimation of component bounds
      const halfWidth = (component.properties.dimensions?.width || 1) * scale.x / 2;
      const halfHeight = (component.properties.dimensions?.height || 1) * scale.y / 2;
      const halfDepth = (component.properties.dimensions?.depth || 1) * scale.z / 2;
      
      minX = Math.min(minX, pos.x - halfWidth);
      maxX = Math.max(maxX, pos.x + halfWidth);
      minY = Math.min(minY, pos.y - halfHeight);
      maxY = Math.max(maxY, pos.y + halfHeight);
      minZ = Math.min(minZ, pos.z - halfDepth);
      maxZ = Math.max(maxZ, pos.z + halfDepth);
    });
    
    return {
      width: maxX - minX,
      height: maxY - minY,
      depth: maxZ - minZ
    };
  }

  public renderModelToCanvas(cadModel: CADModel, canvas: HTMLCanvasElement): void {
    // Set renderer size to match canvas
    cadModel.renderer.setSize(canvas.width, canvas.height);
    
    // Update camera aspect ratio
    cadModel.camera.aspect = canvas.width / canvas.height;
    cadModel.camera.updateProjectionMatrix();
    
    // Render the scene
    cadModel.renderer.render(cadModel.scene, cadModel.camera);
    
    // Get the rendered image as data URL
    const dataURL = cadModel.renderer.domElement.toDataURL('image/png');
    
    // Create an image element and set it as the canvas background
    const img = new Image();
    img.onload = () => {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      }
    };
    img.src = dataURL;
  }

  public exportModelAsSTL(cadModel: CADModel): string {
    // This would require additional STL export functionality
    // For now, return a placeholder
    return `# STL file generated from CAD model: ${cadModel.name}
# This is a placeholder - actual STL export would require additional libraries
solid ${cadModel.name}
endsolid ${cadModel.name}`;
  }
} 