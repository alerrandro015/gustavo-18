import { Suspense, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { EffectComposer, Bloom, ChromaticAberration } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import * as THREE from 'three'
import { Caravan } from './Caravan'
import { palco } from '../lib/palco'

/** Câmera: fica parada no palco e só respira com o cursor. */
function Camera() {
  useFrame(({ camera, pointer }, delta) => {
    const suave = 1 - Math.pow(0.001, delta)
    const alvoX = palco.camera.x * 0.9 + pointer.x * 0.35
    const alvoY = palco.camera.y * 0.5 + pointer.y * 0.2
    camera.position.x += (alvoX - camera.position.x) * suave
    camera.position.y += (alvoY - camera.position.y) * suave
    camera.lookAt(0, 0.4, 0)
  })
  return null
}

/**
 * O chão molhado. Um plano escuro só não dá referência de movimento quando a
 * van entra na cena, então o gradiente radial sob o carro é o que vende o
 * asfalto refletindo o neon.
 */
function Asfalto() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.1, 0]}>
      <planeGeometry args={[80, 80]} />
      <meshStandardMaterial color="#07070a" metalness={0.5} roughness={0.72} />
    </mesh>
  )
}

/** Faixas da pista se afastando para o horizonte, para a cena ter direção. */
function Pista() {
  const tracado = useMemo(() => {
    const items: { pos: [number, number, number] }[] = []
    for (let i = 0; i < 26; i++) {
      const z = -i * 4 - 6
      items.push({ pos: [0, -1.08, z] })
    }
    return items
  }, [])

  return (
    <group>
      {tracado.map((t, i) => (
        <mesh key={i} position={t.pos}>
          <boxGeometry args={[0.22, 0.02, 2.1]} />
          <meshStandardMaterial
            color="#2a2a30"
            emissive="#3a3a44"
            emissiveIntensity={0.35}
          />
        </mesh>
      ))}
    </group>
  )
}

export function Stage({ reduzido }: { reduzido: boolean }) {
  // Aberração cromática quase imperceptível em repouso: só aparece quando a
  // cena acelera. Em movimento reduzido fica zerada.
  const desvio = useMemo(() => new THREE.Vector2(0.0006, 0.0004), [])

  return (
    <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
      <Canvas
        // Teto de 1.5 e não 2: em tela de celular um dpr alto multiplica
        // por quatro o custo do bloom, e a diferença de nitidez ninguém vê
        // numa cena que é escuridão e luz estourada.
        dpr={reduzido ? 1 : [1, 1.5]}
        gl={{ antialias: !reduzido, powerPreference: 'high-performance' }}
        camera={{ position: [0, 1.4, 8.5], fov: 42, near: 0.1, far: 60 }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping
          gl.toneMappingExposure = 1.05
        }}
      >
        <Suspense fallback={null}>
          <color attach="background" args={['#050506']} />
          <fog attach="fog" args={['#050506', 12, 42]} />

          <Camera />
          <Asfalto />
          <Pista />
          <Caravan reduzido={reduzido} />

          <EffectComposer enableNormalPass={false}>
            <Bloom
              intensity={reduzido ? 0.75 : 1.15}
              resolutionScale={reduzido ? 0.4 : 0.75}
              luminanceThreshold={0.55}
              luminanceSmoothing={0.3}
              mipmapBlur
            />
            {/* Aberração cromática só entra em movimento normal. Ela é um
                passe extra sobre a imagem inteira, e é o primeiro coisa a
                cair quando o aparelho não dá conta. */}
            {!reduzido && (
              <ChromaticAberration
                blendFunction={BlendFunction.NORMAL}
                offset={desvio}
                radialModulation={false}
                modulationOffset={0}
              />
            )}
          </EffectComposer>
        </Suspense>
      </Canvas>
    </div>
  )
}
