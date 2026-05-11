import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'

export function Scene3D() {
  return (
    <div className="h-full w-full bg-gradient-to-b from-slate-100 to-slate-200">
      <Canvas camera={{ position: [5, 5, 5], fov: 50 }}>
        <color attach="background" args={['#f0f0f0']} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <mesh>
          <boxGeometry args={[2, 2, 2]} />
          <meshStandardMaterial color="#4f46e5" wireframe />
        </mesh>
        <OrbitControls enableDamping />
      </Canvas>
    </div>
  )
}
