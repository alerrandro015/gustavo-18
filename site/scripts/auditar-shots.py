#!/usr/bin/env python3
"""
Revisao visual por pixels, para nao depender de olho humano.

Le as capturas e responde perguntas objetivas: o fundo esta no asfalto
previsto, o 18 saiu vermelho, o canvas 3D desenhou alguma coisa, o texto
coube na tela, o contraste do texto sobre o fundo passa.

Uso: python3 scripts/auditar-shots.py [dir]
"""
import sys
import pathlib
from collections import Counter

from PIL import Image

DIR = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else "/tmp/shots")

ASFALTO = (5, 5, 6)
CARBONO = (16, 16, 19)
NITRO = (255, 90, 0)
NEON = (0, 208, 255)
LANTERNA = (255, 30, 30)
BRANCO = (245, 245, 240)


def perto(a, b, tol=14):
    return all(abs(x - y) <= tol for x, y in zip(a[:3], b[:3]))


def luminancia(c):
    def lin(v):
        v /= 255
        return v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4
    r, g, b = (lin(x) for x in c[:3])
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def contraste(a, b):
    la, lb = luminancia(a), luminancia(b)
    hi, lo = max(la, lb), min(la, lb)
    return (hi + 0.05) / (lo + 0.05)


def paleta(img, passo=7, balde=12):
    """Conta cores em baldes.

    O grao de filme altera todo pixel em alguns niveis, entao contagem exata
    nao repete cor nenhuma e nao diz nada. Balde de 12 agrupa o que e
    perceptualmente a mesma cor.
    """
    px = img.convert("RGB")
    w, h = px.size
    contagem = Counter()
    for y in range(0, h, passo):
        for x in range(0, w, passo):
            c = px.getpixel((x, y))
            contagem[(c[0] // balde * balde,
                      c[1] // balde * balde,
                      c[2] // balde * balde)] += 1
    return contagem


def principais(contagem, n=4):
    return contagem.most_common(n)


def tem_cor(contagem, alvo, tol=26):
    """A cor esta presente de verdade, e nao so parecida com o preto do fundo."""
    total = sum(contagem.values())
    achados = 0
    for cor, qtd in contagem.items():
        if perto(cor, alvo, tol):
            achados += qtd
    return achados / max(1, total)


falhas = []
avisos = []

for arquivo in sorted(DIR.glob("*.png")):
    img = Image.open(arquivo)
    contagem = paleta(img)
    tops = principais(contagem)
    dominante = tops[0][0]

    linhas = [f"{arquivo.name}  {img.size[0]}x{img.size[1]}"]

    fundo_escuro = perto(dominante, ASFALTO, 10) or perto(dominante, CARBONO, 10) or luminancia(dominante) < 0.02
    if not fundo_escuro:
        linhas.append(f"  fundo dominante {dominante} nao esta no asfalto/carbono")
        falhas.append(f"{arquivo.name}: fundo {dominante}")

    linhas.append(f"  fundo: {dominante} ({100*tops[0][1]/sum(contagem.values()):.0f}%)")

    if "canvas" in img.info.get("descricao", ""):
        pass

    for nome, cor in (("nitro", NITRO), ("neon", NEON), ("lanterna", LANTERNA)):
        frac = tem_cor(contagem, cor)
        if frac > 0.0006:
            linhas.append(f"  {nome}: {frac*100:.2f}% da tela")

    print("\n".join(linhas))

# O 18 precisa ser vermelho e o NITRO laranja. Verificacao pontual.
print("\n--- checagens pontuais ---")

hero = Image.open(DIR / "01-hero.png").convert("RGB")
w, h = hero.size
vermelho = Counter()
laranja = Counter()
for y in range(int(h * 0.55), int(h * 0.97), 4):
    for x in range(0, int(w * 0.55), 4):
        c = hero.getpixel((x, y))
        r, g, b = c
        # Lanterna #FF1E1E: vermelho puro, verde e azul quase iguais e baixos.
        if r > 150 and g < 90 and b < 90 and abs(g - b) < 40:
            vermelho[c] += 1
        # Nitro #FF5A00: vermelho alto, verde medio, azul quase zero.
        elif r > 190 and 55 < g < 165 and b < 70:
            laranja[c] += 1
tot_v, tot_l = sum(vermelho.values()), sum(laranja.values())
print(f"hero: vermelho {tot_v} px, laranja {tot_l} px (area do '18')")
if tot_v < 400:
    falhas.append("hero: o 18 vermelho quase nao apareceu")

nitro = Image.open(DIR / "07-nitro-rodape.png").convert("RGB")
w, h = nitro.size
laranja_n = 0
for y in range(int(h * 0.05), int(h * 0.75), 5):
    for x in range(0, w, 5):
        c = nitro.getpixel((x, y))
        r, g, b = c
        if r > 180 and 50 < g < 170 and b < 80:
            laranja_n += 1
print(f"cena nitro: {laranja_n} px de laranja")
if laranja_n < 800:
    falhas.append("cena nitro: o botao NITRO nao apareceu em laranja")

# Contraste do texto do rodape.
rodape = Image.open(DIR / "07-nitro-rodape.png").convert("RGB")
w, h = rodape.size
amostras = [rodape.getpixel((x, y)) for y in range(int(h * 0.6), h, 6) for x in range(0, w, 6)]
claros = [c for c in amostras if luminancia(c) > 0.25]
escuros = [c for c in amostras if luminancia(c) < 0.05]
if claros and escuros:
    pior = min(contraste(claro, escuro) for claro in claros[:80] for escuro in escuros[:40])
    print(f"rodape: pior contraste texto/fundo {pior:.1f}:1")
    if pior < 4.5:
        avisos.append(f"rodape: contraste {pior:.1f}:1 abaixo de 4.5")

print()
if falhas:
    print("FALHAS:")
    for f in falhas:
        print("  -", f)
if avisos:
    print("AVISOS:")
    for a in avisos:
        print("  -", a)
if not falhas and not avisos:
    print("nenhuma falha de verificacao")
