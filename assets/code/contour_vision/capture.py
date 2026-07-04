"""
capture.py
----------
Encapsula el acceso a la cámara. Al aislar OpenCV VideoCapture en su
propia clase, el resto del programa no depende de detalles de bajo nivel
y es fácil sustituir la fuente (ej. un video o una cámara IP) más adelante.
"""

import cv2


class Camera:
    """Wrapper simple y seguro sobre cv2.VideoCapture."""

    def __init__(self, index: int = 0, width: int = 1280, height: int = 720):
        self.cap = cv2.VideoCapture(index)
        self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, width)
        self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, height)

        if not self.cap.isOpened():
            raise RuntimeError(
                f"No se pudo abrir la cámara con índice {index}. "
                "Verifica que no esté siendo usada por otra aplicación."
            )

    def read(self):
        """Devuelve un frame BGR o None si falla la lectura."""
        ok, frame = self.cap.read()
        if not ok:
            return None
        return frame

    def release(self):
        self.cap.release()

    # Soporte para "with Camera(...) as cam:"
    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.release()