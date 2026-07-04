# Contour Vision — Detección de contornos corporales en tiempo real

Herramienta de visión artificial que usa la cámara de tu laptop para
detectar y dibujar **únicamente los contornos** (bordes) de rostro, manos
y cuerpo, ignorando todo lo demás. La salida es un lienzo negro con líneas
de contorno, no la imagen real de la cámara.

## Arquitectura (modular)

```
contour_vision/
├── config.py       # Parámetros ajustables (colores, umbrales, cámara)
├── capture.py      # Acceso a la cámara (fácil de sustituir por video/IP)
├── detectors.py     # Wrappers de MediaPipe: rostro, manos, cuerpo
├── renderer.py      # Funciones puras de dibujo de contornos
├── main.py           # Orquestador principal (loop de captura/render)
└── requirements.txt
```

Cada pieza tiene una única responsabilidad, así que puedes:
- Agregar un nuevo detector (ej. ojos, pies) sin tocar `main.py`.
- Cambiar la fuente de video (archivo, IP cam) sin tocar los detectores.
- Ajustar colores/umbrales sin tocar la lógica.

## Instalación

Compatible con **Python 3.9 – 3.12+** (usa la API moderna `mediapipe.tasks`,
no la API legacy `mediapipe.solutions` que ya no se distribuye para
Python 3.12 en adelante).

```bash
cd contour_vision
python -m venv venv
source venv/bin/activate        # En Windows: venv\Scripts\activate
pip install -r requirements.txt
python download_models.py       # Descarga los 3 modelos .task (~15 MB)
```

## Uso

```bash
python main.py
```

### Controles en la ventana de video
| Tecla | Acción                                                    |
|-------|-------------------------------------------------------------|
| `f`   | Activar/desactivar contorno de rostro                        |
| `t`   | Activar/desactivar malla facial completa (detalle)            |
| `h`   | Activar/desactivar esqueleto de manos                         |
| `g`   | Activar/desactivar silueta EXACTA de manos (GrabCut)           |
| `p`   | Activar/desactivar silueta corporal exacta (incluye brazos)    |
| `b`   | Activar/desactivar esqueleto corporal sobre la silueta          |
| `s`   | Guardar una captura PNG del resultado                          |
| `q`   | Salir                                                          |

## Cómo funciona cada contorno (nivel de detalle y precisión)

1. **Captura**: OpenCV lee frames BGR de la cámara (`capture.py`).
2. **Detección**: MediaPipe Tasks API procesa el frame en modo `VIDEO`
   (`detectors.py`).
3. **Render** — cada parte usa la técnica más precisa disponible:

   - **Rostro**: `FACE_LANDMARKS_CONTOURS` como base (óvalo, cejas, ojos,
     labios, iris). Con `t` se agrega `FACE_LANDMARKS_TESSELATION`
     (~468 puntos triangulados) para ver la malla completa.

   - **Manos**: esqueleto anatómico completo (`HAND_CONNECTIONS`) como
     base. Con `g` se agrega además la **silueta exacta a nivel de
     píxel**, calculada con **GrabCut** (segmentación por color/textura)
     sembrado con los 21 landmarks reales de cada mano como pistas de
     primer plano. Esto es clave para tu pedido de que el contorno
     respete los movimientos del carpo: como GrabCut analiza los
     píxeles reales de la imagen en cada frame (y no una forma
     geométrica fija como un polígono convexo), la silueta se ajusta
     automáticamente a cualquier rotación, flexión o giro de la muñeca
     sin deformarse — no hay una "forma de mano" predefinida que pueda
     quedar mal orientada.

   - **Cuerpo (incluye brazos)**: se activa
     `output_segmentation_masks=True` en el modelo Pose, que genera una
     **máscara de segmentación real a nivel de píxel** de toda la
     persona visible (torso, brazos, piernas). Sobre esa máscara se usa
     `cv2.findContours` para extraer el contorno exacto, y
     `cv2.approxPolyDP` para suavizarlo levemente. Con `b` se superpone
     además el esqueleto corporal (`POSE_LANDMARKS`: hombros, codos,
     caderas, rodillas, etc.) como capa de detalle interno, igual que la
     malla facial.

4. Todo se dibuja sobre un canvas negro nuevo en cada frame — la imagen
   original de la cámara nunca se muestra ni se guarda.

## Por qué la silueta de manos (GrabCut) es distinta a las demás

Es la única técnica basada en color/textura de la imagen en vez de
landmarks geométricos, porque MediaPipe no ofrece un modelo de
segmentación dedicado para manos (solo 21 puntos de esqueleto). GrabCut
es más lento que las demás técnicas (puede bajar el FPS notablemente,
sobre todo con 2 manos a la vez), por eso está desactivada por defecto.
Si la ves poco precisa, ajusta en `config.py`:
- `HAND_SILHOUETTE_ITERATIONS`: súbelo (ej. 5) para más precisión a
  costa de más lentitud.
- `HAND_SILHOUETTE_PADDING`: auméntalo si la mano se corta en los bordes
  del recorte.

## Ajustar la precisión del cuerpo

En `config.py`:
- `SEGMENTATION_THRESHOLD`: sube este valor (ej. 0.6-0.7) si el contorno
  del cuerpo "se come" partes del fondo; bájalo (ej. 0.3-0.4) si recorta
  partes del cuerpo.
- `CONTOUR_SMOOTHING_EPSILON`: ponlo en `0.0` para ver el contorno crudo,
  sin ningún suavizado (más ruidoso pero más fiel píxel a píxel).

## Nota sobre la versión de MediaPipe

Desde ~0.10.14, los wheels de MediaPipe para Python 3.12+ **ya no incluyen**
la API legacy `mediapipe.solutions` (la que usan la mayoría de tutoriales
antiguos). Esta herramienta usa la API moderna `mediapipe.tasks`, que es
la recomendada oficialmente hacia adelante y funciona en todas las
versiones recientes de Python.

## Extender la herramienta

Para agregar, por ejemplo, detección de pies o de objetos:
1. Crea una clase en `detectors.py` que herede de `BaseDetector` e
   implemente `detect(rgb_frame)`.
2. Añade una función de dibujo en `renderer.py` si necesitas una lógica
   distinta a `draw_convex_contour` o `draw_mesh_connections`.
3. Instáncialo y llámalo en `main.py`, siguiendo el mismo patrón que los
   detectores existentes.

## Notas de rendimiento

- Baja `FRAME_WIDTH`/`FRAME_HEIGHT` en `config.py` si el FPS es bajo.
- Desactivar módulos que no uses (tecla `p` para pose, por ejemplo) mejora
  notablemente el rendimiento, ya que Pose es el modelo más pesado.