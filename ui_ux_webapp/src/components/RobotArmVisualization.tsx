import React, { useRef, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import * as THREE from "three";

interface ArmPosition {
  base: number;
  hombro: number;
  codo: number;
  gripper: number; // 0 = cerrado, 100 = abierto
}

interface ArmStatus {
  connected: boolean;
  moving: boolean;
  emergency: boolean;
}

interface Props {
  position: ArmPosition;
  status: ArmStatus;
}

const RobotArm = ({ position, status }: Props) => {
  const baseRef = useRef<THREE.Group>(null);
  const shoulderRef = useRef<THREE.Group>(null);
  const elbowRef = useRef<THREE.Group>(null);
  const leftGripperRef = useRef<THREE.Mesh>(null);
  const rightGripperRef = useRef<THREE.Mesh>(null);

  /* Smooth joint animation */
  useFrame(() => {
    const lerpFactor = 0.1;
    
    if (baseRef.current) {
      const targetRotation = THREE.MathUtils.degToRad(position.base);
      baseRef.current.rotation.y = THREE.MathUtils.lerp(
        baseRef.current.rotation.y,
        targetRotation,
        lerpFactor
      );
    }
    
    if (shoulderRef.current) {
      const targetRotation = THREE.MathUtils.degToRad(position.hombro);
      shoulderRef.current.rotation.z = THREE.MathUtils.lerp(
        shoulderRef.current.rotation.z,
        targetRotation,
        lerpFactor
      );
    }
    
    if (elbowRef.current) {
      const targetRotation = THREE.MathUtils.degToRad(position.codo);
      elbowRef.current.rotation.z = THREE.MathUtils.lerp(
        elbowRef.current.rotation.z,
        targetRotation,
        lerpFactor
      );
    }
    
    // Animación de apertura/cierre del gripper
    if (leftGripperRef.current && rightGripperRef.current) {
      const apertureAngle = THREE.MathUtils.degToRad(position.gripper * 0.45);
      
      leftGripperRef.current.rotation.z = THREE.MathUtils.lerp(
        leftGripperRef.current.rotation.z,
        apertureAngle,
        lerpFactor
      );
      
      rightGripperRef.current.rotation.z = THREE.MathUtils.lerp(
        rightGripperRef.current.rotation.z,
        -apertureAngle,
        lerpFactor
      );
    }
  });

  /* Joint appearance logic */
  const jointColor = status.emergency
    ? "#ef4444"
    : status.moving
    ? "#f59e0b"
    : "#06b6d4";
  
  const emissiveIntensity = status.moving ? 0.8 : 0.3;

  return (
    <group ref={baseRef}>
      {/* Base */}
      <mesh castShadow>
        <cylinderGeometry args={[1.8, 1.8, 0.6, 32]} />
        <meshStandardMaterial
          color={jointColor}
          emissive={jointColor}
          emissiveIntensity={emissiveIntensity}
          metalness={0.95}
          roughness={0.05}
        />
      </mesh>

      {/* Shoulder */}
      <group ref={shoulderRef} position={[0, 0.6, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.5, 32, 32]} />
          <meshStandardMaterial
            color={jointColor}
            emissive={jointColor}
            emissiveIntensity={emissiveIntensity}
            metalness={0.95}
            roughness={0.05}
          />
        </mesh>

        {/* Upper arm */}
        <mesh position={[0, 1.2, 0]} castShadow>
          <cylinderGeometry args={[0.25, 0.25, 2.4, 16]} />
          <meshStandardMaterial
            color="#334155"
            metalness={0.8}
            roughness={0.15}
          />
        </mesh>

        {/* Elbow */}
        <group ref={elbowRef} position={[0, 2.4, 0]}>
          <mesh castShadow>
            <sphereGeometry args={[0.4, 32, 32]} />
            <meshStandardMaterial
              color={jointColor}
              emissive={jointColor}
              emissiveIntensity={emissiveIntensity}
              metalness={0.95}
              roughness={0.05}
            />
          </mesh>

          {/* Forearm */}
          <mesh position={[0, 1, 0]} castShadow>
            <cylinderGeometry args={[0.2, 0.2, 2, 16]} />
            <meshStandardMaterial
              color="#334155"
              metalness={0.8}
              roughness={0.15}
            />
          </mesh>

          {/* Gripper Assembly */}
          <group position={[0, 2, 0]}>
            {/* Base joint del gripper */}
            <mesh castShadow>
              <sphereGeometry args={[0.3, 32, 32]} />
              <meshStandardMaterial
                color={jointColor}
                emissive={jointColor}
                emissiveIntensity={emissiveIntensity}
                metalness={0.95}
                roughness={0.05}
              />
            </mesh>
            
            {/* Mecanismo del gripper (más delgado) */}
            <mesh position={[0, 0.3, 0]}>
              <boxGeometry args={[0.3, 0.2, 0.3]} />
              <meshStandardMaterial
                color="#1e293b"
                metalness={0.85}
                roughness={0.2}
              />
            </mesh>
            
            {/* Pinza izquierda */}
            <mesh 
              ref={leftGripperRef} 
              position={[0.15, 0.4, 0]} 
              rotation={[0, 0, 0]}
              castShadow
            >
              <boxGeometry args={[0.1, 0.25, 0.15]} />
              <meshStandardMaterial
                color="#1e293b"
                metalness={0.85}
                roughness={0.2}
              />
            </mesh>
            
            {/* Pinza derecha */}
            <mesh 
              ref={rightGripperRef} 
              position={[-0.15, 0.4, 0]} 
              rotation={[0, 0, 0]}
              castShadow
            >
              <boxGeometry args={[0.1, 0.25, 0.15]} />
              <meshStandardMaterial
                color="#1e293b"
                metalness={0.85}
                roughness={0.2}
              />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  );
};

const AdaptiveScene = ({ status }: { status: ArmStatus }) => {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setDarkMode(mediaQuery.matches);
    
    const handler = (e: MediaQueryListEvent) => setDarkMode(e.matches);
    mediaQuery.addEventListener('change', handler);
    
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Colores adaptativos
  const gridColor = status.moving ? "#f59e0b" : (darkMode ? "#4b5563" : "#9ca3af");
  const centerColor = darkMode ? "#6b7280" : "#d1d5db";
  const floorColor = darkMode ? "#1f2937" : "#e5e7eb";

  return (
    <>
      {/* Grid Helper */}
      <gridHelper
        args={[24, 24, new THREE.Color(gridColor), new THREE.Color(centerColor)]}
        position={[0, -0.5, 0]}
      />
      
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial
          color={floorColor}
          metalness={0.1}
          roughness={0.5}
        />
      </mesh>
    </>
  );
};

export const RobotArmVisualization = ({ position, status }: Props) => {
  return (
    <Canvas
      camera={{ position: [6, 6, 6], fov: 50 }}
      shadows
      gl={{ antialias: true }}
      className="
        bg-gradient-to-br 
        from-[hsl(210_20%_98%)] to-[hsl(210_20%_92%)]
        dark:bg-gradient-to-br 
        dark:from-[hsl(220_10%_8%)] dark:to-[hsl(220_10%_4%)]
        transition-colors duration-300
      "
    >
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[10, 15, 10]}
        intensity={1.5}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <pointLight position={[-10, -10, -5]} intensity={0.5} color="#06b6d4" />
      
      {/* Model */}
      <RobotArm position={position} status={status} />
      
      {/* Adaptive Grid and Floor */}
      <AdaptiveScene status={status} />
      
      {/* Controls */}
      <OrbitControls
        enablePan
        enableZoom
        enableRotate
        maxDistance={20}
        minDistance={4}
        maxPolarAngle={Math.PI / 2}
        minPolarAngle={Math.PI / 6}
      />

      {/* Environment */}
      <Environment preset="studio" />
    </Canvas>
  );
};