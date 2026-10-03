# STACK

Site de 18 anos do Gustavo. O site inteiro é uma noite de rua: cada rolagem é
acelerar. Fonte da direção de arte: `~/Downloads/gustavo-18-direcao-e-stack.md`.

## Base

| Papel | Escolha | Versão |
|---|---|---|
| Build | Vite | 8.x |
| UI | React + TypeScript | 19.x |
| Estilo | Tailwind CSS v4 (`@tailwindcss/vite`) | 4.x |
| Fontes | `@fontsource-variable/*` (locais, self-hosted) | — |

Rotas: página única com seções. Sem React Router — não há navegação, e hash routing
num site de uma tela só só adiciona um arquivo.

## Animação e rolagem

| Papel | Escolha |
|---|---|
| Rolagem suave | `lenis` |
| Timeline/cena/pin/parallax | `gsap` + `ScrollTrigger` + `SplitText` |
| Microinterações | `motion` |

`SplitText` é pago no plano Club do GSAP, mas desde a 3.13 todo o pacote é
gratuito, então ele entra no `gsap` normal. Não é preciso token.

## 3D

`three` + `@react-three/fiber` + `@react-three/drei` + `@react-three/postprocessing`.

O carro é **geometria procedural** (primitivas R3F), não um `.glb`. Motivo: o brief
pede um `.glb` de Sketchfab com licença CC, mas isso amarra o build a um download
externo e a um crédito que quebra se o modelo sair do ar. A geometria procedural
roda em qualquer lugar, não tem licença a gerenciar e pesa alguns KB em vez de
MB. Sem `.glb` também não existe o risco de puxar modelo de carro do filme.

Fallback obrigatório: se o WebGL não subir ou o aparelho for fraco, a cena cai
para imagem estática. Metade do tráfego desse site vai chegar por link de
WhatsApp em aparelho simples.

### Decisões que a implementação mudou

O plano original nem sempre sobreviveu ao código. O que mudou e por quê:

**Um contexto WebGL só.** A galeria deformada com `feDisplacementMap`, que é
SVG com filtro, não uma segunda cena WebGL. Dois contextos na mesma página é o
jeito mais rápido de estourar o limite de contextos WebGL do navegador, e o
segundo contexto compete com a cena principal pelo mesmo orçamento de GPU.

**A chama não tem lugar fixo.** Ela é filha do grupo da van, e nesse lugar a
carroceria a escondia: a câmera olha o van de frente e a chama saía atrás do
para-choque. Cada cena agora diz onde a chama nasce (`palco.chama`). Bug real,
medido: 49 px de azul viraram 37.826 px quando a chama passou a subir a partir
do teto.

**Presença em vez de visibilidade.** `palco.visivel` é booleano, e a van
sumia e voltava no meio da rolagem — o corte aparecia justamente na cena que
gira mais rápido. Agora `palco.presenca` vai de 0 a 1 e a van encolhe e afunda
no asfalto. Opacidade resolveria, mas metal com `transparent` cria artefato de
ordenação entre peças que se atravessam; encolher e descer não cria.

**Custo de GPU.** `dpr` limitado a 1.5 (não 2) e a aberração cromática some em
movimento reduzido. Com `dpr` alto num celular, o custo do bloom multiplica por
quatro para um ganho de nitidez que ninguém vê numa cena de escuridão e luz
estourada.

## Áudio

`howler`. Sintetizado em WebAudio, sem arquivo de áudio no repositório — o site
não deve pesar por causa de um `.mp3`. Muteado por padrão, botão no canto: browser
autoplay policy não deixa tocar som sem gesto do usuário.

O Howler não aceita `AudioBuffer` — nem nos tipos, nem em execução. O som é
sintetizado num `OfflineAudioContext`, convertido para WAV num `Blob` e só
entregue ao `Howl` como `src`. É o caminho longo, e é o que funciona.

## Conteúdo (sem back-end)

- `src/content/config.ts` — nome, datas, frase de assinatura
- `src/content/timeline.json` — linha do tempo
- `src/content/messages.json` — mural da galera

## Qualidade e deploy

- ESLint + Prettier + `tsc --noEmit`
- GitHub Actions → GitHub Pages, com `base` do Vite configurado para o path do repo
- Sem CI de Lighthouse por enquanto: o site abre com 3D e áudio, e o orçamento de
  performance já é o gargalo. Fica de fora de propósito, não por esquecimento.

### O que roda no CI, e o que ficou de fora

Rodam no CI: tipos, lint, detector de caractere corrompido, build e auditoria de
DOM. Essa última com Chromium em `--use-gl=swiftshader`, já que o runner não tem
GPU.

As auditorias de **pixel** (`shots`, `van`) ficaram de fora do CI de propósito.
Sob rasterização por software o bloom não produz o mesmo brilho, então um número
de brilho medido no runner seria comparável só consigo mesmo — verde no CI e
fraco em casa, ou o contrário, sem que nada esteja errado. Elas rodam na máquina.

Isso vale para a medição de tempo também: sob SwiftShader a página desce para
poucos quadros por segundo, e medir a curva de uma animação nesse regime mede o
rasterizador, não a animação. Daí `medir-palco.mjs` desligar o WebGL antes de
medir tempo.

## Verificação

Quatro ferramentas, cada uma respondendo uma pergunta que a anterior não responde:

| Script | Pergunta |
| --- | --- |
| `check-corrupcao.py` | Entrou caractere corrompido no fonte? |
| `auditar-dom.mjs` | Tem `overflow`, texto do tamanho errado, fonte errada? |
| `medir-palco.mjs` | A pose da van está certa em cada cena? A transição tem degrau? |
| `auditar-van.mjs` | A cena 3D está desenhando? O neon está aceso? |

Duas regras que vieram de teste falso, e que valem para qualquer auditoria aqui:

**Um teste que passa sem testar nada é pior que um teste quebrado.** A auditoria
da van chegou a passar com o WebGL desligado de propósito: sem canvas, o texto da
página já produzia pixels claros. Hoje ela exige a existência do canvas antes de
dizer qualquer coisa.

**Escolha a ordem certa de medições.** "Nitro apagou em 66 ms" apontava um bug
que não existia: o amostrador começava a contar antes do clique. E "presença
pulou 0.38" apontava um corte que não existia: com scroll saltando e amostras a
90 ms, um `power2` de 0.7 s move isso mesmo entre amostras. O que separa corte de
transição é ler **por quadro, com o gatilho disparando sozinho** — aí a resposta
foi 0.104 por quadro, sem degrau.

## Estrutura

```
site/
  src/
    scenes/     uma pasta por cena, na ordem do filme
    components/ aurora, preloader, nitro, mural, cursor...
    content/    config.ts, timeline.json, messages.json
    lib/        lenis, gsap, áudio, hooks
```
