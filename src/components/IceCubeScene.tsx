import { Suspense, useMemo, useRef } from 'react'
import { Canvas, useFrame, type ThreeEvent } from '@react-three/fiber'
import {
  ContactShadows,
  Environment,
  Float,
  Line,
  MeshTransmissionMaterial,
  RoundedBox,
  Sparkles,
  useTexture,
} from '@react-three/drei'
import * as THREE from 'three'
import type { Crack } from '../hooks/useIceBreak'

type SceneProps = {
  thaw: number
  cracks: Crack[]
  shattered: boolean
  onStrike: (xPct: number, yPct: number) => void
}

function PortraitPlane({
  shattered,
}: {
  thaw?: number
  shattered: boolean
}) {
  const texture = useTexture('/mariah/mariah-carey-ice.jpg')
  const mesh = useRef<THREE.Mesh>(null)

  if (texture.colorSpace !== THREE.SRGBColorSpace) {
    texture.colorSpace = THREE.SRGBColorSpace
  }
  useFrame((state) => {
    if (!mesh.current) return
    // Billboard so Mariah stays face-on through the spinning ice
    mesh.current.quaternion.copy(state.camera.quaternion)
    if (!shattered) {
      mesh.current.position.y = Math.sin(state.clock.elapsedTime * 0.7) * 0.045
    }
  })

  return (
    <group>
      {/* Soft backlight card so her face punches through refraction */}
      {!shattered && (
        <mesh position={[0, 0.02, -0.04]} scale={1.02}>
          <planeGeometry args={[1.72, 1.84]} />
          <meshBasicMaterial color="#d7eef5" transparent opacity={0.35} depthWrite={false} />
        </mesh>
      )}
      <mesh ref={mesh} position={[0, 0.02, 0]} scale={shattered ? 1.14 : 1}>
        <planeGeometry args={[1.78, 1.9]} />
        <meshBasicMaterial
          map={texture}
          transparent
          opacity={shattered ? 1 : 1}
          toneMapped={false}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}

function IceShard({
  position,
  rotation,
  velocity,
  angular,
  color,
  size,
}: {
  position: [number, number, number]
  rotation: [number, number, number]
  velocity: THREE.Vector3
  angular: THREE.Vector3
  color: string
  size: [number, number, number]
}) {
  const ref = useRef<THREE.Mesh>(null)
  const vel = useRef(velocity.clone())
  const ang = useRef(angular.clone())

  useFrame((_, dt) => {
    const m = ref.current
    if (!m) return
    vel.current.y -= 4.4 * dt
    m.position.addScaledVector(vel.current, dt)
    m.rotation.x += ang.current.x * dt
    m.rotation.y += ang.current.y * dt
    m.rotation.z += ang.current.z * dt
  })

  return (
    <mesh ref={ref} position={position} rotation={rotation}>
      <boxGeometry args={size} />
      <meshPhysicalMaterial
        color={color}
        transmission={0.88}
        roughness={0.1}
        thickness={0.55}
        ior={1.4}
        transparent
        opacity={0.88}
      />
    </mesh>
  )
}

function ShatterCloud() {
  const shards = useMemo(
    () =>
      Array.from({ length: 32 }, () => {
        const dir = new THREE.Vector3(
          (Math.random() - 0.5) * 2,
          Math.random() * 1.5 + 0.15,
          (Math.random() - 0.5) * 2,
        ).normalize()
        return {
          position: [
            (Math.random() - 0.5) * 1.3,
            (Math.random() - 0.5) * 1.3,
            (Math.random() - 0.5) * 1.3,
          ] as [number, number, number],
          rotation: [
            Math.random() * Math.PI,
            Math.random() * Math.PI,
            Math.random() * Math.PI,
          ] as [number, number, number],
          velocity: dir.multiplyScalar(3.8 + Math.random() * 5.8),
          angular: new THREE.Vector3(
            (Math.random() - 0.5) * 9,
            (Math.random() - 0.5) * 9,
            (Math.random() - 0.5) * 9,
          ),
          color: Math.random() > 0.72 ? '#c4a35a' : '#dff3f8',
          size: [
            0.28 + Math.random() * 0.5,
            0.16 + Math.random() * 0.4,
            0.1 + Math.random() * 0.22,
          ] as [number, number, number],
        }
      }),
    [],
  )

  return (
    <group>
      {shards.map((s, i) => (
        <IceShard key={i} {...s} />
      ))}
    </group>
  )
}

function CrackOverlay({ cracks }: { cracks: Crack[] }) {
  const segments = useMemo(() => {
    return cracks.slice(-24).flatMap((c) => {
      const x = (c.x / 100) * 2.15 - 1.075
      const y = 1.075 - (c.y / 100) * 2.15
      const len = (c.length / 100) * 2.2
      const main: [number, number, number][] = [
        [x - Math.cos(c.angle) * len * 0.35, y - Math.sin(c.angle) * len * 0.25, 1.14],
        [x + Math.cos(c.angle) * len * 0.65, y + Math.sin(c.angle) * len * 0.45, 1.14],
      ]
      const branches = c.branches.map((b) => {
        const pts: [number, number, number][] = [
          [x, y, 1.14],
          [x + Math.cos(b.angle) * b.length * 0.018, y + Math.sin(b.angle) * b.length * 0.014, 1.14],
        ]
        return pts
      })
      return [main, ...branches]
    })
  }, [cracks])

  return (
    <group>
      {segments.map((points, i) => (
        <Line key={i} points={points} color="#f7fcff" lineWidth={1.5} transparent opacity={0.92} />
      ))}
    </group>
  )
}

function IceCubeBody({
  thaw,
  cracks,
  shattered,
  onStrike,
}: SceneProps) {
  const group = useRef<THREE.Group>(null)
  const frost = Math.max(0.04, 1 - thaw / 100)

  useFrame((state) => {
    if (!group.current || shattered) return
    const t = state.clock.elapsedTime
    group.current.rotation.y = t * 0.28 + state.pointer.x * 0.45
    group.current.rotation.x = Math.sin(t * 0.42) * 0.12 + state.pointer.y * -0.25
    group.current.rotation.z = Math.sin(t * 0.2) * 0.05
  })

  const handlePointer = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    if (shattered) return
    const local = e.point.clone()
    group.current?.worldToLocal(local)
    const xPct = ((local.x + 1.15) / 2.3) * 100
    const yPct = ((1.15 - local.y) / 2.3) * 100
    onStrike(Math.min(95, Math.max(5, xPct)), Math.min(95, Math.max(5, yPct)))
  }

  if (shattered) {
    return (
      <group>
        <Float speed={1.15} rotationIntensity={0.18} floatIntensity={0.55}>
          <PortraitPlane thaw={100} shattered />
        </Float>
        <ShatterCloud />
        <Sparkles count={70} scale={6.5} size={3.2} speed={0.65} color="#c4a35a" />
      </group>
    )
  }

  return (
    <Float speed={1.35} rotationIntensity={0.12} floatIntensity={0.42}>
      <group ref={group} onPointerDown={handlePointer}>
        <PortraitPlane thaw={thaw} shattered={false} />

        <RoundedBox args={[2.45, 2.45, 2.45]} radius={0.18} smoothness={6} castShadow>
          <MeshTransmissionMaterial
            backside
            samples={8}
            resolution={512}
            transmission={1}
            roughness={0.015 + frost * 0.08}
            thickness={0.55}
            ior={1.2}
            chromaticAberration={0.02}
            anisotropy={0.08}
            distortion={0.08 + frost * 0.06}
            distortionScale={0.15}
            temporalDistortion={0.04}
            color="#f5fcff"
            attenuationColor="#b9dce8"
            attenuationDistance={4.5}
          />
        </RoundedBox>

        {/* Crisp ice rim only — keep faces clear so the photo reads */}
        <RoundedBox args={[2.45, 2.45, 2.45]} radius={0.18} smoothness={6} scale={1.018}>
          <meshPhysicalMaterial
            color="#ffffff"
            transparent
            opacity={0.02 + frost * 0.06}
            roughness={0.15}
            metalness={0}
            clearcoat={1}
            clearcoatRoughness={0.1}
          />
        </RoundedBox>

        {/* Crystal edge catch-lights */}
        <mesh rotation={[0, Math.PI / 4, 0]}>
          <torusGeometry args={[1.62, 0.016, 8, 4]} />
          <meshBasicMaterial color="#f4fbfc" transparent opacity={0.3 + frost * 0.15} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, Math.PI / 4]}>
          <torusGeometry args={[1.62, 0.012, 8, 4]} />
          <meshBasicMaterial color="#8ecad8" transparent opacity={0.22} />
        </mesh>

        <CrackOverlay cracks={cracks} />

        <Sparkles
          count={Math.floor(20 + frost * 34)}
          scale={3.4}
          size={2.4}
          speed={0.32}
          opacity={0.6}
          color="#e8f7fb"
        />
      </group>
    </Float>
  )
}

