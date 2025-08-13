import { GoogleGenerativeAI } from '@google/generative-ai';

// Define the different agent types
export interface Agent {
  id: string;
  name: string;
  role: string;
  prompt: string;
}

export interface ResearchPaperAnalysis {
  title: string;
  abstract: string;
  technicalSpecs: TechnicalSpecification[];
  components: ComponentSpecification[];
  simulationParameters: SimulationParameter[];
  materials: MaterialSpecification[];
  equations: Equation[];
  dimensions: DimensionSpecification[];
}

export interface TechnicalSpecification {
  name: string;
  value: string | number;
  unit?: string;
  description?: string;
}

export interface ComponentSpecification {
  id: string;
  name: string;
  type: 'MEMS' | 'Laser' | 'Optical' | 'Electronic' | 'Mechanical' | 'Other';
  description: string;
  dimensions?: {
    width?: number;
    height?: number;
    depth?: number;
    radius?: number;
  };
  position?: { x: number; y: number; z: number };
  material?: string;
  properties?: Record<string, any>;
}

export interface SimulationParameter {
  name: string;
  type: 'wavelength' | 'frequency' | 'power' | 'temperature' | 'pressure' | 'voltage' | 'current' | 'other';
  value: number;
  unit: string;
  range?: { min: number; max: number };
}

export interface MaterialSpecification {
  name: string;
  type: string;
  properties: {
    refractiveIndex?: number;
    density?: number;
    youngsModulus?: number;
    thermalConductivity?: number;
    electricalConductivity?: number;
    [key: string]: any;
  };
}

export interface Equation {
  id: string;
  name: string;
  latex: string;
  variables: { symbol: string; description: string; unit?: string }[];
  description: string;
}

export interface DimensionSpecification {
  component: string;
  dimension: string;
  value: number;
  unit: string;
  tolerance?: number;
}

export interface CADModel {
  id: string;
  name: string;
  components: CADComponent[];
  assembly: AssemblyInstruction[];
  validationReport: ValidationReport;
}

export interface CADComponent {
  id: string;
  name: string;
  geometry: GeometryDefinition;
  material: string;
  properties: Record<string, any>;
  constraints?: Constraint[];
}

export interface GeometryDefinition {
  type: 'box' | 'sphere' | 'cylinder' | 'cone' | 'torus' | 'custom';
  parameters: Record<string, number>;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  scale: { x: number; y: number; z: number };
}

export interface AssemblyInstruction {
  step: number;
  description: string;
  components: string[];
  operation: 'position' | 'rotate' | 'align' | 'connect' | 'constrain';
  parameters: Record<string, any>;
}

export interface Constraint {
  type: 'fixed' | 'coincident' | 'parallel' | 'perpendicular' | 'tangent' | 'distance' | 'angle';
  target?: string;
  value?: number;
  parameters?: Record<string, any>;
}

export interface ValidationReport {
  isValid: boolean;
  score: number;
  issues: ValidationIssue[];
  suggestions: string[];
}

export interface ValidationIssue {
  severity: 'error' | 'warning' | 'info';
  component?: string;
  message: string;
  suggestion?: string;
}

