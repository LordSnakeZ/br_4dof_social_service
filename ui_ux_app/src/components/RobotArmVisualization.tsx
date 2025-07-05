
import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import * as THREE from 'three';

interface ArmPosition {
  base: number;
  shoulder: number;
  elbow: number;
  gripper: number;
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
  const gripperRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (baseRef.current) {
      baseRef.current.rotation.y = THREE.MathUtils.degToRad(position.base);
    }
    if (shoulderRef.current) {
      shoulderRef.current.rotation.z = THREE.MathUtils.degToRad(position.shoulder);
    }
    if (elbowRef.current) {
      elbowRef.current.rotation.z = THREE.MathUtils.degToRad(position.elbow);
    }
    if (gripperRef.current) {
      gripperRef.current.rotation.z = THREE.MathUtils.degToRad(position.gripper);
    }
  });

  const jointColor = status.emergency ? '#ef4444' : status.moving ? '#f59e0b' : '#06b6d4';
  const emissiveIntensity = status.moving ? 0.4 : 0.2;

  return (
    <group ref={baseRef}>
      {/* Base */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[1.8, 1.8, 0.6, 20]} />
        <meshStandardMaterial 
          color={jointColor} 
          emissive={jointColor} 
          emissiveIntensity={emissiveIntensity}
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>

      <group ref={shoulderRef} position={[0, 0.6, 0]}>
        {/* Shoulder Joint */}
        <mesh>
          <sphereGeometry args={[0.5, 20, 20]} />
          <meshStandardMaterial 
            color={jointColor} 
            emissive={jointColor} 
            emissiveIntensity={emissiveIntensity}
            metalness={0.9}
            roughness={0.1}
          />
        </mesh>

        {/* Upper Arm */}
        <mesh position={[0, 1.2, 0]}>
          <cylinderGeometry args={[0.25, 0.25, 2.4, 12]} />
          <meshStandardMaterial color="#475569" metalness={0.7} roughness={0.2} />
        </mesh>

        <group ref={elbowRef} position={[0, 2.4, 0]}>
          {/* Elbow Joint */}
          <mesh>
            <sphereGeometry args={[0.4, 20, 20]} />
            <meshStandardMaterial 
              color={jointColor} 
              emissive={jointColor} 
              emissiveIntensity={emissiveIntensity}
              metalness={0.9}
              roughness={0.1}
            />
          </mesh>

          {/* Forearm */}
          <mesh position={[0, 1, 0]}>
            <cylinderGeometry args={[0.2, 0.2, 2, 12]} />
            <meshStandardMaterial color="#475569" metalness={0.7} roughness={0.2} />
          </mesh>

          <group ref={gripperRef} position={[0, 2, 0]}>
            {/* Gripper Joint */}
            <mesh>
              <sphereGeometry args={[0.3, 20, 20]} />
              <meshStandardMaterial 
                color={jointColor} 
                emissive={jointColor} 
                emissiveIntensity={emissiveIntensity}
                metalness={0.9}
                roughness={0.1}
              />
            </mesh>

            {/* Gripper End Effector */}
            <mesh position={[0, 0.4, 0]}>
              <boxGeometry args={[0.4, 0.3, 0.4]} />
              <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.3} />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  );
};

export const RobotArmVisualization = ({ position, status }: Props) => {
  return (
    <Canvas
      camera={{ position: [6, 6, 6], fov: 50 }}
      className="bg-gradient-to-b from-slate-950 to-slate-900"
    >
      <ambientLight intensity={0.3} />
      <directionalLight position={[10, 10, 5]} intensity={1.2} castShadow />
      <pointLight position={[-10, -10, -5]} intensity={0.4} color="#06b6d4" />
      
      <RobotArm position={position} status={status} />
      
      <OrbitControls 
        enablePan={true} 
        enableZoom={true} 
        enableRotate={true}
        maxDistance={20}
        minDistance={4}
        maxPolarAngle={Math.PI / 2}
      />
      
      <Environment preset="city" />
      
      {/* Modern Grid */}
      <gridHelper args={[24, 24, '#334155', '#1e293b']} />
    </Canvas>
  );
};
