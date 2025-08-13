# AI-Powered CAD Tool for Research Paper Visualization

## Overview
This CAD tool allows you to upload research papers (PDFs) and automatically generate 3D CAD models based on the technical specifications described in the paper. It's specifically designed for MEMS, laser systems, and holographic displays, but works with any technical research paper.

## Features

### 🤖 Multi-Agent AI System
The tool uses a sophisticated multi-agent architecture:

1. **Research Analyst Agent**: Extracts technical specifications, dimensions, and components from your paper
2. **Design Engineer Agent**: Plans the CAD modeling approach and component relationships
3. **CAD Generator Agent**: Creates the actual 3D geometry and assembly instructions
4. **Validator Agent**: Checks physical realizability and validates the design
5. **Simulation Specialist Agent**: Prepares the model for physics simulations

### 📄 PDF Processing
- Automatic text extraction from research papers
- Image extraction for diagrams and figures
- Keyword and equation detection
- Dimension and specification parsing

### 🎨 3D CAD Visualization
- Real-time 3D rendering using Three.js
- Interactive orbit controls (zoom, pan, rotate)
- Component highlighting and selection
- Material-specific rendering (silicon, glass, metals)
- Laser beam and optical path visualization

### 💬 Interactive Chat Interface
- Ask questions about your CAD model
- Get design suggestions
- Request modifications
- Simulate specific scenarios

## How to Use

### Step 1: Upload Your Research Paper
1. Open the right sidebar by clicking the chat icon in the top navigation
2. Click the **blue PDF icon** (📄) at the bottom of the chat
3. Select your research paper PDF file
4. The system will automatically process and analyze the paper

### Step 2: Review the Analysis
- Switch to the **Analysis** tab to see:
  - Extracted components (MEMS, lasers, mirrors, etc.)
  - Technical specifications
  - AI thought process chain
  - Validation results

### Step 3: View the 3D Model
- Click the **3D View** button that appears after generation
- Use mouse to:
  - **Left click + drag**: Rotate the model
  - **Scroll wheel**: Zoom in/out
  - **Right click + drag**: Pan the view
- Click on components to see their properties

### Step 4: Run Simulations
The CAD model includes simulation-ready configurations for:
- Optical ray tracing
- MEMS actuation
- Hologram formation
- Laser beam propagation

### Step 5: Interact with the Model
- Drag the modal from the bottom toolbar onto the canvas
- Connect it to images/CAD elements by dragging from the blue port
- Ask questions about specific components
- Request design modifications

## Example Use Cases

### MEMS Mirror Arrays
Upload papers about MEMS mirror arrays to generate:
- Individual mirror elements with accurate dimensions
- Actuation mechanisms
- Array configurations
- Control electronics

### Laser Systems
For laser-based papers, the tool creates:
- Laser source components
- Beam paths
- Optical elements (lenses, mirrors)
- Detector arrays

### Holographic Displays
Papers about digital holography will generate:
- Spatial Light Modulators (SLMs)
- Reference and object beams
- Hologram recording planes
- Reconstruction optics

## Technical Specifications

### Supported File Types
- **Input**: PDF research papers
- **Images**: PNG, JPEG, GIF (for additional context)
- **Output**: Interactive 3D models

### Component Types
- MEMS devices
- Laser sources
- Optical elements (lenses, mirrors, prisms)
- Electronic components
- Mechanical structures

### Materials Library
- Silicon (for MEMS)
- Glass (optical elements)
- Metals (mirrors, structures)
- Custom materials from paper specifications

## Tips for Best Results

1. **Use papers with clear technical specifications**: The more detailed the dimensions and parameters, the more accurate the CAD model

2. **Include diagrams**: Papers with system diagrams help the AI understand component relationships

3. **Specify materials**: When materials are mentioned, the system applies appropriate visual and physical properties

4. **Check validation scores**: The validator agent provides a score (0-100) indicating model quality

## Troubleshooting

### Model not generating?
- Ensure your PDF is a technical/research paper
- Check that the API key is configured in .env file
- Try papers with more explicit dimensional specifications

### Components missing?
- The AI extracts what it can identify
- You can manually describe additional components in the chat

### Simulation not working?
- Ensure all required parameters are specified
- Check that component connections are valid
- Review the simulation configuration in the Analysis tab

## API Configuration

Make sure your `.env` file contains:
```
VITE_GEMINI_API_KEY=your_api_key_here
```

## Future Enhancements

- Export to standard CAD formats (STEP, STL, OBJ)
- Real-time physics simulation in browser
- Parametric model editing
- Multi-paper comparison and merging
- Integration with CAD software (SolidWorks, Fusion 360)

## Support

For questions or issues, please check:
- The Analysis tab for AI reasoning
- Validation reports for model issues
- Console logs for technical errors

Happy designing! 🚀
