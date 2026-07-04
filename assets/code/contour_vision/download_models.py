"""
download_models.py
-------------------
Descarga los modelos oficiales de MediaPipe (API Tasks) necesarios para
detectar rostro, manos y cuerpo. Ejecutar una sola vez:

    python download_models.py
"""

import os
import urllib.request

MODELS = {
    "face_landmarker.task":
        "https://storage.googleapis.com/mediapipe-models/face_landmarker/"
        "face_landmarker/float16/1/face_landmarker.task",
    "hand_landmarker.task":
        "https://storage.googleapis.com/mediapipe-models/hand_landmarker/"
        "hand_landmarker/float16/1/hand_landmarker.task",
    "pose_landmarker_lite.task":
        "https://storage.googleapis.com/mediapipe-models/pose_landmarker/"
        "pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
}

MODELS_DIR = "models"


def main():
    os.makedirs(MODELS_DIR, exist_ok=True)
    for filename, url in MODELS.items():
        dest = os.path.join(MODELS_DIR, filename)
        if os.path.exists(dest):
            print(f"[OK] Ya existe: {dest}")
            continue
        print(f"Descargando {filename} ...")
        urllib.request.urlretrieve(url, dest)
        print(f"[OK] Guardado en: {dest}")


if __name__ == "__main__":
    main()