'use client';


import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html, Line, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';


const shippingRoutes = [
  { from: [31.23, 121.47], to: [51.92, 4.48], color: '#fbbf24' },
  { from: [31.23, 121.47], to: [34.05, -118.24], color: '#38bdf8' },
  { from: [1.35, 103.82], to: [51.92, 4.48], color: '#2dd4bf' },
  { from: [22.3, 114.16], to: [40.71, -74], color: '#a78bfa' },
  { from: [19.07, 72.87], to: [1.35, 103.82], color: '#fb7185' },
];


const ports = [
  { name: 'Shanghai', lat: 31.23, lon: 121.47, code: 'CNSHA' },
  { name: 'Singapore', lat: 1.35, lon: 103.82, code: 'SGSIN' },
  { name: 'Rotterdam', lat: 51.92, lon: 4.48, code: 'NLRTM' },
  { name: 'Los Angeles', lat: 34.05, lon: -118.24, code: 'USLAX' },
  { name: 'Hong Kong', lat: 22.3, lon: 114.16, code: 'HKHKG' },
  { name: 'New York', lat: 40.71, lon: -74, code: 'USNYC' },
  { name: 'Mumbai', lat: 19.07, lon: 72.87, code: 'INBOM' },
];


function latLonToVector3(lat: number, lon: number, radius: number) {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = (lon * Math.PI) / 180;
  return new THREE.Vector3(
    radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  );
}


function createArcPath(from: number[], to: number[], radius: number) {
  const start = latLonToVector3(from[0], from[1], radius);
  const end = latLonToVector3(to[0], to[1], radius);
  const midpoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
  midpoint.setLength(radius + start.distanceTo(end) * 0.25);
  return new THREE.QuadraticBezierCurve3(start, midpoint, end).getPoints(64);
}


function GridLines({ radius }: { radius: number }) {
  const lines = useMemo(() => {
    const result: THREE.Vector3[][] = [];
    for (let latitude = -60; latitude <= 60; latitude += 30) {
      result.push(
        Array.from({ length: 73 }, (_, index) =>
          latLonToVector3(latitude, index * 5 - 180, radius + 0.006),
        ),
      );
    }
    for (let longitude = -150; longitude <= 180; longitude += 30) {
      result.push(
        Array.from({ length: 37 }, (_, index) =>
          latLonToVector3(index * 5 - 90, longitude, radius + 0.006),
        ),
      );
    }
    return result;
  }, [radius]);


  return lines.map((points, index) => (
    <Line key={index} points={points} color="#7dd3fc" transparent opacity={0.14} lineWidth={0.45} />
  ));
}


function Stars() {
  const positions = useMemo(() => {
    return Float32Array.from(
      { length: 1800 },
      (_, index) => ((Math.sin(index * 12.9898 + 78.233) * 43758.5453) % 1) * 15,
    );
  }, []);


  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#bae6fd" size={0.018} transparent opacity={0.55} />
    </points>
  );
}


function MovingShip({ radius }: { radius: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const curve = useMemo(
    () => new THREE.CatmullRomCurve3(createArcPath(shippingRoutes[0].from, shippingRoutes[0].to, radius)),
    [radius],
  );


  useFrame(({ clock }) => {
    meshRef.current?.position.copy(curve.getPoint((clock.getElapsedTime() * 0.06) % 1));
  });


  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[0.025, 12, 12]} />
      <meshBasicMaterial color="#fef3c7" />
      <pointLight color="#f59e0b" intensity={1.4} distance={0.45} />
    </mesh>
  );
}


function Globe() {
  const [hoveredPort, setHoveredPort] = useState<string | null>(null);
  const groupRef = useRef<THREE.Group>(null);
  const { camera } = useThree();
  const radius = 1.5;


  useEffect(() => {
    camera.position.set(0, 0, 4.2);
  }, [camera]);


  useFrame(() => {
    if (groupRef.current) groupRef.current.rotation.y += 0.0007;
  });


  return (
    <>
      <Stars />
      <group ref={groupRef} rotation={[0.08, -0.35, -0.05]}>
        <mesh>
          <sphereGeometry args={[radius, 96, 96]} />
          <meshPhysicalMaterial
            color="#075985"
            emissive="#082f49"
            emissiveIntensity={0.75}
            roughness={0.46}
            metalness={0.08}
            clearcoat={0.65}
          />
        </mesh>
        <mesh scale={1.035}>
          <sphereGeometry args={[radius, 72, 72]} />
          <meshBasicMaterial color="#38bdf8" transparent opacity={0.08} side={THREE.BackSide} />
        </mesh>
        <mesh scale={1.1}>
          <sphereGeometry args={[radius, 72, 72]} />
          <meshBasicMaterial color="#0ea5e9" transparent opacity={0.05} side={THREE.BackSide} />
        </mesh>
        <GridLines radius={radius} />


        {shippingRoutes.map((route, index) => (
          <Line
            key={index}
            points={createArcPath(route.from, route.to, radius + 0.018)}
            color={route.color}
            transparent
            opacity={0.8}
            lineWidth={1.25}
          />
        ))}


        {ports.map((port) => {
          const position = latLonToVector3(port.lat, port.lon, radius + 0.025);
          const isHovered = hoveredPort === port.code;
          return (
            <group key={port.code} position={position}>
              <mesh
                onPointerOver={(event) => {
                  event.stopPropagation();
                  setHoveredPort(port.code);
                }}
                onPointerOut={() => setHoveredPort(null)}
                scale={isHovered ? 1.4 : 1}
              >
                <sphereGeometry args={[0.035, 16, 16]} />
                <meshBasicMaterial color={isHovered ? '#fef3c7' : '#fbbf24'} />
              </mesh>
              <Html center distanceFactor={7.5} style={{ pointerEvents: 'none' }}>
                <div className="ml-12 rounded bg-slate-950/80 px-1.5 py-0.5 font-mono text-[8px] whitespace-nowrap text-sky-100">
                  {isHovered ? `${port.name} · ${port.code}` : port.code}
                </div>
              </Html>
            </group>
          );
        })}
        <MovingShip radius={radius + 0.018} />
      </group>
    </>
  );
}


export function Globe3D() {
  return (
    <div className="relative h-full w-full bg-[radial-gradient(circle_at_center,#0c4a6e_0%,#020617_48%,#000_75%)]">
      <Canvas camera={{ position: [0, 0, 4.2], fov: 46 }} gl={{ antialias: true, alpha: true }}>
        <ambientLight intensity={1.25} color="#bae6fd" />
        <directionalLight position={[4, 3, 5]} intensity={3.2} color="#f0f9ff" />
        <directionalLight position={[-4, -2, -3]} intensity={1.4} color="#0284c7" />
        <Globe />
        <OrbitControls enablePan={false} minDistance={2.6} maxDistance={6} rotateSpeed={0.45} />
      </Canvas>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/45 to-transparent" />
    </div>
  );
}



