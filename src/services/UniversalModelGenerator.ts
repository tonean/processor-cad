import * as THREE from 'three';
import { GoogleGenerativeAI } from '@google/generative-ai';

export interface ModelAnalysis {
  name: string;
  description: string;
  components: ComponentDetail[];
  materials: MaterialDetail[];
  dimensions: DimensionDetail[];
  topology: TopologyDetail;
}

export interface ComponentDetail {
  name: string;
  type: string;
  shape: string;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  scale: { x: number; y: number; z: number };
  material: string;
  color: string;
  details: string[];
}

export interface MaterialDetail {
  name: string;
  type: string;
  color: string;
  metalness: number;
  roughness: number;
  transparent?: boolean;
  opacity?: number;
  emissive?: string;
}

export interface DimensionDetail {
  overall: { width: number; height: number; depth: number };
  components: { [key: string]: { width: number; height: number; depth: number } };
}

export interface TopologyDetail {
  complexity: 'simple' | 'moderate' | 'complex' | 'highly-complex';
  symmetry: string;
  features: string[];
}

export class UniversalModelGenerator {
  private genAI: GoogleGenerativeAI | null = null;
  
  constructor(apiKey?: string) {
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
    }
  }
  
  /**
   * Generate a realistic 3D model from any text description
   */
  public async generateModelFromDescription(description: string): Promise<THREE.Group[]> {
    console.log('🤖 Generating model for:', description);
    
    try {
      // Step 1: Analyze what the user wants using AI
      const analysis = await this.analyzeWithAI(description);
      
      // Step 2: Generate 3 different variations
      const models: THREE.Group[] = [];
      
      for (let i = 0; i < 3; i++) {
        try {
          const model = await this.createDetailedModel(analysis, i);
          models.push(model);
        } catch (error) {
          console.warn(`Error generating variation ${i}:`, error);
          // Create a fallback model if one variation fails
          const fallbackGroup = new THREE.Group();
          const geometry = new THREE.BoxGeometry(1, 1, 1);
          const material = new THREE.MeshStandardMaterial({ color: '#666666' });
          const mesh = new THREE.Mesh(geometry, material);
          fallbackGroup.add(mesh);
          models.push(fallbackGroup);
        }
      }
      
      return models;
    } catch (error) {
      console.error('Error in generateModelFromDescription:', error);
      // Return a simple fallback model
      const fallbackGroup = new THREE.Group();
      const geometry = new THREE.BoxGeometry(1, 1, 1);
      const material = new THREE.MeshStandardMaterial({ color: '#666666' });
      const mesh = new THREE.Mesh(geometry, material);
      fallbackGroup.add(mesh);
      return [fallbackGroup];
    }
  }
  
  /**
   * Use AI to understand what needs to be modeled
   */
  private async analyzeWithAI(description: string): Promise<ModelAnalysis> {
    if (this.genAI) {
      try {
        const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        
        const prompt = `You are a 3D modeling expert. Analyze this request and provide detailed specifications for creating a realistic 3D model.

Request: "${description}"

Provide a detailed JSON response with:
1. Components (list every part with exact shapes, positions, materials)
2. Materials (realistic materials with color, metalness, roughness)
3. Dimensions (realistic proportions)
4. Topology (complexity, symmetry, special features)

For each component, specify:
- Exact shape (use curves, extrusions, lathes, not just boxes)
- Position in 3D space
- Material and color
- Fine details (textures, patterns, small features)

Make it as realistic as possible. Think about real-world proportions and details.

Response format:
{
  "name": "object name",
  "description": "detailed description",
  "components": [...],
  "materials": [...],
  "dimensions": {...},
  "topology": {...}
}`;
        
        const result = await model.generateContent(prompt);
        const response = result.response.text();
        
        // Parse AI response
        try {
          const jsonMatch = response.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
          }
        } catch (e) {
          console.warn('Could not parse AI response, using fallback');
        }
      } catch (error) {
        console.error('AI analysis failed:', error);
      }
    }
    
    // Fallback analysis based on keywords
    return this.getFallbackAnalysis(description);
  }
  
  /**
   * Create a detailed 3D model based on analysis
   */
  private async createDetailedModel(analysis: ModelAnalysis, variation: number): Promise<THREE.Group> {
    const group = new THREE.Group();
    group.name = `${analysis.name}_v${variation + 1}`;
    
    // Generate components based on analysis
    for (const component of analysis.components) {
      const mesh = this.createComplexGeometry(component, variation);
      if (mesh) {
        group.add(mesh);
      }
    }
    
    // Add fine details
    this.addFineDetails(group, analysis, variation);
    
    return group;
  }
  
  /**
   * Create complex, realistic geometry (not simple boxes!)
   */
  private createComplexGeometry(component: ComponentDetail, variation: number): THREE.Mesh | THREE.Group {
    // Safety check - ensure component has all required properties
    if (!component || !component.position || !component.rotation || !component.scale) {
      console.warn('Invalid component data:', component);
      // Return a default box if component is invalid
      const geometry = new THREE.BoxGeometry(1, 1, 1);
      const material = new THREE.MeshStandardMaterial({ color: '#666666' });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      return mesh;
    }

    const material = this.createRealisticMaterial(component);
    
    // Determine the best geometry type based on the shape description
    const shape = component.shape.toLowerCase();
    let geometry: THREE.BufferGeometry;
    
    if (shape.includes('curved') || shape.includes('organic') || shape.includes('smooth')) {
      // Use NURBS-like curves or subdivided geometry
      geometry = this.createOrganicShape(component);
    } else if (shape.includes('cylinder') || shape.includes('tube') || shape.includes('pipe')) {
      // Create detailed cylindrical shapes
      geometry = this.createDetailedCylinder(component);
    } else if (shape.includes('sphere') || shape.includes('ball') || shape.includes('round')) {
      // Create detailed spherical shapes
      geometry = this.createDetailedSphere(component);
    } else if (shape.includes('complex') || shape.includes('detailed')) {
      // Use extrusion or lathe geometry for complex shapes
      geometry = this.createExtrudedShape(component);
    } else {
      // Default to a heavily subdivided and modified box
      geometry = this.createDetailedBox(component);
    }
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(
      (component.position.x || 0) + variation * 0.1,
      component.position.y || 0,
      component.position.z || 0
    );
    mesh.rotation.set(
      component.rotation.x || 0,
      (component.rotation.y || 0) + variation * 0.1,
      component.rotation.z || 0
    );
    mesh.scale.set(
      component.scale.x || 1,
      component.scale.y || 1,
      component.scale.z || 1
    );
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    
    return mesh;
  }
  
  /**
   * Create organic, curved shapes using parametric geometry
   */
  private createOrganicShape(component: ComponentDetail): THREE.BufferGeometry {
    // Create a shape using parametric equations
    const points: THREE.Vector3[] = [];
    const segments = 64;
    
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const angle = t * Math.PI * 2;
      
      // Create organic variations
      const radius = 1 + Math.sin(angle * 3) * 0.2;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle * 2) * 0.5;
      const z = Math.sin(angle) * radius;
      
      points.push(new THREE.Vector3(x, y, z));
    }
    
    // Create a curve from points
    const curve = new THREE.CatmullRomCurve3(points, true);
    
    // Create tube geometry from curve
    const geometry = new THREE.TubeGeometry(curve, 64, 0.2, 16, true);
    
    // Add noise for more organic feel
    const positions = geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const y = positions.getY(i);
      const z = positions.getZ(i);
      
      const noise = (Math.random() - 0.5) * 0.02;
      positions.setXYZ(i, x + noise, y + noise, z + noise);
    }
    positions.needsUpdate = true;
    geometry.computeVertexNormals();
    
    return geometry;
  }
  
  /**
   * Create detailed cylindrical shapes with variations
   */
  private createDetailedCylinder(component: ComponentDetail): THREE.BufferGeometry {
    const radiusTop = 0.5 + Math.random() * 0.2;
    const radiusBottom = 0.5 + Math.random() * 0.2;
    const height = 2;
    const radialSegments = 32;
    const heightSegments = 16;
    
    const geometry = new THREE.CylinderGeometry(
      radiusTop,
      radiusBottom,
      height,
      radialSegments,
      heightSegments
    );
    
    // Add surface details
    const positions = geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const y = positions.getY(i);
      const x = positions.getX(i);
      const z = positions.getZ(i);
      
      // Add ridges or grooves
      const ridgeEffect = Math.sin(y * 10) * 0.02;
      const length = Math.sqrt(x * x + z * z);
      
      if (length > 0) {
        positions.setX(i, x * (1 + ridgeEffect));
        positions.setZ(i, z * (1 + ridgeEffect));
      }
    }
    positions.needsUpdate = true;
    geometry.computeVertexNormals();
    
    return geometry;
  }
  
  /**
   * Create detailed spherical shapes with surface features
   */
  private createDetailedSphere(component: ComponentDetail): THREE.BufferGeometry {
    const geometry = new THREE.SphereGeometry(1, 64, 64);
    
    // Add surface variations
    const positions = geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const y = positions.getY(i);
      const z = positions.getZ(i);
      
      const length = Math.sqrt(x * x + y * y + z * z);
      
      // Add bumps or dimples
      const bumpiness = Math.sin(x * 10) * Math.cos(y * 10) * 0.05;
      const scale = 1 + bumpiness;
      
      positions.setXYZ(
        i,
        x * scale,
        y * scale,
        z * scale
      );
    }
    positions.needsUpdate = true;
    geometry.computeVertexNormals();
    
    return geometry;
  }
  
  /**
   * Create extruded shapes for complex geometry
   */
  private createExtrudedShape(component: ComponentDetail): THREE.BufferGeometry {
    // Create a complex shape
    const shape = new THREE.Shape();
    
    // Create an interesting profile
    shape.moveTo(0, 0);
    shape.bezierCurveTo(0.5, 0, 0.5, 0.5, 0.5, 1);
    shape.bezierCurveTo(0.5, 1.5, 0, 1.5, -0.5, 1.5);
    shape.bezierCurveTo(-1, 1.5, -1, 1, -1, 0.5);
    shape.bezierCurveTo(-1, 0, -0.5, 0, 0, 0);
    
    const extrudeSettings = {
      depth: 2,
      bevelEnabled: true,
      bevelThickness: 0.1,
      bevelSize: 0.1,
      bevelSegments: 8,
      steps: 16,
      curveSegments: 32
    };
    
    return new THREE.ExtrudeGeometry(shape, extrudeSettings);
  }
  
  /**
   * Create detailed box geometry (not just a simple box!)
   */
  private createDetailedBox(component: ComponentDetail): THREE.BufferGeometry {
    // Start with a rounded box for smoother edges
    const geometry = new THREE.BoxGeometry(1, 1, 1, 8, 8, 8);
    
    // Modify vertices to add details
    const positions = geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const y = positions.getY(i);
      const z = positions.getZ(i);
      
      // Round the corners
      const cornerRadius = 0.1;
      const distance = Math.sqrt(x * x + y * y + z * z);
      
      if (distance > 0.8) {
        const scale = 0.8 / distance;
        positions.setXYZ(i, x * scale, y * scale, z * scale);
      }
      
      // Add surface details
      const detailNoise = (Math.random() - 0.5) * 0.01;
      positions.setXYZ(
        i,
        x + detailNoise,
        y + detailNoise,
        z + detailNoise
      );
    }
    positions.needsUpdate = true;
    geometry.computeVertexNormals();
    
    return geometry;
  }
  
  /**
   * Create realistic materials based on component specifications
   */
  private createRealisticMaterial(component: ComponentDetail): THREE.Material {
    const materialType = component.material.toLowerCase();
    
    if (materialType.includes('metal')) {
      return new THREE.MeshPhysicalMaterial({
        color: component.color || '#888888',
        metalness: 0.9,
        roughness: 0.1,
        clearcoat: 0.3,
        clearcoatRoughness: 0.2,
        envMapIntensity: 1.5
      });
    } else if (materialType.includes('glass') || materialType.includes('transparent')) {
      return new THREE.MeshPhysicalMaterial({
        color: component.color || '#ffffff',
        metalness: 0.0,
        roughness: 0.0,
        transmission: 0.95,
        thickness: 0.5,
        transparent: true,
        opacity: 0.8,
        ior: 1.5
      });
    } else if (materialType.includes('plastic')) {
      return new THREE.MeshPhysicalMaterial({
        color: component.color || '#4488ff',
        metalness: 0.0,
        roughness: 0.3,
        clearcoat: 0.5,
        clearcoatRoughness: 0.3
      });
    } else if (materialType.includes('wood')) {
      // Create wood texture procedurally
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d')!;
      
      // Draw wood grain
      const gradient = ctx.createLinearGradient(0, 0, 512, 0);
      gradient.addColorStop(0, '#8B4513');
      gradient.addColorStop(0.5, '#A0522D');
      gradient.addColorStop(1, '#8B4513');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 512, 512);
      
      // Add grain lines
      ctx.strokeStyle = '#654321';
      ctx.lineWidth = 1;
      for (let i = 0; i < 512; i += 4) {
        ctx.beginPath();
        ctx.moveTo(0, i + Math.sin(i * 0.01) * 10);
        ctx.lineTo(512, i + Math.sin((i + 512) * 0.01) * 10);
        ctx.stroke();
      }
      
      const texture = new THREE.CanvasTexture(canvas);
      
      return new THREE.MeshPhysicalMaterial({
        map: texture,
        roughness: 0.8,
        metalness: 0.0,
        clearcoat: 0.2,
        clearcoatRoughness: 0.8
      });
    } else if (materialType.includes('fabric') || materialType.includes('cloth')) {
      return new THREE.MeshPhysicalMaterial({
        color: component.color || '#334455',
        roughness: 0.9,
        metalness: 0.0,
        sheen: 1.0,
        sheenRoughness: 0.5,
        sheenColor: new THREE.Color(component.color || '#ffffff')
      });
    } else {
      // Default material
      return new THREE.MeshPhysicalMaterial({
        color: component.color || '#808080',
        roughness: 0.5,
        metalness: 0.3
      });
    }
  }
  
  /**
   * Add fine details to make the model more realistic
   */
  private addFineDetails(group: THREE.Group, analysis: ModelAnalysis, variation: number) {
    // Add screws, bolts, seams, etc. based on the object type
    const objectType = analysis.name.toLowerCase();
    
    if (objectType.includes('mechanical') || objectType.includes('tool')) {
      this.addMechanicalDetails(group);
    } else if (objectType.includes('organic') || objectType.includes('natural')) {
      this.addOrganicDetails(group);
    } else if (objectType.includes('electronic') || objectType.includes('tech')) {
      this.addElectronicDetails(group);
    }
    
    // Add variation-specific details
    this.addVariationDetails(group, variation);
  }
  
  /**
   * Add mechanical details like screws and bolts
   */
  private addMechanicalDetails(group: THREE.Group) {
    const screwGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.1, 6);
    const screwMaterial = new THREE.MeshPhysicalMaterial({
      color: '#333333',
      metalness: 0.9,
      roughness: 0.2
    });
    
    // Add some screws at logical positions
    for (let i = 0; i < 4; i++) {
      const screw = new THREE.Mesh(screwGeometry, screwMaterial);
      const angle = (i / 4) * Math.PI * 2;
      screw.position.set(
        Math.cos(angle) * 0.8,
        0.5,
        Math.sin(angle) * 0.8
      );
      group.add(screw);
    }
  }
  
  /**
   * Add organic details like texture variations
   */
  private addOrganicDetails(group: THREE.Group) {
    // Add subtle bumps or texture
    group.children.forEach(child => {
      if (child instanceof THREE.Mesh && child.geometry) {
        const positions = child.geometry.attributes.position;
        if (positions) {
          for (let i = 0; i < positions.count; i++) {
            const x = positions.getX(i);
            const y = positions.getY(i);
            const z = positions.getZ(i);
            
            const noise = (Math.sin(x * 20) * Math.cos(y * 20) * Math.sin(z * 20)) * 0.01;
            positions.setY(i, y + noise);
          }
          positions.needsUpdate = true;
          child.geometry.computeVertexNormals();
        }
      }
    });
  }
  
  /**
   * Add electronic details like LEDs and ports
   */
  private addElectronicDetails(group: THREE.Group) {
    // Add LED indicators
    const ledGeometry = new THREE.SphereGeometry(0.03, 16, 16);
    const ledMaterial = new THREE.MeshPhysicalMaterial({
      color: '#00ff00',
      emissive: '#00ff00',
      emissiveIntensity: 0.8,
      metalness: 0.0,
      roughness: 0.0
    });
    
    const led = new THREE.Mesh(ledGeometry, ledMaterial);
    led.position.set(0.3, 0.3, 0.5);
    group.add(led);
  }
  
  /**
   * Add variation-specific details
   */
  private addVariationDetails(group: THREE.Group, variation: number) {
    // Each variation has slightly different details
    if (variation === 0) {
      // Clean, minimalist version
      // Already done
    } else if (variation === 1) {
      // Add wear and tear
      group.children.forEach(child => {
        if (child instanceof THREE.Mesh && child.material) {
          const material = child.material as THREE.MeshPhysicalMaterial;
          material.roughness = Math.min(material.roughness + 0.2, 1.0);
        }
      });
    } else if (variation === 2) {
      // Premium version with extra details
      group.children.forEach(child => {
        if (child instanceof THREE.Mesh && child.material) {
          const material = child.material as THREE.MeshPhysicalMaterial;
          material.clearcoat = 0.5;
          material.clearcoatRoughness = 0.1;
        }
      });
    }
  }
  
  /**
   * Fallback analysis when AI is not available
   */
  private getFallbackAnalysis(description: string): ModelAnalysis {
    const lower = description.toLowerCase();
    
    // Try to identify common objects
    if (lower.includes('chair')) {
      return this.getChairAnalysis();
    } else if (lower.includes('car')) {
      return this.getCarAnalysis();
    } else if (lower.includes('phone')) {
      return this.getPhoneAnalysis();
    } else if (lower.includes('laptop')) {
      return this.getLaptopAnalysis();
    } else if (lower.includes('table')) {
      return this.getTableAnalysis();
    } else {
      // Generic object
      return this.getGenericAnalysis(description);
    }
  }
  
  private getChairAnalysis(): ModelAnalysis {
    return {
      name: 'Chair',
      description: 'Modern ergonomic chair',
      components: [
        {
          name: 'Seat',
          type: 'seat',
          shape: 'curved',
          position: { x: 0, y: 2, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 2, y: 0.3, z: 2 },
          material: 'fabric',
          color: '#445566',
          details: ['cushioned', 'ergonomic curve']
        },
        {
          name: 'Backrest',
          type: 'backrest',
          shape: 'curved',
          position: { x: 0, y: 3.5, z: -0.8 },
          rotation: { x: -0.2, y: 0, z: 0 },
          scale: { x: 1.8, y: 2.5, z: 0.3 },
          material: 'mesh',
          color: '#334455',
          details: ['lumbar support', 'breathable mesh']
        },
        {
          name: 'Armrest Left',
          type: 'armrest',
          shape: 'curved',
          position: { x: -1, y: 2.5, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 0.3, y: 0.5, z: 1.5 },
          material: 'plastic',
          color: '#222222',
          details: ['padded top', 'adjustable']
        },
        {
          name: 'Armrest Right',
          type: 'armrest',
          shape: 'curved',
          position: { x: 1, y: 2.5, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 0.3, y: 0.5, z: 1.5 },
          material: 'plastic',
          color: '#222222',
          details: ['padded top', 'adjustable']
        },
        {
          name: 'Base',
          type: 'base',
          shape: 'star',
          position: { x: 0, y: 0.5, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 2.5, y: 0.3, z: 2.5 },
          material: 'metal',
          color: '#888888',
          details: ['5-star base', 'wheels']
        },
        {
          name: 'Gas Cylinder',
          type: 'support',
          shape: 'cylinder',
          position: { x: 0, y: 1.25, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 0.3, y: 1.5, z: 0.3 },
          material: 'metal',
          color: '#666666',
          details: ['pneumatic', 'height adjustable']
        }
      ],
      materials: [
        {
          name: 'Fabric',
          type: 'fabric',
          color: '#445566',
          metalness: 0,
          roughness: 0.9
        },
        {
          name: 'Metal',
          type: 'metal',
          color: '#888888',
          metalness: 0.9,
          roughness: 0.2
        }
      ],
      dimensions: {
        overall: { width: 2.5, height: 4.5, depth: 2.5 },
        components: {
          seat: { width: 2, height: 0.3, depth: 2 },
          backrest: { width: 1.8, height: 2.5, depth: 0.3 }
        }
      },
      topology: {
        complexity: 'moderate',
        symmetry: 'bilateral',
        features: ['ergonomic curves', 'adjustable components', 'wheeled base']
      }
    };
  }
  
  private getCarAnalysis(): ModelAnalysis {
    return {
      name: 'Car',
      description: 'Modern sports car',
      components: [
        {
          name: 'Body',
          type: 'chassis',
          shape: 'streamlined',
          position: { x: 0, y: 1, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 4, y: 1.2, z: 2 },
          material: 'metal',
          color: '#cc0000',
          details: ['aerodynamic', 'curved surfaces']
        },
        {
          name: 'Windshield',
          type: 'window',
          shape: 'curved',
          position: { x: 0, y: 1.5, z: 0.8 },
          rotation: { x: -0.3, y: 0, z: 0 },
          scale: { x: 1.8, y: 0.8, z: 0.05 },
          material: 'glass',
          color: '#aaccff',
          details: ['tinted', 'laminated']
        }
      ],
      materials: [],
      dimensions: {
        overall: { width: 2, height: 1.5, depth: 4.5 },
        components: {}
      },
      topology: {
        complexity: 'complex',
        symmetry: 'bilateral',
        features: ['aerodynamic body', 'detailed wheels', 'realistic proportions']
      }
    };
  }
  
  private getPhoneAnalysis(): ModelAnalysis {
    return {
      name: 'Smartphone',
      description: 'Modern smartphone',
      components: [
        {
          name: 'Body',
          type: 'chassis',
          shape: 'rounded rectangle',
          position: { x: 0, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 0.7, y: 1.5, z: 0.08 },
          material: 'metal',
          color: '#222222',
          details: ['aluminum frame', 'rounded edges']
        },
        {
          name: 'Screen',
          type: 'display',
          shape: 'flat',
          position: { x: 0, y: 0, z: 0.041 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 0.65, y: 1.4, z: 0.01 },
          material: 'glass',
          color: '#000000',
          details: ['OLED display', 'edge-to-edge']
        }
      ],
      materials: [],
      dimensions: {
        overall: { width: 0.07, height: 0.15, depth: 0.008 },
        components: {}
      },
      topology: {
        complexity: 'moderate',
        symmetry: 'bilateral',
        features: ['thin profile', 'rounded corners', 'camera bump']
      }
    };
  }
  
  private getLaptopAnalysis(): ModelAnalysis {
    return {
      name: 'Laptop',
      description: 'Modern laptop computer',
      components: [
        {
          name: 'Base',
          type: 'chassis',
          shape: 'flat box',
          position: { x: 0, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 3, y: 0.2, z: 2 },
          material: 'metal',
          color: '#888888',
          details: ['aluminum unibody', 'ventilation grilles']
        },
        {
          name: 'Screen',
          type: 'display',
          shape: 'flat',
          position: { x: 0, y: 1.5, z: -0.9 },
          rotation: { x: -0.2, y: 0, z: 0 },
          scale: { x: 2.8, y: 1.8, z: 0.05 },
          material: 'glass',
          color: '#111111',
          details: ['LED backlit', 'anti-glare coating']
        },
        {
          name: 'Keyboard',
          type: 'input',
          shape: 'grid',
          position: { x: 0, y: 0.11, z: 0.3 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 2.5, y: 0.02, z: 1 },
          material: 'plastic',
          color: '#333333',
          details: ['backlit keys', 'chiclet style']
        }
      ],
      materials: [],
      dimensions: {
        overall: { width: 0.3, height: 0.02, depth: 0.2 },
        components: {}
      },
      topology: {
        complexity: 'moderate',
        symmetry: 'bilateral',
        features: ['thin profile', 'hinge mechanism', 'port array']
      }
    };
  }
  
  private getTableAnalysis(): ModelAnalysis {
    return {
      name: 'Table',
      description: 'Modern wooden dining table',
      components: [
        {
          name: 'Tabletop',
          type: 'surface',
          shape: 'flat box',
          position: { x: 0, y: 2.5, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 4, y: 0.1, z: 2.5 },
          material: 'wood',
          color: '#8B4513',
          details: ['solid wood', 'rounded edges', 'natural grain']
        },
        {
          name: 'Leg 1',
          type: 'support',
          shape: 'cylinder',
          position: { x: -1.5, y: 1.25, z: -0.75 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 0.2, y: 2.5, z: 0.2 },
          material: 'wood',
          color: '#654321',
          details: ['tapered design', 'solid construction']
        },
        {
          name: 'Leg 2',
          type: 'support',
          shape: 'cylinder',
          position: { x: 1.5, y: 1.25, z: -0.75 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 0.2, y: 2.5, z: 0.2 },
          material: 'wood',
          color: '#654321',
          details: ['tapered design', 'solid construction']
        },
        {
          name: 'Leg 3',
          type: 'support',
          shape: 'cylinder',
          position: { x: -1.5, y: 1.25, z: 0.75 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 0.2, y: 2.5, z: 0.2 },
          material: 'wood',
          color: '#654321',
          details: ['tapered design', 'solid construction']
        },
        {
          name: 'Leg 4',
          type: 'support',
          shape: 'cylinder',
          position: { x: 1.5, y: 1.25, z: 0.75 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 0.2, y: 2.5, z: 0.2 },
          material: 'wood',
          color: '#654321',
          details: ['tapered design', 'solid construction']
        }
      ],
      materials: [
        {
          name: 'Wood',
          type: 'wood',
          color: '#8B4513',
          metalness: 0,
          roughness: 0.8
        },
        {
          name: 'Dark Wood',
          type: 'wood',
          color: '#654321',
          metalness: 0,
          roughness: 0.9
        }
      ],
      dimensions: {
        overall: { width: 4, height: 2.5, depth: 2.5 },
        components: {}
      },
      topology: {
        complexity: 'simple',
        symmetry: 'quadrilateral',
        features: ['four legs', 'flat surface', 'wooden construction']
      }
    };
  }

  private getGenericAnalysis(description: string): ModelAnalysis {
    return {
      name: description.split(' ')[0] || 'Object',
      description: description,
      components: [
        {
          name: 'Main Body',
          type: 'primary',
          shape: 'complex',
          position: { x: 0, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 1, z: 1 },
          material: 'mixed',
          color: '#666666',
          details: ['detailed surface', 'realistic proportions']
        }
      ],
      materials: [
        {
          name: 'Default',
          type: 'mixed',
          color: '#666666',
          metalness: 0.5,
          roughness: 0.5
        }
      ],
      dimensions: {
        overall: { width: 1, height: 1, depth: 1 },
        components: {}
      },
      topology: {
        complexity: 'moderate',
        symmetry: 'none',
        features: ['organic shapes', 'detailed textures']
      }
    };
  }
}