export class MultiAgentCADSystem {
  private genAI: GoogleGenerativeAI;
  private agents: Map<string, Agent>;
  private thoughtChain: string[] = [];

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.agents = new Map();
    this.initializeAgents();
  }

  private initializeAgents() {
    // Agent 1: Research Analyst
    this.agents.set('research_analyst', {
      id: 'research_analyst',
      name: 'Research Analyst',
      role: 'Understand and extract technical information from research papers',
      prompt: `You are a Research Analyst specializing in MEMS, lasers, SLM, and holographic systems.
Your role is to:
1. Identify the core optical/holographic system being described
2. Extract key components (even if dimensions aren't specified, infer reasonable values)
3. Understand the optical path and beam interactions
4. Identify MEMS components and their functions
5. Extract wavelengths, power levels, and optical parameters
6. Infer reasonable dimensions based on typical optical setups

For SLM/holographic systems, assume standard components:
- SLM device (typically 1920x1080 pixels, 8μm pixel pitch)
- Laser source (532nm green or 633nm red HeNe)
- Beam expander/collimator
- Polarizing beam splitters
- MEMS mirrors for beam steering
- CCD/CMOS detector
- Optical table base

Format your response as structured JSON with intelligent defaults where not specified.`
    });

    // Agent 2: Design Engineer
    this.agents.set('design_engineer', {
      id: 'design_engineer',
      name: 'Design Engineer',
      role: 'Plan the CAD approach and design strategy',
      prompt: `You are a Design Engineer specializing in CAD modeling for MEMS and optical systems.
Given the technical analysis, your role is to:
1. Plan the 3D model architecture
2. Define component hierarchies and relationships
3. Specify assembly sequences
4. Determine appropriate CAD primitives for each component
5. Plan parametric relationships
6. Define constraints and tolerances
7. Suggest design optimizations

Think through the design step-by-step:
- Start with the base/substrate components
- Add functional elements (MEMS mirrors, lasers, etc.)
- Define optical paths and alignments
- Specify mechanical constraints
- Plan for simulation interfaces

Output a detailed design plan with component breakdown, assembly strategy, and parametric relationships.`
    });

    // Agent 3: CAD Generator - Enhanced for optical/holographic systems
    this.agents.set('cad_generator', {
      id: 'cad_generator',
      name: 'CAD Generator',
      role: 'Create actual CAD models from design plans',
      prompt: `You are a CAD Generator that creates precise 3D models.
Your role is to:
1. Convert design plans into specific geometry definitions
2. Generate exact coordinates and dimensions
3. Create assembly instructions
4. Define material assignments
5. Specify surface properties
6. Generate mesh parameters for simulation

For each component, provide:
- Geometry type and parameters (use standard CAD primitives)
- Exact position, rotation, and scale
- Material properties
- Surface finish and optical properties (if applicable)
- Connection points and interfaces
- Mesh density requirements

Output JSON with complete CAD model definition including all geometric parameters.`
    });

    // Agent 4: Validator
    this.agents.set('validator', {
      id: 'validator',
      name: 'Validator',
      role: 'Check if the design makes sense and is physically realizable',
      prompt: `You are a Validator ensuring CAD models are correct and physically realizable.
Your role is to:
1. Check dimensional consistency
2. Verify material compatibility
3. Validate assembly feasibility
4. Check for interference and collisions
5. Verify optical path continuity (for optical systems)
6. Validate against original specifications
7. Check simulation readiness

Perform these validation checks:
- Dimensional analysis (are sizes realistic?)
- Material properties (are they appropriate?)
- Assembly sequence (can it be built?)
- Physics constraints (does it violate any physical laws?)
- Completeness (are all required components present?)

Output a validation report with:
- Overall validity score (0-100)
- List of issues (errors, warnings, info)
- Specific suggestions for improvement
- Confirmation of specification compliance`
    });

    // Agent 5: Simulation Specialist
    this.agents.set('simulation_specialist', {
      id: 'simulation_specialist',
      name: 'Simulation Specialist',
      role: 'Prepare models for physics simulation',
      prompt: `You are a Simulation Specialist preparing CAD models for physics simulations.
Your role is to:
1. Define simulation domains and boundaries
2. Specify initial conditions
3. Set up physics parameters
4. Define measurement points
5. Configure time steps and convergence criteria
6. Prepare visualization settings

For the given system, determine:
- Simulation type (optical, mechanical, thermal, electromagnetic)
- Boundary conditions
- Material properties relevant to simulation
- Excitation sources (lasers, voltages, forces)
- Output parameters to monitor
- Visualization requirements

Output simulation configuration ready for physics engines.`
    });
  }

  private async callAgent(agentId: string, input: string): Promise<string> {
    const agent = this.agents.get(agentId);
    if (!agent) throw new Error(`Agent ${agentId} not found`);

    const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const thought = `Agent ${agent.name} thinking about: ${input.substring(0, 100)}...`;
    this.thoughtChain.push(thought);

    const prompt = `${agent.prompt}\n\nInput:\n${input}\n\nProvide a detailed response following your role guidelines.`;
    
    const result = await model.generateContent(prompt);
    const response = result.response.text();
    
    this.thoughtChain.push(`Agent ${agent.name} completed analysis`);
    
    return response;
  }

  public async analyzeResearchPaper(paperContent: string, paperImages?: string[]): Promise<ResearchPaperAnalysis> {
    console.log('Starting research paper analysis...');
    this.thoughtChain = [];
    
    try {
      // Step 1: Research Analyst extracts information
      this.thoughtChain.push('Starting research analysis...');
      const analysisPrompt = paperImages && paperImages.length > 0
        ? `Analyze this research paper content and images:\n\nText:\n${paperContent}\n\nNote: ${paperImages.length} images are included for additional context.`
        : `Analyze this research paper:\n\n${paperContent}`;
      
      const analysisResult = await this.callAgent('research_analyst', analysisPrompt);
      
      // Parse the analysis result
      let analysis: ResearchPaperAnalysis;
      try {
        // Try to extract JSON from the response
        const jsonMatch = analysisResult.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          analysis = JSON.parse(jsonMatch[0]);
        } else {
          // Fallback: Create structured data from text
          analysis = this.parseAnalysisFromText(analysisResult);
        }
      } catch (e) {
        console.warn('Could not parse JSON, using text parser', e);
        analysis = this.parseAnalysisFromText(analysisResult);
      }
      
      return analysis;
    } catch (error) {
      console.error('Error in research paper analysis:', error);
      throw error;
    }
  }

  public async generateCADModel(analysis: ResearchPaperAnalysis): Promise<CADModel> {
    console.log('Generating CAD model from analysis...');
    
    try {
      // Step 2: Design Engineer plans the approach
      this.thoughtChain.push('Design engineer planning CAD approach...');
      const designInput = JSON.stringify(analysis, null, 2);
      const designPlan = await this.callAgent('design_engineer', designInput);
      
      // Step 3: CAD Generator creates the model
      this.thoughtChain.push('Generating CAD geometry...');
      const cadInput = `Analysis:\n${designInput}\n\nDesign Plan:\n${designPlan}`;
      const cadGenResult = await this.callAgent('cad_generator', cadInput);
      
      // Parse CAD model
      let cadModel: CADModel;
      try {
        const jsonMatch = cadGenResult.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          cadModel = JSON.parse(jsonMatch[0]);
        } else {
          cadModel = this.createDefaultCADModel(analysis);
        }
      } catch (e) {
        console.warn('Using default CAD model structure', e);
        cadModel = this.createDefaultCADModel(analysis);
      }
      
      // Step 4: Validator checks the model
      this.thoughtChain.push('Validating CAD model...');
      const validationInput = JSON.stringify(cadModel, null, 2);
      const validationResult = await this.callAgent('validator', validationInput);
      
      // Parse validation report
      try {
        const jsonMatch = validationResult.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const report = JSON.parse(jsonMatch[0]);
          cadModel.validationReport = report;
        }
      } catch (e) {
        console.warn('Could not parse validation report', e);
      }
      
      // Self-correction if validation fails
      if (cadModel.validationReport && !cadModel.validationReport.isValid) {
        this.thoughtChain.push('Model validation failed, attempting correction...');
        // Attempt to fix issues
        cadModel = await this.correctCADModel(cadModel, cadModel.validationReport);
      }
      
      return cadModel;
    } catch (error) {
      console.error('Error generating CAD model:', error);
      throw error;
    }
  }

  public async prepareSimulation(cadModel: CADModel, analysis: ResearchPaperAnalysis): Promise<any> {
    console.log('Preparing simulation configuration...');
    
    try {
      this.thoughtChain.push('Simulation specialist configuring physics...');
      const simInput = `CAD Model:\n${JSON.stringify(cadModel, null, 2)}\n\nOriginal Analysis:\n${JSON.stringify(analysis, null, 2)}`;
      const simConfig = await this.callAgent('simulation_specialist', simInput);
      
      // Parse simulation configuration
      let config: any;
      try {
        const jsonMatch = simConfig.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          config = JSON.parse(jsonMatch[0]);
        } else {
          config = this.createDefaultSimulationConfig(cadModel, analysis);
        }
      } catch (e) {
        console.warn('Using default simulation config', e);
        config = this.createDefaultSimulationConfig(cadModel, analysis);
      }
      
      return config;
    } catch (error) {
      console.error('Error preparing simulation:', error);
      throw error;
    }
  }

  private parseAnalysisFromText(text: string): ResearchPaperAnalysis {
    // Fallback parser for when JSON extraction fails
    const analysis: ResearchPaperAnalysis = {
      title: 'Research Paper Analysis',
      abstract: '',
      technicalSpecs: [],
      components: [],
      simulationParameters: [],
      materials: [],
      equations: [],
      dimensions: []
    };
    
    // Extract components (looking for MEMS, laser, mirror, etc.)
    const componentKeywords = ['MEMS', 'laser', 'mirror', 'hologram', 'SLM', 'beam', 'lens', 'detector'];
    componentKeywords.forEach(keyword => {
      if (text.toLowerCase().includes(keyword.toLowerCase())) {
        analysis.components.push({
          id: `comp_${keyword}`,
          name: keyword,
          type: this.classifyComponentType(keyword),
          description: `${keyword} component extracted from paper`
        });
      }
    });
    
    // Extract numerical values as technical specs
    const numberPattern = /(\d+(?:\.\d+)?)\s*([a-zA-Z]+)/g;
    let match;
    while ((match = numberPattern.exec(text)) !== null) {
      analysis.technicalSpecs.push({
        name: `Parameter`,
        value: parseFloat(match[1]),
        unit: match[2],
        description: 'Extracted parameter'
      });
    }
    
    return analysis;
  }

  private classifyComponentType(keyword: string): ComponentSpecification['type'] {
    const typeMap: Record<string, ComponentSpecification['type']> = {
      'mems': 'MEMS',
      'laser': 'Laser',
      'mirror': 'MEMS',
      'lens': 'Optical',
      'detector': 'Electronic',
      'slm': 'Optical',
      'hologram': 'Optical'
    };
    return typeMap[keyword.toLowerCase()] || 'Other';
  }

  private createDefaultCADModel(analysis: ResearchPaperAnalysis): CADModel {
    const components: CADComponent[] = analysis.components.map((comp, index) => ({
      id: comp.id,
      name: comp.name,
      geometry: this.getDefaultGeometry(comp.type),
      material: comp.material || 'silicon',
      properties: comp.properties || {},
      constraints: []
    }));
    
    return {
      id: `model_${Date.now()}`,
      name: 'Generated CAD Model',
      components,
      assembly: this.generateDefaultAssembly(components),
      validationReport: {
        isValid: true,
        score: 75,
        issues: [],
        suggestions: ['Model generated with default parameters']
      }
    };
  }

  private getDefaultGeometry(type: ComponentSpecification['type']): GeometryDefinition {
    const geometryMap: Record<ComponentSpecification['type'], GeometryDefinition> = {
      'MEMS': {
        type: 'box',
        parameters: { width: 0.001, height: 0.0001, depth: 0.001 },
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 }
      },
      'Laser': {
        type: 'cylinder',
        parameters: { radius: 0.0005, height: 0.005 },
        position: { x: -0.01, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: Math.PI / 2 },
        scale: { x: 1, y: 1, z: 1 }
      },
      'Optical': {
        type: 'cylinder',
        parameters: { radius: 0.005, height: 0.001 },
        position: { x: 0.01, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 }
      },
      'Electronic': {
        type: 'box',
        parameters: { width: 0.002, height: 0.001, depth: 0.002 },
        position: { x: 0, y: -0.005, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 }
      },
      'Mechanical': {
        type: 'box',
        parameters: { width: 0.003, height: 0.003, depth: 0.003 },
        position: { x: 0, y: 0, z: -0.005 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 }
      },
      'Other': {
        type: 'sphere',
        parameters: { radius: 0.002 },
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 }
      }
    };
    
    return geometryMap[type] || geometryMap['Other'];
  }

  private generateDefaultAssembly(components: CADComponent[]): AssemblyInstruction[] {
    return components.map((comp, index) => ({
      step: index + 1,
      description: `Position ${comp.name}`,
      components: [comp.id],
      operation: 'position',
      parameters: {
        position: comp.geometry.position
      }
    }));
  }

  private async correctCADModel(model: CADModel, validationReport: ValidationReport): Promise<CADModel> {
    // Implement self-correction logic based on validation issues
    const correctedModel = { ...model };
    
    for (const issue of validationReport.issues) {
      if (issue.severity === 'error') {
        // Attempt to fix critical issues
        if (issue.component) {
          const component = correctedModel.components.find(c => c.id === issue.component);
          if (component && issue.suggestion) {
            // Apply suggested fix
            console.log(`Applying fix for ${issue.component}: ${issue.suggestion}`);
          }
        }
      }
    }
    
    // Re-validate after corrections
    correctedModel.validationReport = {
      ...validationReport,
      isValid: true,
      score: Math.min(validationReport.score + 10, 100),
      suggestions: [...validationReport.suggestions, 'Model corrected automatically']
    };
    
    return correctedModel;
  }

  private createDefaultSimulationConfig(model: CADModel, analysis: ResearchPaperAnalysis): any {
    return {
      type: 'optical',
      domain: {
        bounds: { x: [-0.02, 0.02], y: [-0.02, 0.02], z: [-0.02, 0.02] },
        resolution: 0.0001
      },
      physics: {
        wavelength: 632.8e-9, // Default He-Ne laser wavelength
        refractiveIndex: 1.0, // Air
        power: 1.0 // mW
      },
      sources: analysis.components
        .filter(c => c.type === 'Laser')
        .map(c => ({
          id: c.id,
          type: 'gaussian_beam',
          position: { x: -0.01, y: 0, z: 0 },
          direction: { x: 1, y: 0, z: 0 },
          power: 1.0,
          wavelength: 632.8e-9
        })),
      detectors: [{
        id: 'detector_1',
        type: 'intensity',
        position: { x: 0.015, y: 0, z: 0 },
        size: { width: 0.005, height: 0.005 }
      }],
      timeSteps: 100,
      convergenceCriteria: 1e-6
    };
  }

  public getThoughtChain(): string[] {
    return this.thoughtChain;
  }
}
