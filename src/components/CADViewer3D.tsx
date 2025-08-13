import React, { useRef, useEffect, useState, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Grid, Box, Cylinder, Sphere, Cone, Torus, Line, Text, PerspectiveCamera, RoundedBox, MeshDistortMaterial, MeshWobbleMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { CADModel, CADComponent, GeometryDefinition } from '../services/MultiAgentCAD';

interface CADViewer3DProps {
  model?: CADModel;
  simulationData?: any;
  isSimulating?: boolean;
  isDarkMode?: boolean;
  onComponentClick?: (component: CADComponent) => void;
}

// Component for rendering individual CAD components
function CADComponentMesh({ 
  component, 
  onClick,
  isHighlighted = false 
}: { 
  component: CADComponent; 
  onClick?: () => void;
  isHighlighted?: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  // Safety check - return null if component is invalid
  if (!component || !component.geometry) {
    console.warn('Invalid component passed to CADComponentMesh:', component);
    return null;
  }

  useFrame((state) => {
    if (meshRef.current && isHighlighted) {
      meshRef.current.rotation.y += 0.01;
    }
  });

  const geometry = component.geometry;
  
  // Add safety checks and default values
  const position = new THREE.Vector3(
    geometry?.position?.x || 0,
    geometry?.position?.y || 0,
    geometry?.position?.z || 0
  );
  const rotation = new THREE.Euler(
    geometry?.rotation?.x || 0,
    geometry?.rotation?.y || 0,
    geometry?.rotation?.z || 0
  );
  const scale = new THREE.Vector3(
    geometry?.scale?.x || 1,
    geometry?.scale?.y || 1,
    geometry?.scale?.z || 1
  );

  // Enhanced material based on component type with better visual properties
  const getMaterial = () => {
    const baseProps = {
      color: hovered ? '#ff6b6b' : (isHighlighted ? '#4dabf7' : '#868e96'),
      metalness: 0.4,
      roughness: 0.3,
      envMapIntensity: 0.8,
    };

    if (component.material === 'silicon') {
      return { 
        ...baseProps, 
        color: hovered ? '#ff8a80' : '#4a5568',
        metalness: 0.6,
        roughness: 0.2,
        clearcoat: 0.3,
        clearcoatRoughness: 0.4
      };
    } else if (component.material === 'glass' || component.name.toLowerCase().includes('lens')) {
      return { 
        ...baseProps, 
        color: '#cfe8fc',
        transparent: true,
        opacity: 0.7,
        metalness: 0.0,
        roughness: 0.0,
        transmission: 0.9,
        thickness: 0.5,
        ior: 1.5
      };
    } else if (component.name.toLowerCase().includes('laser')) {
      return { 
        ...baseProps, 
        color: '#ff1744',
        emissive: '#ff1744',
        emissiveIntensity: 0.8,
        metalness: 0.8,
        roughness: 0.1
      };
    } else if (component.name.toLowerCase().includes('mems') || component.name.toLowerCase().includes('mirror')) {
      return { 
        ...baseProps, 
        color: '#e0e0e0',
        metalness: 0.95,
        roughness: 0.05,
        envMapIntensity: 1.5
      };
    } else if (component.name.toLowerCase().includes('detector')) {
      return {
        ...baseProps,
        color: '#1a237e',
        metalness: 0.3,
        roughness: 0.6
      };
    }
    return baseProps;
  };

  const materialProps = getMaterial();

  const renderGeometry = () => {
    const params = geometry.parameters;
    
    switch (geometry.type) {
      case 'box':
        // Use RoundedBox for smoother edges
        return (
          <RoundedBox
            ref={meshRef}
            args={[params.width || 1, params.height || 1, params.depth || 1]}
            radius={0.005}
            smoothness={4}
            position={position}
            rotation={rotation}
            scale={scale}
            onClick={onClick}
            onPointerOver={() => setHovered(true)}
            onPointerOut={() => setHovered(false)}
          >
            <meshPhysicalMaterial {...materialProps} />
          </RoundedBox>
        );
      
      case 'cylinder':
        return (
          <Cylinder
            ref={meshRef}
            args={[params.radius || 0.5, params.radius || 0.5, params.height || 1, 64]}
            position={position}
            rotation={rotation}
            scale={scale}
            onClick={onClick}
            onPointerOver={() => setHovered(true)}
            onPointerOut={() => setHovered(false)}
          >
            <meshPhysicalMaterial {...materialProps} />
          </Cylinder>
        );
      
      case 'sphere':
        return (
          <Sphere
            ref={meshRef}
            args={[params.radius || 0.5, 64, 64]}
            position={position}
            rotation={rotation}
            scale={scale}
            onClick={onClick}
            onPointerOver={() => setHovered(true)}
            onPointerOut={() => setHovered(false)}
          >
            <meshPhysicalMaterial {...materialProps} />
          </Sphere>
        );
      
      case 'cone':
        return (
          <Cone
            ref={meshRef}
            args={[params.radius || 0.5, params.height || 1, 64]}
            position={position}
            rotation={rotation}
            scale={scale}
            onClick={onClick}
            onPointerOver={() => setHovered(true)}
            onPointerOut={() => setHovered(false)}
          >
            <meshPhysicalMaterial {...materialProps} />
          </Cone>
        );
      
      case 'torus':
        return (
          <Torus
            ref={meshRef}
            args={[params.radius || 1, params.tube || 0.3, 32, 200]}
            position={position}
            rotation={rotation}
            scale={scale}
            onClick={onClick}
            onPointerOver={() => setHovered(true)}
            onPointerOut={() => setHovered(false)}
          >
            <meshPhysicalMaterial {...materialProps} />
          </Torus>
        );
      
      default:
        // Default to rounded box for custom or unknown types
        return (
          <RoundedBox
            ref={meshRef}
            args={[1, 1, 1]}
            radius={0.005}
            smoothness={4}
            position={position}
            rotation={rotation}
            scale={scale}
            onClick={onClick}
            onPointerOver={() => setHovered(true)}
            onPointerOut={() => setHovered(false)}
          >
            <meshPhysicalMaterial {...materialProps} />
          </RoundedBox>
        );
    }
  };

  return (
    <group>
      {renderGeometry()}
      {hovered && (
        <Text
          position={[position.x, position.y + 0.002, position.z]}
          fontSize={0.001}
          color="white"
          anchorX="center"
          anchorY="bottom"
        >
          {component.name}
        </Text>
      )}
    </group>
  );
}

// Laser beam visualization
function LaserBeam({ start, end, color = '#ff0000' }: { start: THREE.Vector3; end: THREE.Vector3; color?: string }) {
  const points = [start, end];
  
  return (
    <Line
      points={points}
      color={color}
      lineWidth={2}
      transparent
      opacity={0.8}
    />
  );
}

// Simulation visualization overlay
function SimulationOverlay({ simulationData }: { simulationData: any }) {
  if (!simulationData) return null;

  return (
    <group>
      {/* Render laser beams */}
      {simulationData.sources?.map((source: any, index: number) => (
        <LaserBeam
          key={`laser-${index}`}
          start={new THREE.Vector3(source.position.x, source.position.y, source.position.z)}
          end={new THREE.Vector3(
            source.position.x + source.direction.x * 0.02,
            source.position.y + source.direction.y * 0.02,
            source.position.z + source.direction.z * 0.02
          )}
        />
      ))}
      
      {/* Render detector planes */}
      {simulationData.detectors?.map((detector: any, index: number) => (
        <Box
          key={`detector-${index}`}
          args={[detector.size.width, detector.size.height, 0.0001]}
          position={[detector.position.x, detector.position.y, detector.position.z]}
        >
          <meshStandardMaterial color="#00ff00" transparent opacity={0.3} />
        </Box>
      ))}
    </group>
  );
}

// Main 3D CAD Viewer Component
export const CADViewer3D: React.FC<CADViewer3DProps> = ({
  model,
  simulationData,
  isSimulating = false,
  isDarkMode = false,
  onComponentClick
}) => {
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);

  // Safety check - return early if model is invalid
  if (!model) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500 dark:text-gray-400">No CAD model to display</p>
      </div>
    );
  }

  const handleComponentClick = (component: CADComponent) => {
    setSelectedComponent(component.id);
    onComponentClick?.(component);
  };

  return (
    <div className="w-full h-full rounded-lg overflow-hidden">
      <Canvas
        camera={{ position: [0.02, 0.02, 0.04], fov: 50 }}
        style={{ background: 'transparent' }}
        gl={{ alpha: true, antialias: true, preserveDrawingBuffer: true }}
      >
        <Suspense fallback={null}>
          {/* Enhanced Lighting Setup */}
          <ambientLight intensity={0.4} />
          <directionalLight 
            position={[10, 10, 5]} 
            intensity={1.2}
            castShadow
            shadow-mapSize={[2048, 2048]}
          />
          <directionalLight position={[-5, 5, -5]} intensity={0.5} />
          <pointLight position={[-10, -10, -5]} intensity={0.3} />
          <spotLight
            position={[0, 10, 0]}
            angle={0.3}
            penumbra={1}
            intensity={0.5}
            castShadow
          />
          
          {/* Camera Controls */}
          <OrbitControls
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            zoomSpeed={0.5}
            panSpeed={0.5}
            rotateSpeed={0.5}
          />
          
          {/* Enhanced Grid with subtle appearance */}
          <Grid
            args={[0.1, 0.1]}
            cellSize={0.005}
            cellThickness={0.3}
            cellColor={isDarkMode ? '#333333' : '#cccccc'}
            sectionSize={0.01}
            sectionThickness={0.6}
            sectionColor={isDarkMode ? '#555555' : '#aaaaaa'}
            fadeDistance={0.15}
            fadeStrength={1}
            followCamera={false}
            infiniteGrid={true}
          />
          
          {/* Render CAD Model Components */}
          {model?.components.map((component) => (
            <CADComponentMesh
              key={component.id}
              component={component}
              onClick={() => handleComponentClick(component)}
              isHighlighted={selectedComponent === component.id}
            />
          ))}
          
          {/* Simulation Overlay */}
          {isSimulating && simulationData && (
            <SimulationOverlay simulationData={simulationData} />
          )}
          
          {/* Axes Helper */}
          <axesHelper args={[0.01]} />
        </Suspense>
      </Canvas>
      
      {/* Model Info Overlay */}
      {model && (
        <div className="absolute top-4 left-4 bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
            {model.name}
          </h3>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            <p>Components: {model.components.length}</p>
            {model.validationReport && (
              <>
                <p>Validation Score: {model.validationReport.score}%</p>
                <p className={`font-semibold ${model.validationReport.isValid ? 'text-green-600' : 'text-red-600'}`}>
                  {model.validationReport.isValid ? '✓ Valid' : '✗ Invalid'}
                </p>
              </>
            )}
          </div>
        </div>
      )}
      
      {/* Selected Component Info */}
      {selectedComponent && model && (
        <div className="absolute bottom-4 left-4 bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg max-w-xs">
          {(() => {
            const component = model.components.find(c => c.id === selectedComponent);
            if (!component) return null;
            
            return (
              <>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
                  {component.name}
                </h4>
                <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                  <p>Type: {component.geometry?.type || 'Unknown'}</p>
                  <p>Material: {component.material || 'Unknown'}</p>
                  <p>Position: ({(component.geometry?.position?.x || 0).toFixed(4)}, {(component.geometry?.position?.y || 0).toFixed(4)}, {(component.geometry?.position?.z || 0).toFixed(4)})</p>
                </div>
              </>
            );
          })()}
        </div>
      )}
      
      {/* Simulation Status */}
      {isSimulating && (
        <div className="absolute top-4 right-4 bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-semibold animate-pulse">
          Simulating...
        </div>
      )}
    </div>
  );
};
