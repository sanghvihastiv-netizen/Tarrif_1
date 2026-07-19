'use client';

import { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Sphere, Html } from '@react-three/drei';
import * as THREE from 'three';

// Sample shipping routes data
const shippingRoutes = [
  { from: [31.23, 121.47], to: [51.92, 4.48], color: '#f59e0b' }, // Shanghai -> Rotterdam
  { from: [31.23, 121.47], to: [34.05, -118.24], color: '#ef4444' }, // Shanghai -> LA
  { from: [31.23, 121.47], to: [1.35, 103.82], color: '#3b82f6' }, // Shanghai -> Singapore
  { from: [1.35, 103.82], to: [51.92, 4.48], color: '#10b981' }, // Singapore -> Rotterdam
  { from: [22.30, 114.16], to: [40.71, -74.00], color: '#8b5cf6' }, // Hong Kong -> NY
  { from: [35.68, 139.76], to: [37.77, -122.41], color: '#f59e0b' }, // Tokyo -> SF
  { from: [25.20, 55.27], to: [51.92, 4.48], color: '#ef4444' }, // Dubai -> Rotterdam
  { from: [19.07, 72.87], to: [1.35, 103.82], color: '#3b82f6' }, // Mumbai -> Singapore
];

// Major ports
const ports = [
  { name: 'Shanghai', lat: 31.23, lon: 121.47, code: 'SHA' },
  { name: 'Singapore', lat: 1.35, lon: 103.82, code: 'SIN' },
  { name: 'Rotterdam', lat: 51.92, lon: 4.48, code: 'RTM' },
  { name: 'Los Angeles', lat: 34.05, lon: -118.24, code: 'LAX' },
  { name: 'Hong Kong', lat: 22.30, lon: 114.16, code: 'HKG' },
  { name: 'New York', lat: 40.71, lon: -74.00, code: 'NYC' },
  { name: 'Tokyo', lat: 35.68, lon: 139.76, code: 'TYO' },
  { name: 'San Francisco', lat: 37.77, lon: -122.41, code: 'SFO' },
  { name: 'Dubai', lat: 25.20, lon: 55.27, code: 'DXB' },
  { name: 'Mumbai', lat: 19.07, lon: 72.87, code: 'BOM' },
];

function latLonToVector3(lat: number, lon: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * Math.PI / 180;
  const theta = lon * Math.PI / 180;
  return new THREE.Vector3(
    radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

function createArcPath(from: number[], to: number[], radius: number): THREE.Vector3[] {
  const start = latLonToVector3(from[0], from[1], radius);
  const end = latLonToVector3(to[0], to[1], radius);
  const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
  const distance = start.distanceTo(end);
  mid.setLength(radius + distance * 0.3);

  const points: THREE.Vector3[] = [];
  for (let t = 0; t <= 1; t += 0.02) {
    const point = new THREE.Vector3();
    // Quadratic bezier
    point.x = (1 - t) * (1 - t) * start.x + 2 * (1 - t) * t * mid.x + t * t * end.x;
    point.y = (1 - t) * (1 - t) * start.y + 2 * (1 - t) * t * mid.y + t * t * end.y;
    point.z = (1 - t) * (1 - t) * start.z + 2 * (1 - t) * t * mid.z + t * t * end.z;
    points.push(point);
  }
  return points;
}

function Globe() {
  const [hoveredPort, setHoveredPort] = useState<string | null>(null);
  const globeRef = useRef<THREE.Mesh>(null);
  const { camera } = useThree();

  useEffect(() => {
    camera.position.set(0, 0, 4);
  }, [camera]);

  useFrame(({ clock }) => {
    if (globeRef.current) {
      globeRef.current.rotation.y += 0.0005;
    }
  });

  const radius = 1.5;

  return (
    <group>
      {/* Stars background */}
      <Stars />

      {/* Globe */}
      <mesh ref={globeRef}>
        <sphereGeometry args={[radius, 64, 64]} />
        <meshPhongMaterial
          color="#1a1a2e"
          emissive="#0a0a15"
          emissiveIntensity={0.5}
          transparent
          opacity={0.95}
          wireframe={false}
        />
      </mesh>

      {/* Grid lines */}
      <GridLines radius={radius} />

      {/* Atmosphere glow */}
      <mesh>
        <sphereGeometry args={[radius * 1.05, 64, 64]} />
        <meshPhongMaterial
          color="#f59e0b"
          transparent
          opacity={0.05}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Ports */}
      {ports.map((port) => {
        const position = latLonToVector3(port.lat, port.lon, radius);
        const isHovered = hoveredPort === port.code;
        return (
          <group key={port.code}>
            <mesh
              position={position}
              onPointerOver={() => setHoveredPort(port.code)}
              onPointerOut={() => setHoveredPort(null)}
            >
              <sphereGeometry args={[isHovered ? 0.05 : 0.03, 16, 16]} />
              <meshPhongMaterial
                color={isHovered ? '#fbbf24' : '#f59e0b'}
                emissive={isHovered ? '#fbbf24' : '#f59e0b'}
                emissiveIntensity={isHovered ? 0.5 : 0.2}
              />
            </mesh>
            {/* Port label */}
            <Html position={position} distanceFactor={8}>
              <div className={`text-[8px] font-mono whitespace-nowrap transition-all duration-200 ${
                isHovered ? 'text-amber-400 scale-110' : 'text-gray-400'
              }`}>
                {isHovered ? `${port.name} (${port.code})` : port.code}
              </div>
            </Html>
          </group>
        );
      })}

      {/* Shipping Routes */}
      {shippingRoutes.map((route, index) => {
        const points = createArcPath(route.from, route.to, radius);
        const curve = new THREE.CatmullRomCurve3(points);
        const points2 = curve.getPoints(50);

        return (
          <line key={index}>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                args={[new Float32Array(points2.flatMap(p => [p.x, p.y, p.z])), 3]}
              />
            </bufferGeometry>
            <lineBasicMaterial color={route.color} transparent opacity={0.4} />
          </line>
        );
      })}

      {/* Pulsing ships on routes */}
      <MovingShip radius={radius} />
    </group>
  );
}

function MovingShip({ radius }: { radius: number }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      const t = (Math.sin(clock.getElapsedTime() * 0.3) + 1) / 2;
      // Use a sample route (Shanghai to Rotterdam)
      const route = shippingRoutes[0];
      const points = createArcPath(route.from, route.to, radius);
      const curve = new THREE.CatmullRomCurve3(points);
      const position = curve.getPoint(t);
      meshRef.current.position.copy(position);
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[0.015, 8, 8]} />
      <meshPhongMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={1} />
    </mesh>
  );
}

