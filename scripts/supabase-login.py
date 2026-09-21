#!/usr/bin/env python3
"""Completa el login del CLI de Supabase sin intervención manual.

El CLI exige un TTY y pide un código de verificación que solo aparece en el
navegador. Este script le da un pseudo-terminal propio, publica el link en
un archivo, espera a que llegue el código en otro, y lo escribe por él.

El token que resulta lo guarda el CLI en su propia configuración: no pasa
por acá ni queda en ningún log.
"""
import os
import pty
import re
import select
import sys
import time

BASE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".tmp")
URL_FILE = os.path.join(BASE, "login-url.txt")
CODE_FILE = os.path.join(BASE, "login-code.txt")
LOG_FILE = os.path.join(BASE, "login.log")
ESPERA_MAX = 300

for f in (URL_FILE, CODE_FILE, LOG_FILE):
    if os.path.exists(f):
        os.remove(f)

pid, fd = pty.fork()
if pid == 0:
    raiz = os.path.dirname(BASE)
    os.chdir(raiz)
    # TERM hace falta: sin él el CLI se declara no interactivo y cae en
    # modo JSON, donde se niega a preguntar nada.
    os.environ["TERM"] = "xterm-256color"
    binario = os.path.join(raiz, "node_modules", ".bin", "supabase")
    os.execv(binario, [binario, "login", "--no-browser",
                       "--output-format", "text",
                       "--name", "comicomania-claude"])

buffer = ""
url_publicada = False
codigo_enviado = False
inicio = time.time()
log = open(LOG_FILE, "w")

def limpiar(texto):
    return re.sub(r"\x1b\[[0-9;?]*[a-zA-Z]", "", texto)

while time.time() - inicio < ESPERA_MAX:
    listo, _, _ = select.select([fd], [], [], 0.5)
    if listo:
        try:
            datos = os.read(fd, 4096)
        except OSError:
            break
        if not datos:
            break
        texto = limpiar(datos.decode("utf-8", "replace"))
        buffer += texto
        log.write(texto)
        log.flush()

        if not url_publicada:
            m = re.search(r"https://supabase\.com/dashboard/cli/login\?\S+", buffer)
            if m:
                with open(URL_FILE, "w") as f:
                    f.write(m.group(0).rstrip("\x1b[").strip())
                url_publicada = True

        if "Token cli_login_token" in buffer or "Finished supabase login" in buffer:
            print("LOGIN_OK")
            break
        if "expired" in buffer.lower() or "invalid" in buffer.lower():
            print("LOGIN_ERROR")
            break

    if url_publicada and not codigo_enviado and os.path.exists(CODE_FILE):
        with open(CODE_FILE) as f:
            codigo = f.read().strip()
        if codigo:
            time.sleep(0.5)
            # El prompt corre en modo raw: ahí Enter es CR, no LF.
            for ch in codigo:
                os.write(fd, ch.encode())
                time.sleep(0.03)
            os.write(fd, b"\r")
            codigo_enviado = True
            log.write("\n[enviado el codigo]\n")
            log.flush()

log.close()
try:
    os.close(fd)
except OSError:
    pass
os.waitpid(pid, os.WNOHANG)
print("FIN", "url" if url_publicada else "sin-url", "codigo" if codigo_enviado else "sin-codigo")
