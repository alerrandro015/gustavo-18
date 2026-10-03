import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { palco } from '../lib/palco'

/**
 * A Caravan em geometria procedural.
 *
 * O brief pedia um `.glb` de Sketchfab com licença CC. Virou geometria de
 * primitivas por três motivos: o build não depende de um download externo, não
 * existe crédito para manter se o modelo sair do ar, e o arquivo pesa alguns KB
 * em vez de vários MB. Numa GPU integrada, isso é a diferença entre abrir o site
 * e engasgar nele.
 *
 * Silhueta é tudo aqui: o van precisa ser reconhecível só pela sombra, num
 * asphalt escuro, com faróis estourando.
 */
export function Caravan({ reduzido }: { reduzido: boolean }) {
  const grupo = useRef<THREE.Group>(null)
  const farolEsq = useRef<THREE.SpotLight>(null)
  const farolDir = useRef<THREE.SpotLight>(null)
  const chama = useRef<THREE.Mesh>(null)
  const sobLuz = useRef<THREE.PointLight>(null)

  const medidas = useMemo(
    () => ({
      largura: 1.9,
      altura: 1.35,
      comprimento: 4.2,
    }),
    [],
  )

  useFrame((estado) => {
    const g = grupo.current
    if (!g) return

    const presenca = palco.presenca

    // Abaixo de um fio de presença o objeto é descartado de vez. Continuar
    // desenhando um grupo encolhido a 0.001 escala ainda paga o custo de
    // vértices e rasterização, e é exatamente o que o medidor de quadro viu.
    g.visible = palco.visivel && presenca > 0.004
    if (!g.visible) return

    // A presença não é opacidade: é a van encolhendo e afundando no asfalto.
    // Metal com `transparent` resolve o sumiço, mas cria artefato de
    // ordenação entre as peças que se atravessam. Encolher e descer não tem
    // artefato nenhum e ainda conta a história de um carro que sai de cena.
    const encolhe = 0.62 + 0.38 * presenca
    g.position.x = palco.van.x
    g.position.y = palco.van.y - (1 - presenca) * 1.15
    g.position.z = palco.van.z
    g.rotation.y = palco.van.rotY
    g.rotation.x = palco.van.rotX
    g.scale.setScalar(palco.van.escala * encolhe)

    if (farolEsq.current) farolEsq.current.intensity = palco.farois * 90
    if (farolDir.current) farolDir.current.intensity = palco.farois * 90
    if (sobLuz.current) sobLuz.current.intensity = 6 + palco.nitro * 40

    if (chama.current) {
      // A chama cresce com o nitro. Com movimento reduzido ela vira uma
      // chama estática, sem tremer: o efeito some, a informação fica.
      const tremor = reduzido ? 1 : 1 + Math.sin(estado.clock.elapsedTime * 34) * 0.14

      // Cada cena diz onde a chama nasce e para que lado ela aponta.
      chama.current.position.set(palco.chama.x, palco.chama.y, palco.chama.z)
      chama.current.rotation.set(palco.chama.rotX, 0, 0)
      chama.current.visible = palco.nitro > 0.02
      chama.current.scale.set(
        0.7 + palco.nitro * 0.7,
        Math.max(0.001, palco.nitro * 3.1 * tremor),
        0.7 + palco.nitro * 0.7,
      )
    }
  })

  return (
    <group ref={grupo}>
      {/* Corpo: caixa de roda com o teto arredondado, o que dá a silhueta de
          perua sem precisar de malha detalhada. */}
      <RoundedBox
        args={[medidas.largura, medidas.altura, medidas.comprimento]}
        radius={0.34}
        smoothness={4}
      >
        <meshStandardMaterial color="#141418" metalness={0.75} roughness={0.32} />
      </RoundedBox>

      {/* Cabine e teto, mais curto que o corpo e recuado. */}
      <RoundedBox
        args={[medidas.largura - 0.06, 1.05, 2.15]}
        radius={0.3}
        smoothness={4}
        position={[0, 0.62, 0.72]}
      >
        <meshStandardMaterial color="#17171c" metalness={0.75} roughness={0.3} />
      </RoundedBox>

      {/* Vidro frontal, inclinado para trás. */}
      <mesh position={[0, 0.5, 1.83]} rotation={[-0.38, 0, 0]}>
        <boxGeometry args={[medidas.largura - 0.32, 0.62, 0.06]} />
        <meshStandardMaterial color="#05070c" metalness={0.4} roughness={0.08} />
      </mesh>

      {/* Vidros laterais. Escuros de propósito: de dia seriam um espelho
          qualquer, à noite viram dois retângulos que devolvem o neon do chão. */}
      {[-1, 1].map((lado) => (
        <mesh key={lado} position={[lado * (medidas.largura / 2 - 0.02), 0.42, 0.95]}>
          <boxGeometry args={[0.04, 0.5, 1.35]} />
          <meshStandardMaterial color="#060a10" metalness={0.5} roughness={0.1} />
        </mesh>
      ))}

      {/* Rodas: cilindro deitado no eixo X. */}
      {[
        [-1, 1.45],
        [1, 1.45],
        [-1, -1.35],
        [1, -1.35],
      ].map(([lado, z], i) => (
        <mesh
          key={i}
          position={[lado * (medidas.largura / 2 - 0.08), -0.62, z]}
          rotation={[0, 0, Math.PI / 2]}
        >
          <cylinderGeometry args={[0.52, 0.52, 0.3, 24]} />
          <meshStandardMaterial color="#0b0b0d" metalness={0.3} roughness={0.85} />
        </mesh>
      ))}

      {/* Faróis. Malha emissiva + spotlight: a malha é o que o bloom pega, o
          spotlight é o que ilumina o asfalto. */}
      {[-1, 1].map((lado) => (
        <mesh key={lado} position={[lado * 0.62, 0.12, 2.06]}>
          <sphereGeometry args={[0.19, 16, 16]} />
          <meshStandardMaterial
            color="#fff6e6"
            emissive="#ffe9c4"
            emissiveIntensity={2.4}
          />
        </mesh>
      ))}
      <spotLight
        ref={farolEsq}
        position={[-0.62, 0.1, 2.1]}
        target-position={[-0.62, -0.5, 14]}
        angle={0.42}
        penumbra={0.7}
        distance={26}
        color="#ffeccc"
      />
      <spotLight
        ref={farolDir}
        position={[0.62, 0.1, 2.1]}
        target-position={[0.62, -0.5, 14]}
        angle={0.42}
        penumbra={0.7}
        distance={26}
        color="#ffeccc"
      />

      {/* Luz de marcha ré, vermelha, atrás. */}
      <mesh position={[0, 0.05, -2.12]}>
        <boxGeometry args={[1.1, 0.12, 0.05]} />
        <meshStandardMaterial
          color="#3a0606"
          emissive="#ff1e1e"
          emissiveIntensity={1.6}
        />
      </mesh>

      {/* Chama do nitro: cone virado para trás, alongado no eixo Z. */}
      <mesh ref={chama} position={[0, 0.1, -3.4]} rotation={[-Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.55, 1.9, 20, 1, true]} />
        <meshBasicMaterial
          color="#00d0ff"
          transparent
          opacity={0.72}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <pointLight ref={sobLuz} position={[0, 0.2, -2.4]} color="#00d0ff" distance={9} />
    </group>
  )
}
