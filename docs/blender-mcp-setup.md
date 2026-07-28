# Blender MCP — pasos que quedan

Estado al 2026-07-28. Lo que ya esta hecho y lo que falta que hagas vos.

---

## Ya hecho (verificado)

| Cosa | Estado |
|---|---|
| Blender | **5.2.0 LTS**, build 2026-07-14, en `C:\Program Files\Blender Foundation\Blender 5.2\`. Python interno 3.13.13. Pide 3.0+, sobra. |
| `uv` | **0.11.32**, instalado con `winget install astral-sh.uv`. Binarios en `C:\Users\Luca\AppData\Local\Microsoft\WinGet\Packages\astral-sh.uv_Microsoft.Winget.Source_8wekyb3d8bbwe\`. |
| Addon | Bajado a **`tools/blender-mcp/addon.py`** (122.557 bytes) desde `raw.githubusercontent.com/ahujasid/blender-mcp/main/addon.py`. Declara `bl_info` version (1,2), minimo Blender 3.0. |
| Paquete `blender-mcp` | **1.6.4** de PyPI, ya descargado y cacheado por `uvx` (40 dependencias). Arranca y apaga limpio. |
| Servidor MCP en Claude Code | Registrado como **`blender`**, scope **user** (todos tus proyectos). `claude mcp list` lo da **✔ Connected**. |
| `requests` dentro de Blender | 2.32.3, viene bundleado. El addon lo importa en la linea 10; **no hay que instalar nada** en el Python de Blender. |
| API de instalar addons en Blender 5.2 | `bpy.ops.preferences.addon_install` **existe todavia**. Los addons legacy con `bl_info` siguen funcionando. |

Config que quedo escrita en `C:\Users\Luca\.claude.json`:

```json
"blender": {
  "type": "stdio",
  "command": "C:\\Users\\Luca\\AppData\\Local\\Microsoft\\WinGet\\Packages\\astral-sh.uv_Microsoft.Winget.Source_8wekyb3d8bbwe\\uvx.exe",
  "args": ["blender-mcp"],
  "env": { "BLENDER_MCP_DISABLE_TELEMETRY": "true" }
}
```

Dos decisiones que tome y por que — las dos reversibles:

- **Ruta completa a `uvx.exe` en vez de `uvx` a secas.** Winget agrego uv al PATH pero eso
  solo aplica a shells nuevos; los procesos que ya estaban corriendo no lo ven. Con la
  ruta completa arranca siempre.
- **`BLENDER_MCP_DISABLE_TELEMETRY=true`.** Ver seccion "Privacidad" al final.

---

## Lo que falta hacer vos

### 1. Instalar el addon en Blender

Abri Blender y anda a **Edit > Preferences > Add-ons**.

**Ojo con esto:** el README del repo dice "Click 'Install...'", pero ese boton es de
Blender 4.1 y anteriores. En 4.2+ (y por lo tanto en tu 5.2) esta en otro lado:

1. Arriba a la derecha del panel de Add-ons, tocá el **menu desplegable `⌄`** (al lado de
   la lupa de busqueda).
2. Elegi **`Install from Disk...`**.
3. Navegá a:

   ```
   C:\Proyectos\Movie-Vault\tools\blender-mcp\addon.py
   ```

4. Confirmá.

### 2. Activarlo

Buscá **`Blender MCP`** en el buscador de Add-ons y **tildá el checkbox** a la izquierda
del nombre. Aparece como categoria `Interface`.

Si el checkbox no aparece o tira error al tildarlo, pará y avisame — no lo fuerces.

### 3. Revisar las preferencias del addon (opcional pero recomendado)

Desplegá la flechita del addon ya activado. Vas a ver una seccion **"Telemetry &
Privacy"** con un checkbox **"Allow Telemetry"**.

**Viene apagado por default. Dejalo apagado.** Ver la seccion "Privacidad" abajo.

Mas abajo hay campos de API keys (Hyper3D, Sketchfab, Hunyuan3D). Todos opcionales, todos
vacios. No hacen falta para que el MCP funcione.

### 4. Levantar el socket desde el panel del addon

Esto es lo que efectivamente "prende" la conexion:

1. Andá a la **vista 3D** (el viewport normal de Blender).
2. Apretá **`N`** para abrir la barra lateral derecha (si ya esta abierta, saltealo).
3. En las solapas verticales de esa barra vas a ver una que dice **`BlenderMCP`**. Tocala.
4. El panel muestra:
   - **`Port`** — dejalo en **`9876`**. Es el que espera el servidor MCP.
   - Checkboxes de Poly Haven / Hyper3D / Sketchfab / Hunyuan3D — todos opcionales, dejalos
     apagados por ahora.
   - Un boton: **`Connect to MCP server`**.
5. **Tocá `Connect to MCP server`.**

**Nota:** el README del repo dice que el boton se llama "Connect to Claude". Esta
desactualizado — en la version del addon que bajamos (1.2) el label es
**`Connect to MCP server`**. Es el mismo boton.

### 5. Confirmar que quedo escuchando

El panel se reemplaza solo y pasa a mostrar:

- Un boton **`Disconnect from MCP server`**
- Un texto **`Running on port 9876`**

Si ves esas dos cosas, el socket esta arriba. Blender queda escuchando en
`localhost:9876`. Como es localhost, **no deberia saltarte el firewall de Windows**; si
salta, es señal de que algo no esta bindeando donde deberia — avisame.

### 6. Probarlo desde Claude Code

El servidor `blender` ya esta registrado a nivel user, asi que esta disponible en
cualquier proyecto. Para que la sesion actual lo tome:

- Si abris una sesion nueva de Claude Code, ya lo levanta solo.
- Si estas en una sesion que arranco antes de que registrara el server, reinicia Claude
  Code.

Para verificar desde una terminal:

```bash
claude mcp list
```

Tiene que aparecer `blender: ...uvx.exe blender-mcp - ✔ Connected`.

**El orden importa:** conviene tener el socket de Blender arriba (paso 4) **antes** de
pedirle algo a Blender desde Claude. Si el servidor MCP arranca sin Blender escuchando,
loguea `Could not connect to Blender` pero sigue vivo y reintenta en la primera
herramienta que uses. Si igual falla, reinicia Claude Code con Blender ya conectado.

---

## Si algo falla

| Sintoma | Que pasa |
|---|---|
| `WinError 10061 ... el equipo de destino denegó expresamente dicha conexión` | El socket de Blender no esta arriba. Volvé al paso 4. Es el error exacto que da cuando Blender no escucha. |
| El panel `BlenderMCP` no aparece en la barra `N` | El addon no quedo activado. Volvé al paso 2. |
| `Install from Disk...` no esta en el menu `⌄` | Avisame antes de tocar nada. Blender 5.2 todavia soporta addons legacy (lo verifique), pero la UI puede haber cambiado de lugar respecto a 4.x. |
| Cambiaste el puerto en el panel | Hay que decirselo tambien al servidor MCP con la env var `BLENDER_PORT`. Avisame y lo reconfiguro. |
| Querés sacar el server MCP | `claude mcp remove blender -s user` |

---

## Privacidad — leelo antes de usarlo

Esto no es una advertencia generica, es lo que encontre leyendo el codigo:

**El servidor MCP (`blender-mcp` 1.6.4) manda telemetria a un Supabase de terceros.**
En el smoke test que corri, apenas arranco — sin Blender conectado siquiera — hizo un
`POST` a `https://yzasssndwqceclzilcdu.supabase.co/rest/v1/telemetry_events` y le
respondio `201 Created`.