function GridLines({ radius }: { radius: number }) {
  const lines: any[] = [];
  const segments = 24;

  // Latitude lines
  for (let i = 0; i <= segments; i++) {
    const phi = (i / segments) * Math.PI;
    const points = [];
    for (let j = 0; j <= segments * 2; j++) {
      const theta = (j / (segments * 2)) * Math.PI * 2;
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.cos(phi);
      const z = radius * Math.sin(phi) * Math.sin(theta);
      points.push(new THREE.Vector3(x, y, z));
    }
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    // @ts-ignore
    lines.push(
      (<line key={`lat-${i}`}>
        <primitive object={geometry} attach="geometry" />
        <lineBasicMaterial color="#ffffff" transparent opacity={0.03} />
      </line>) as any
    );
  }

  // Longitude lines
  for (let i = 0; i < segments * 2; i++) {
    const theta = (i / (segments * 2)) * Math.PI * 2;
    const points = [];
    for (let j = 0; j <= segments; j++) {
      const phi = (j / segments) * Math.PI;
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.cos(phi);
      const z = radius * Math.sin(phi) * Math.sin(theta);
      points.push(new THREE.Vector3(x, y, z));
    }
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    // @ts-ignore
    lines.push(
      (<line key={`lon-${i}`}>
        <primitive object={geometry} attach="geometry" />
        <lineBasicMaterial color="#ffffff" transparent opacity={0.03} />
      </line>) as any
    );
  }

  return <>{lines}</>;
}

function Stars() {
  const starCount = 2000;
  const positions = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount * 3; i++) {
    positions[i] = (Math.random() - 0.5) * 50;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  return (
    <points geometry={geometry}>
      <pointsMaterial color="#ffffff" size={0.02} transparent opacity={0.6} />
    </points>
  );
}

export function Globe3D() {
  return (
    <div className="w-full h-full relative">
      <Canvas camera={{ position: [0, 0, 4] }} className="bg-black">
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={1} />
        <directionalLight position={[-5, -5, -5]} intensity={0.5} />
        <Globe />
        <OrbitControls
          enablePan={false}
          minDistance={2}
          maxDistance={8}
          autoRotate={false}
          rotateSpeed={0.5}
        />
      </Canvas>
    </div>
  );
}