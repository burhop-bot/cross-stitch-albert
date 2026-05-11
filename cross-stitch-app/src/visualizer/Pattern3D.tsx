import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Html, useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { useProjectStore } from '../store/projectStore'
import { getDMCHex } from '../utils/dmcColors'

interface StitchMeshProps {
  grid: number[][]
  cellSize: number
  fabricTexture: string
}

function StitchMesh({ grid, cellSize, fabricTexture }: StitchMeshProps) {
  const meshRef = useRef<THREE.Group>(null)
  
  // Create fabric texture programmatically
  const fabricCanvas = useMemo(() => {
    const canvas = document.createElement('canvas')
    const size = 256
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')!
    
    // Create Aida fabric pattern
    ctx.fillStyle = '#d4c5a9' // Natural Aida color
    ctx.fillRect(0, 0, size, size)
    
    // Draw fabric weave
    ctx.strokeStyle = '#c4b599'
    ctx.lineWidth = 1
    const holes = 16
    const holeSize = 4
    const spacing = size / holes
    
    for (let y = 0; y < holes; y++) {
      for (let x = 0; x < holes; x++) {
        const hx = x * spacing + spacing / 2
        const hy = y * spacing + spacing / 2
        ctx.fillStyle = '#b8a88a'
        ctx.fillRect(hx - holeSize/2, hy - holeSize/2, holeSize, holeSize)
      }
    }
    
    return canvas
  }, [])

  const fabricTextureMap = useMemo(() => {
    const texture = new THREE.CanvasTexture(fabricCanvas)
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    return texture
  }, [fabricCanvas])

  // Generate stitches from grid
  const stitches = useMemo(() => {
    const result: { x: number; y: number; color: string; rotation: number }[] = []
    const offset = (grid.length * cellSize) / 2
    
    for (let row = 0; row < grid.length; row++) {
      for (let col = 0; col < grid[row].length; col++) {
        const dmcColor = grid[row][col]
        if (dmcColor > 0) {
          result.push({
            x: col * cellSize - offset,
            y: -(row * cellSize) + offset,
            color: getDMCHex(dmcColor),
            rotation: (row + col) % 2 === 0 ? 0 : Math.PI / 4,
          })
        }
      }
    }
    return result
  }, [grid, cellSize])

  return (
    <group ref={meshRef}>
      {/* Fabric base */}
      <mesh position={[0, -0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[grid.length * cellSize, grid[0]?.length * cellSize || 0]} />
        <meshStandardMaterial map={fabricTextureMap} />
      </mesh>

      {/* Stitches - X shaped cross stitches */}
      {stitches.map((stitch, idx) => (
        <group key={idx} position={[stitch.x, 0, stitch.y]}>
          {/* First diagonal of X */}
          <mesh rotation={[0, 0, stitch.rotation]}>
            <boxGeometry args={[cellSize * 0.7, 0.15, 0.05]} />
            <meshStandardMaterial color={stitch.color} roughness={0.6} />
          </mesh>
          {/* Second diagonal of X */}
          <mesh rotation={[0, 0, -stitch.rotation]}>
            <boxGeometry args={[cellSize * 0.7, 0.15, 0.05]} />
            <meshStandardMaterial color={stitch.color} roughness={0.6} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

function RotatingPlate({ children }: { children: React.ReactNode }) {
  const groupRef = useRef<THREE.Group>(null)
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.3
    }
  })
  
  return <group ref={groupRef}>{children}</group>
}

export function Pattern3D() {
  const { currentGrid, show3D } = useProjectStore()
  
  if (!show3D || !currentGrid) {
    return null
  }

  const gridSize = Math.max(currentGrid.length, currentGrid[0]?.length || 1)
  const cellSize = 0.5

  return (
    <div className="absolute inset-0 bg-gradient-to-br from-slate-100 to-slate-200 z-40">
      <Canvas
        camera={{ position: [gridSize, gridSize * 0.8, gridSize], fov: 45 }}
        shadows
      >
        <color attach="background" args={['#e5e7eb']} />
        <ambientLight intensity={0.6} />
        <directionalLight
          position={[10, 10, 5]}
          intensity={1}
          castShadow
          shadow-mapSize={[1024, 1024]}
        />
        <pointLight position={[-10, -10, -5]} intensity={0.3} />
        
        <RotatingPlate>
          <StitchMesh grid={currentGrid} cellSize={cellSize} fabricTexture="" />
        </RotatingPlate>

        <OrbitControls
          enableDamping
          dampingFactor={0.05}
          minDistance={5}
          maxDistance={50}
        />
        
        <Html position={[0, gridSize + 1, 0]} center>
          <div className="bg-white/90 backdrop-blur px-4 py-2 rounded-lg shadow-lg text-sm">
            3D Preview - Drag to rotate
          </div>
        </Html>
      </Canvas>
    </div>
  )
}
