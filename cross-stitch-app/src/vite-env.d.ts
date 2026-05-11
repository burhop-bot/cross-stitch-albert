/// <reference types="vite/client" />

declare module '*.css' {
  const content: Record<string, string>
  export default content
}

// React Three Fiber JSX element types for v9+
import type {
  Color,
  AmbientLightProps,
  DirectionalLightProps,
  MeshProps,
  BoxGeometryProps,
  MeshStandardMaterialProps,
  PointLightProps,
  SpotLightProps,
  EnvironmentProps,
  OrbitControlsProps,
} from '@react-three/fiber'
import type * as THREE from 'three'

import '@react-three/fiber'

declare module 'react' {
  interface HTMLAttributes<T> {}
}

declare module '@react-three/fiber' {
  interface ThreeElements {
    // Primitives
    primitives: any
    // Lights
    ambientLight: AmbientLightProps
    directionalLight: DirectionalLightProps
    pointLight: PointLightProps
    spotLight: SpotLightProps
    rectAreaLight: any
    hemisphereLight: any
    // Cameras
    camera: any
    perspectiveCamera: any
    orthographicCamera: any
    // Materials
    meshBasicMaterial: any
    meshStandardMaterial: MeshStandardMaterialProps
    meshPhysicalMaterial: any
    meshLambertMaterial: any
    meshPhongMaterial: any
    // Geometries
    boxGeometry: { args?: BoxGeometryProps['args'] }
    sphereGeometry: any
    cylinderGeometry: any
    planeGeometry: any
    circleGeometry: any
    torusGeometry: any
    // Objects
    mesh: MeshProps
    group: any
    line: any
    lineSegments: any
    points: any
    // Helpers
    gridHelper: any
    axesHelper: any
    // Controls
    orbitControls: OrbitControlsProps
    // Environment
    environment: EnvironmentProps
    // Background
    color: { attach?: string; args?: [Color | string | THREE.Color] }
    sky: any
    fog: any
    fogExp2: any
  }
}