Hay dos niveles:

1. **Uso anonimo** — se manda por default, sin preguntar nada.
2. **Prompts, codigo ejecutado y screenshots del viewport** — solo con consentimiento
   explicito. El decorador de las herramientas es literalmente
   `@rich_telemetry_tool("execute_blender_code", capture_code=True)`, y varias tools
   reciben un parametro `user_prompt` descrito como *"The original user prompt that led to
   this tool call (required for telemetry)"*. El consentimiento se controla con el
   checkbox **"Allow Telemetry"** del addon, que **viene en `False`**.

**Lo que hice:** deje el nivel 1 apagado tambien, con
`BLENDER_MCP_DISABLE_TELEMETRY=true` en la config del MCP. El codigo acepta tres variables
equivalentes: `DISABLE_TELEMETRY`, `BLENDER_MCP_DISABLE_TELEMETRY`, `MCP_DISABLE_TELEMETRY`,
con valores `true` / `1` / `yes` / `on`.

Si querés mandar telemetria para bancar el proyecto, sacá la env var de
`C:\Users\Luca\.claude.json` y/o tildá el checkbox del addon. Es tu decision, solo queria
que la tomaras sabiendo.

**Otras dos cosas del mismo tema:**

- **El addon ejecuta Python arbitrario dentro de Blender.** La herramienta
  `execute_blender_code` existe justamente para eso, y es de donde sale casi todo el poder
  de este MCP. Significa que cualquier cosa que le pidas a Claude sobre Blender termina
  siendo codigo corriendo con los permisos de tu usuario. No es un bug, es el diseño —
  pero no lo dejes escuchando en background cuando no lo estas usando. Apretá
  `Disconnect from MCP server` cuando termines.
- **El paquete de PyPI tiene metadata placeholder.** `author_email` es
  `Your Name <your.email@example.com>` y los `project_urls` apuntan a
  `github.com/yourusername/blender-mcp`. O sea, desde la pagina de PyPI **no se puede
  verificar** que ese paquete sea el del repo `ahujasid/blender-mcp`. Tiene 24 releases y
  licencia MIT, y el comportamiento coincide con el addon, pero la cadena de confianza
  ahi tiene un eslabon flojo. Lo mismo aplica al addon: lo baje del repo oficial pero es
  codigo de terceros de 2883 lineas.

---

## Nota sobre el repo

`tools/blender-mcp/addon.py` son 122 KB de codigo de terceros que quedaron dentro
de `C:\Proyectos\Movie-Vault`. **No lo agregue al `.gitignore` ni lo commitee** — decidí
vos si lo querés versionado, moverlo fuera del proyecto, o ignorarlo. Si preferis que viva
en otro lado (por ejemplo `C:\Users\Luca\.blender-addons\`), decime y lo muevo; el paso 1
de arriba solo cambia de ruta.
