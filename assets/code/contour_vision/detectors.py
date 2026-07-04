"""
Cada detector encapsula un modelo de MediaPipe (API Tasks) y expone una
interfaz de detección orientada a contornos precisos:

- FaceContourDetector: contorno facial (y malla completa opcional).
- HandContourDetector: esqueleto anatómico real de la mano (no una
  aproximación poligonal), mucho más fiel a la forma de los dedos.
- PoseContourDetector: silueta corporal exacta obtenida por segmentación
  a nivel de píxel (no por unión de puntos dispersos).
"""

from abc import ABC, abstractmethod

import mediapipe as mp
from mediapipe.tasks.python import BaseOptions
from mediapipe.tasks.python import vision


class BaseDetector(ABC):

    @abstractmethod
    def detect(self, rgb_frame, timestamp_ms: int):
        raise NotImplementedError

    def close(self):
        pass


class FaceContourDetector(BaseDetector):


    def __init__(self, model_path="models/face_landmarker.task", max_faces=2,
                 min_detection_confidence=0.5, min_tracking_confidence=0.5):
        options = vision.FaceLandmarkerOptions(
            base_options=BaseOptions(model_asset_path=model_path),
            running_mode=vision.RunningMode.VIDEO,
            num_faces=max_faces,
            min_face_detection_confidence=min_detection_confidence,
            min_tracking_confidence=min_tracking_confidence,
        )
        self._landmarker = vision.FaceLandmarker.create_from_options(options)

        conn = vision.FaceLandmarksConnections
        self.contours = [(c.start, c.end) for c in conn.FACE_LANDMARKS_CONTOURS]
        self.tesselation = [(c.start, c.end) for c in conn.FACE_LANDMARKS_TESSELATION]

    def detect(self, rgb_frame, timestamp_ms: int):
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)
        result = self._landmarker.detect_for_video(mp_image, timestamp_ms)
        return result.face_landmarks or []

    def close(self):
        self._landmarker.close()


class HandContourDetector(BaseDetector):

    def __init__(self, model_path="models/hand_landmarker.task", max_hands=2,
                 min_detection_confidence=0.6, min_tracking_confidence=0.6):
        options = vision.HandLandmarkerOptions(
            base_options=BaseOptions(model_asset_path=model_path),
            running_mode=vision.RunningMode.VIDEO,
            num_hands=max_hands,
            min_hand_detection_confidence=min_detection_confidence,
            min_tracking_confidence=min_tracking_confidence,
        )
        self._landmarker = vision.HandLandmarker.create_from_options(options)
        self.connections = [
            (c.start, c.end)
            for c in vision.HandLandmarksConnections.HAND_CONNECTIONS
        ]

    def detect(self, rgb_frame, timestamp_ms: int):
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)
        result = self._landmarker.detect_for_video(mp_image, timestamp_ms)
        return result.hand_landmarks or []

    def close(self):
        self._landmarker.close()


class PoseContourDetector(BaseDetector):


    def __init__(self, model_path="models/pose_landmarker_lite.task",
                 min_detection_confidence=0.5, min_tracking_confidence=0.5):
        options = vision.PoseLandmarkerOptions(
            base_options=BaseOptions(model_asset_path=model_path),
            running_mode=vision.RunningMode.VIDEO,
            num_poses=1,
            min_pose_detection_confidence=min_detection_confidence,
            min_tracking_confidence=min_tracking_confidence,
            output_segmentation_masks=True,
        )
        self._landmarker = vision.PoseLandmarker.create_from_options(options)
        self.connections = [
            (c.start, c.end)
            for c in vision.PoseLandmarksConnections.POSE_LANDMARKS
        ]

    def detect(self, rgb_frame, timestamp_ms: int):
        landmarks, _ = self.detect_with_mask(rgb_frame, timestamp_ms)
        return landmarks

    def detect_with_mask(self, rgb_frame, timestamp_ms: int):
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)
        result = self._landmarker.detect_for_video(mp_image, timestamp_ms)
        landmarks = result.pose_landmarks or []
        mask = None
        if result.segmentation_masks:
            mask = result.segmentation_masks[0].numpy_view()
        return landmarks, mask

    def close(self):
        self._landmarker.close()