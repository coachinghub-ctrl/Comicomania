#!/usr/bin/env python3
"""Deriva todos los activos de marca desde comicomania-logo.webp.
Uso: python3 generar-activos.py   (requiere Pillow)"""
from PIL import Image
import pathlib

BASE = pathlib.Path(__file__).parent
OUT = BASE / "export"; OUT.mkdir(exist_ok=True)
NEGRO = (8, 5, 6, 255)

def rojo(t): r, g, b, a = t; return a > 200 and r > 140 and g < 80 and b < 70
def oro(t):  r, g, b, a = t; return a > 200 and r > 180 and 90 < g < 235 and b < 120
def azul(t): r, g, b, a = t; return a > 200 and b > 140 and r < 120

def sin_sombra(im):
    """La sombra horneada son pixeles casi negros con alpha parcial.
    El antialias real del dibujo lleva color, asi que sobrevive."""
    im = im.copy(); p = im.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = p[x, y]
            if a < 200 and max(r, g, b) < 40:
                p[x, y] = (0, 0, 0, 0)
    return im.crop(im.getbbox())

def solo_mascaras(limpio):
    """Corta por encima de la banda de la cinta y limpia, columna por columna,
    todo lo que quede por debajo del ultimo pixel de oro de esa columna."""
    p = limpio.load(); cw, ch = limpio.size
    banda = next(y for y in range(ch)
                 if sum(1 for x in range(cw) if rojo(p[x, y])) > cw * 0.35)
    reg = limpio.crop((0, 0, cw, banda)); q = reg.load()
    margen = int(reg.height * 0.035)
    for x in range(reg.width):
        ultimo = -1
        for y in range(reg.height):
            if oro(q[x, y]) or azul(q[x, y]): ultimo = y
        corte = ultimo + margen if ultimo >= 0 else -1
        for y in range(reg.height):
            if ultimo < 0 or y > corte: q[x, y] = (0, 0, 0, 0)
    return reg.crop(reg.getbbox())

def cuadrar(img, aire=0.10):
    lado = int(max(img.size) * (1 + 2 * aire))
    o = Image.new("RGBA", (lado, lado), (0, 0, 0, 0))
    o.paste(img, ((lado - img.width) // 2, (lado - img.height) // 2)); return o

def aire(img, frac=0.07):
    p = int(max(img.size) * frac)
    o = Image.new("RGBA", (img.width + 2 * p, img.height + 2 * p), (0, 0, 0, 0))
    o.paste(img, (p, p)); return o

def guardar(img, nombre, ancho):
    img.resize((ancho, round(img.height * ancho / img.width)),
               Image.LANCZOS).save(OUT / nombre, optimize=True)

def sobre_negro(logo, size, escala):
    l = Image.new("RGBA", size, NEGRO)
    w = int(size[0] * escala); h = round(logo.height * w / logo.width)
    if h > size[1] * escala:
        h = int(size[1] * escala); w = round(logo.width * h / logo.height)
    r = logo.resize((w, h), Image.LANCZOS)
    l.paste(r, ((size[0] - w) // 2, (size[1] - h) // 2), r)
    return l.convert("RGB")

src = Image.open(BASE / "comicomania-logo.webp").convert("RGBA")
completo = src.crop(src.getbbox())
limpio = sin_sombra(src)

for w in (2160, 1080):
    guardar(aire(completo, 0.04), f"comicomania-logo-sombra-{w}.png", w)
for w in (2160, 1080, 512):
    guardar(aire(limpio), f"comicomania-logo-sin-sombra-{w}.png", w)

mascaras = solo_mascaras(limpio)
una = mascaras.crop((int(mascaras.width * 0.44), 0, mascaras.width, mascaras.height))
una = una.crop(una.getbbox())
icono2, icono1 = cuadrar(mascaras), cuadrar(una, 0.12)

for w in (1024, 512, 256, 180, 64, 32):
    guardar(icono2, f"comicomania-mascaras-{w}.png", w)
for w in (512, 180, 64, 48, 32, 16):
    guardar(icono1, f"comicomania-mascara-mini-{w}.png", w)

sobre_negro(icono2, (512, 512), 0.80).save(OUT / "comicomania-appicon-512.png", optimize=True)
sobre_negro(completo, (1080, 1080), 0.82).save(OUT / "comicomania-avatar-1080.png", optimize=True)
sobre_negro(completo, (1200, 630), 0.60).save(OUT / "comicomania-og-1200x630.png", optimize=True)
icono2.resize((256, 256), Image.LANCZOS).save(
    OUT / "favicon.ico", sizes=[(16,16),(32,32),(48,48),(64,64),(128,128),(256,256)])
icono1.resize((64, 64), Image.LANCZOS).save(
    OUT / "favicon-mini.ico", sizes=[(16,16),(32,32),(48,48)])
print(f"listo: {len(list(OUT.iterdir()))} archivos en {OUT}")
