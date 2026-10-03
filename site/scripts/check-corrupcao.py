#!/usr/bin/env python3
"""
Trava de segurança contra texto corrompido.

Várias vezes a escrita saiu com caracteres de outro alphabeto inseridos no meio
de palavras portuguesas. Este script varre o src e aponta qualquer caractere fora
do latin comum, alem de marcadores de corrupcao que ja apareceram antes.
"""
import sys
import pathlib
import unicodedata

ALVOS = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else "src")

# Caracteres CJK, cirilico, arabico: nunca legitimamente usados neste projeto.
PEDIDOS = []
for cp in range(0x4E00, 0x9FFF):   # CJK
    PEDIDOS.append(cp)
for cp in range(0x0400, 0x0500):   # cirilico
    PEDIDOS.append(cp)
for cp in range(0x0600, 0x0700):   # arabe
    PEDIDOS.append(cp)
for cp in range(0x3040, 0x30FF):   # kana
    PEDIDOS.append(cp)
PEDIDOS = set(PEDIDOS)

# Marcadores que apareceram na geração anterior.
SUSPEITOS = ["_reportar", "avorite", "停车", "挺", "de用在", "Approved",
             "perdeu o", "ofinal", "grew e", "covido"]

problemas = []
for caminho in sorted(ALVOS.rglob("*")):
    if caminho.suffix not in {".ts", ".tsx", ".css", ".json", ".html"}:
        continue
    if "node_modules" in caminho.parts:
        continue
    texto = caminho.read_text(encoding="utf-8", errors="replace")
    for i, linha in enumerate(texto.splitlines(), 1):
        for ch in linha:
            if ord(ch) in PEDIDOS:
                problemas.append((caminho, i, f"caractere estranho U+{ord(ch):04X} {unicodedata.name(ch,'?')}"))
        for s in SUSPEITOS:
            if s in linha:
                problemas.append((caminho, i, f"marcador de corrupcao: {s!r}"))

if problemas:
    print("CORRUPCAO ENCONTRADA:")
    for caminho, i, msg in problemas:
        print(f"  {caminho}:{i}  {msg}")
    sys.exit(1)

print(f"OK: nenhum caractere estranho em {ALVOS}")