function SceneFallback() {
  return (
    <mesh rotation={[0.4, 0.6, 0]}>
      <boxGeometry args={[2.2, 2.2, 2.2]} />
      <meshStandardMaterial color="#8ecad8" transparent opacity={0.4} roughness={0.2} />
    </mesh>
  )
}

export function IceCubeScene({ thaw, cracks, shattered, onStrike }: SceneProps) {
  const warmth = thaw / 100

  return (
    <div className={`ice-cube-stage ${shattered ? 'is-shattered' : ''}`}>
      <div className="cube-atmosphere" style={{ ['--warmth' as string]: warmth }} aria-hidden="true" />
      <Canvas
        className="ice-canvas"
        dpr={[1, 1.6]}
        camera={{ position: [0, 0.15, 5.5], fov: 40 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      >
        <ambientLight intensity={0.5 + warmth * 0.3} />
        <directionalLight position={[4.5, 6, 3]} intensity={1.4} color="#f7fcff" />
        <directionalLight position={[-5, 1.5, -3]} intensity={0.6} color="#8ecad8" />
        <spotLight
          position={[0, 5.5, 2.5]}
          intensity={shattered ? 2.4 : 1.15}
          angle={0.48}
          penumbra={0.85}
          color={shattered ? '#c4a35a' : '#dff3f8'}
        />

        <Suspense fallback={<SceneFallback />}>
          <IceCubeBody thaw={thaw} cracks={cracks} shattered={shattered} onStrike={onStrike} />
          <Environment preset="night" environmentIntensity={0.55 + warmth * 0.4} />
        </Suspense>

        <ContactShadows
          position={[0, -1.6, 0]}
          opacity={0.5}
          scale={11}
          blur={2.6}
          far={4.5}
          color="#071018"
        />
      </Canvas>

      <p className="cube-hint" aria-hidden="true">
        {shattered ? 'Christmas unlocked' : 'Click the ice cube · crack her free'}
      </p>
    </div>
  )
}
