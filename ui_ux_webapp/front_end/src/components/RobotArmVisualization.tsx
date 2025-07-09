/* RobotArmVisualization.tsx
   • Acepta 0-300 °
   • DIR para invertir giro
   • OFFSET para desfase mecánico
   • Wireframe-fade de arranque (1 s)
   • Colisión simple (si y < 0 ⇒ alerta)
   • Ejes XYZ más visibles (len 4, elev 0.35 m)
*/

import React, { useRef, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import * as THREE from "three";

/* ---------- Tipos ---------- */
interface ArmPosition { base:number; hombro:number; codo:number; gripper:number; }
interface ArmStatus   { connected:boolean; moving:boolean; emergency:boolean; }
interface Props       { position:ArmPosition; status:ArmStatus; }

/* ---------- Configuración ---------- */
const DIR:Record<keyof ArmPosition,1|-1> = { base:1, hombro:-1, codo:-1, gripper:-1 };
const OFFSET:Record<keyof ArmPosition,number> = { base:+20, hombro:-86, codo:+5, gripper:0 };
const toRad = (j:keyof ArmPosition,d:number)=>
  THREE.MathUtils.degToRad(((d-OFFSET[j])-150)*DIR[j]);

/* ---------- Brazo ---------- */
const RobotArm = ({ position, status }:Props) => {
  const base=useRef<THREE.Group>(null), shoulder=useRef<THREE.Group>(null), elbow=useRef<THREE.Group>(null);
  const gL=useRef<THREE.Mesh>(null), gR=useRef<THREE.Mesh>(null);

  /* materiales compartidos para fade-in */
  const solidMat=useRef(new THREE.MeshStandardMaterial({ color:"#334155", metalness:.8, roughness:.15, wireframe:true, transparent:true, opacity:0 }));
  const jointMat=useRef(new THREE.MeshStandardMaterial({ color:"#06b6d4", emissive:"#06b6d4", emissiveIntensity:.3, metalness:.95, roughness:.05, wireframe:true, transparent:true, opacity:0 }));
  const gripMat =useRef(new THREE.MeshStandardMaterial({ color:"#1e293b", metalness:.85, roughness:.2, wireframe:true, transparent:true, opacity:0 }));

  const fade=useRef(0); const FADE=1.2;                 // seg

  useFrame((_,dt)=>{
    const k=.1;
    base.current && (base.current.rotation.y=THREE.MathUtils.lerp(base.current.rotation.y,toRad("base",position.base),k));
    shoulder.current && (shoulder.current.rotation.z=THREE.MathUtils.lerp(shoulder.current.rotation.z,toRad("hombro",position.hombro),k));
    elbow.current && (elbow.current.rotation.z=THREE.MathUtils.lerp(elbow.current.rotation.z,toRad("codo",position.codo),k));
    if(gL.current&&gR.current){
      const a=THREE.MathUtils.degToRad(position.gripper*0.45);
      gL.current.rotation.z=THREE.MathUtils.lerp(gL.current.rotation.z,a,k);
      gR.current.rotation.z=THREE.MathUtils.lerp(gR.current.rotation.z,-a,k);
    }

    /* fade-in */
    if(fade.current<1){
      fade.current=Math.min(1,fade.current+dt/FADE);
      const op=fade.current;
      [solidMat.current,jointMat.current,gripMat.current].forEach(m=>{ m.opacity=op; m.wireframe=op<0.98; });
    }

    /* colisión simple */
    const alert = checkCollision([base,shoulder,elbow]);
    const col = alert?"#dc2626":"#06b6d4";
    jointMat.current.color.set(col); jointMat.current.emissive.set(col);
  });

  return (
    <group ref={base}>
      {/* Base */}
      <mesh castShadow material={jointMat.current}>
        <cylinderGeometry args={[1.8,1.8,0.6,32]} />
      </mesh>

      {/* Hombro */}
      <group ref={shoulder} position={[0,0.6,0]}>
        <mesh castShadow material={jointMat.current}>
          <sphereGeometry args={[0.5,32,32]} />
        </mesh>

        {/* Brazo sup */}
        <mesh position={[0,1.2,0]} castShadow material={solidMat.current}>
          <cylinderGeometry args={[0.25,0.25,2.4,16]} />
        </mesh>

        {/* Codo */}
        <group ref={elbow} position={[0,2.4,0]}>
          <mesh castShadow material={jointMat.current}>
            <sphereGeometry args={[0.4,32,32]} />
          </mesh>

          {/* Antebrazo */}
          <mesh position={[0,1,0]} castShadow material={solidMat.current}>
            <cylinderGeometry args={[0.2,0.2,2,16]} />
          </mesh>

          {/* Gripper */}
          <group position={[0,2,0]}>
            <mesh castShadow material={jointMat.current}>
              <sphereGeometry args={[0.3,32,32]} />
            </mesh>

            <mesh position={[0,0.3,0]} material={gripMat.current}>
              <boxGeometry args={[0.3,0.2,0.3]} />
            </mesh>

            <mesh ref={gL} position={[0.15,0.4,0]} castShadow material={gripMat.current}>
              <boxGeometry args={[0.1,0.25,0.15]} />
            </mesh>
            <mesh ref={gR} position={[-0.15,0.4,0]} castShadow material={gripMat.current}>
              <boxGeometry args={[0.1,0.25,0.15]} />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  );
};

/* --- colisión básica: cualquier junta con y < 0 --- */
function checkCollision(refs:React.RefObject<THREE.Object3D>[]) {
  return refs.some(r=>{
    if(!r.current) return false;
    const p=new THREE.Vector3(); r.current.getWorldPosition(p);
    return p.y<0;
  });
}

/* ---------- Helpers: grid, floor, ejes ---------- */
const HelperScene = ({ status }:{status:ArmStatus})=>{
  const [dark,setDark]=useState(false);
  useEffect(()=>{
    const mq=window.matchMedia("(prefers-color-scheme: dark)");
    setDark(mq.matches); const h=(e:MediaQueryListEvent)=>setDark(e.matches);
    mq.addEventListener("change",h); return()=>mq.removeEventListener("change",h);
  },[]);
  const gridCol=status.moving?"#f59e0b":dark?"#4b5563":"#9ca3af";
  const centerCol=dark?"#6b7280":"#d1d5db";
  const floorCol=dark?"#1f2937":"#e5e7eb";

  return(
    <>
      {/* Ejes XYZ visibles */}
      <axesHelper args={[4]} position={[0,0.35,0]} scale={[1, 1, -1]}/>

      <gridHelper args={[24,24,new THREE.Color(gridCol),new THREE.Color(centerCol)]}
                  position={[0,-0.5,0]} />
      <mesh rotation={[-Math.PI/2,0,0]} position={[0,-0.5,0]} receiveShadow>
        <planeGeometry args={[30,30]} />
        <meshStandardMaterial color={floorCol} metalness={.1} roughness={.5} />
      </mesh>
    </>
  );
};

/* ---------- Canvas principal ---------- */
export const RobotArmVisualization = ({ position, status }:Props)=>(
  <Canvas camera={{ position:[6,6,6], fov:50 }} shadows gl={{ antialias:true }}
          className="bg-gradient-to-br from-[hsl(210_20%_98%)] to-[hsl(210_20%_92%)]
                     dark:from-[hsl(220_10%_8%)] dark:to-[hsl(220_10%_4%)] transition-colors">
    {/* Luces */}
    <ambientLight intensity={0.5}/>
    <directionalLight position={[10,15,10]} intensity={1.5} castShadow
                      shadow-mapSize-width={1024} shadow-mapSize-height={1024}/>
    <pointLight position={[-10,-10,-5]} intensity={0.5} color="#06b6d4"/>

    {/* Modelo + helpers */}
    <RobotArm position={position} status={status}/>
    <HelperScene status={status}/>

    {/* Cámara */}
    <OrbitControls enablePan enableZoom enableRotate
                   maxDistance={20} minDistance={4}
                   maxPolarAngle={Math.PI/2} minPolarAngle={Math.PI/6}/>
    <Environment preset="studio"/>
  </Canvas>
);
