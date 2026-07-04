"""
config.py
---------
Configuración centralizada de la herramienta. Modifica aquí colores,
umbrales de confianza y parámetros de cámara sin tocar la lógica.
"""

# --- Cámara ---
CAMERA_INDEX = 0        # 0 = cámara por defecto de la laptop
FRAME_WIDTH = 1280
FRAME_HEIGHT = 720

# --- Colores de los contornos (formato BGR, no RGB) ---
COLOR_FACE = (0, 255, 0)          # Verde
COLOR_FACE_DETAIL = (0, 140, 0)   # Verde oscuro (malla completa)
COLOR_HANDS = (0, 165, 255)       # Naranja (esqueleto de dedos)
COLOR_HAND_SILHOUETTE = (0, 100, 255)  # Naranja oscuro (contorno exacto)
COLOR_POSE = (255, 0, 255)        # Magenta (silueta corporal)
COLOR_POSE_DETAIL = (180, 0, 180) # Magenta oscuro (esqueleto corporal)

# --- Grosor de línea ---
THICKNESS_FACE = 1
THICKNESS_FACE_DETAIL = 1
THICKNESS_HANDS = 2
THICKNESS_HAND_SILHOUETTE = 2
THICKNESS_POSE = 2
THICKNESS_POSE_DETAIL = 2

# --- Segmentación corporal (contorno exacto por píxel) ---
SEGMENTATION_THRESHOLD = 0.5        # umbral de probabilidad "es cuerpo"
CONTOUR_SMOOTHING_EPSILON = 0.0015  # 0 = contorno crudo; mayor = más suave

# --- Silueta exacta de manos (GrabCut, robusta a rotación de muñeca) ---
HAND_SILHOUETTE_PADDING = 25        # píxeles extra alrededor de la mano
HAND_SILHOUETTE_ITERATIONS = 1      # más = más preciso pero más lento
HAND_SILHOUETTE_SMOOTHING = 0.003

# --- Rutas de los modelos (descargados con download_models.py) ---
FACE_MODEL_PATH = "models/face_landmarker.task"
HAND_MODEL_PATH = "models/hand_landmarker.task"
POSE_MODEL_PATH = "models/pose_landmarker_lite.task"

# --- Límites de detección ---
MAX_FACES = 2
MAX_HANDS = 2

# --- Confianza mínima (0.0 - 1.0) ---
MIN_DETECTION_CONFIDENCE = 0.5
MIN_TRACKING_CONFIDENCE = 0.5

# --- Estado inicial de los módulos al arrancar ---
SHOW_FACE_DEFAULT = True
SHOW_HANDS_DEFAULT = True
SHOW_POSE_DEFAULT = False
SHOW_FACE_DETAIL_DEFAULT = False   # malla facial completa (tesselación)
SHOW_HAND_SILHOUETTE_DEFAULT = False  # silueta exacta de mano (GrabCut, más lento)
SHOW_POSE_DETAIL_DEFAULT = False   # esqueleto corporal sobre la silueta