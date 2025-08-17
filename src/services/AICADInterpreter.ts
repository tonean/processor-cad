import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export interface AICADCommand {
  action: string;
  parameters: any;
  explanation: string;
}

export class AICADInterpreter {
  private apiKey: string;
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Use AI to interpret any natural language command and generate appropriate CAD actions
   */
  public async interpretCommand(input: string, context: any = {}): Promise<AICADCommand> {
    const prompt = `You are a CAD/3D modeling AI assistant. Convert the user's natural language request into executable 3D object commands.

Current context:
${JSON.stringify(context, null, 2)}

User request: "${input}"

Respond with a JSON object containing:
1. "action": The type of action (create_object, animate, modify_property, apply_physics, etc.)
2. "parameters": Specific parameters for the action
3. "explanation": Brief explanation of what you're doing

IMPORTANT RULES:
- If there are already objects in the scene (context.objects.length > 0), DO NOT create new objects when the user says "make me a ball" or similar.
- Only create objects when the scene is empty (context.objects.length === 0).
- When the user asks to "make it bounce" or any action on "it", apply the action to existing objects, don't create new ones.

Examples:
- "make me a ball" (when scene empty) -> {"action": "create_object", "parameters": {"type": "sphere", "radius": 0.15, "color": "#3b82f6", "position": {"x": 0, "y": 0, "z": 0}}, "explanation": "Creating a blue sphere"}
- "make me a ball" (when objects exist) -> {"action": "modify_property", "parameters": {"property": "color", "value": "#3b82f6"}, "explanation": "A ball already exists in the scene"}
- "make it bounce" -> {"action": "apply_physics", "parameters": {"type": "bounce", "restitution": 0.8, "initial_velocity": {"x": 0, "y": 5, "z": 0}, "continuous": true}, "explanation": "Applying bouncing physics with continuous animation"}
- "make it red" -> {"action": "modify_property", "parameters": {"property": "color", "value": "#ff0000"}, "explanation": "Changing color to red"}
- "make it spin" -> {"action": "animate", "parameters": {"type": "rotation", "axis": "y", "speed": 0.02}, "explanation": "Adding continuous rotation around Y axis"}
- "make it bigger" -> {"action": "modify_property", "parameters": {"property": "scale", "value": 1.5}, "explanation": "Scaling object by 150%"}
- "add gravity" -> {"action": "apply_physics", "parameters": {"type": "gravity", "force": {"x": 0, "y": -9.8, "z": 0}}, "explanation": "Applying Earth gravity"}
- "make it float" -> {"action": "apply_physics", "parameters": {"type": "float", "force": {"x": 0, "y": 10, "z": 0}}, "explanation": "Applying upward force to counteract gravity"}

Be creative and interpret the user's intent. Always make animations continuous when appropriate.`;

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: prompt
              }]
            }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 500,
            }
          })
        }
      );

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      const responseText = data.candidates[0].content.parts[0].text;
      
      // Extract JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // Fallback if no JSON found
      return {
        action: 'unknown',
        parameters: {},
        explanation: 'Could not interpret command'
      };
    } catch (error) {
      console.error('Error interpreting command:', error);
      // Fallback to basic interpretation - pass context
      return this.basicInterpretation(input, context);
    }
  }

  /**
   * Basic fallback interpretation without AI
   */
  private basicInterpretation(input: string, context?: any): AICADCommand {
    const lower = input.toLowerCase();
    const hasObjects = context && context.objects && context.objects.length > 0;
    
    // Handle ball/sphere creation - but only if no objects exist
    if ((lower.includes('ball') || lower.includes('sphere')) && 
        (lower.includes('make') || lower.includes('create') || lower.includes('add'))) {
      
      // Check if we already have objects
      if (hasObjects) {
        // Don't create new ball, maybe just acknowledge existing one
        return {
          action: 'none',
          parameters: {},
          explanation: 'A ball already exists in the scene'
        };
      }
      
      return {
        action: 'create_object',
        parameters: {
          type: 'sphere',
          radius: 0.15,
          color: '#3b82f6',
          position: { x: 0, y: 0, z: 0 }  // Start at center
        },
        explanation: 'Creating a sphere'
      };
    }
    
    // Handle bounce - apply to existing objects
    if (lower.includes('bounce')) {
      return {
        action: 'apply_physics',
        parameters: {
          type: 'bounce',
          restitution: 0.8,
          initial_velocity: { x: 0, y: 5, z: 0 },
          continuous: true  // Keep continuous bouncing for better effect
        },
        explanation: 'Making object bounce continuously'
      };
    }
    
    if (lower.includes('spin') || lower.includes('rotate')) {
      return {
        action: 'animate',
        parameters: {
          type: 'rotation',
          axis: 'y',
          speed: 0.02
        },
        explanation: 'Adding rotation animation'
      };
    }
    
    return {
      action: 'unknown',
      parameters: {},
      explanation: 'Command not recognized'
    };
  }
}
