"""
Orquestador principal. Captura video de la laptop, ejecuta los
detectores habilitados y dibuja SOLO los contornos sobre un lienzo
negro (nunca la imagen real de la cámara).

Controles en tiempo real:
    f -> activar/desactivar contorno de rostro
    t -> activar/desactivar malla facial completa (más detalle)
    h -> activar/desactivar esqueleto de manos
    g -> activar/desactivar silueta EXACTA de manos (GrabCut, más lento
         pero robusto a cualquier rotación/flexión de la muñeca)
    p -> activar/desactivar silueta corporal exacta (segmentación,
         incluye brazos y todo el contorno del cuerpo)
    b -> activar/desactivar esqueleto corporal sobre la silueta
    s -> guardar una captura (PNG) del frame actual
    q -> salir
"""

import time

import cv2
import numpy as np

import config
from capture import Camera
from detectors import FaceContourDetector, HandContourDetector, PoseContourDetector
import renderer


def build_detectors():
    face = FaceContourDetector(
        model_path=config.FACE_MODEL_PATH,
        max_faces=config.MAX_FACES,
        min_detection_confidence=config.MIN_DETECTION_CONFIDENCE,
        min_tracking_confidence=config.MIN_TRACKING_CONFIDENCE,
    )
    hands = HandContourDetector(
        model_path=config.HAND_MODEL_PATH,
        max_hands=config.MAX_HANDS,
        min_detection_confidence=config.MIN_DETECTION_CONFIDENCE,
        min_tracking_confidence=config.MIN_TRACKING_CONFIDENCE,
    )
    pose = PoseContourDetector(
        model_path=config.POSE_MODEL_PATH,
        min_detection_confidence=config.MIN_DETECTION_CONFIDENCE,
        min_tracking_confidence=config.MIN_TRACKING_CONFIDENCE,
    )
    return face, hands, pose


def process_frame(frame, face_detector, hand_detector, pose_detector, flags, timestamp_ms):
    height, width = frame.shape[:2]
    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    rgb_frame = np.ascontiguousarray(rgb_frame)  # requerido por mp.Image

    canvas = np.zeros((height, width, 3), dtype=np.uint8)

    if flags["face"]:
        for landmarks in face_detector.detect(rgb_frame, timestamp_ms):
            if flags["face_detail"]:
                renderer.draw_connections(
                    canvas, landmarks, face_detector.tesselation,
                    width, height, config.COLOR_FACE_DETAIL, config.THICKNESS_FACE_DETAIL,
                )
            renderer.draw_connections(
                canvas, landmarks, face_detector.contours,
                width, height, config.COLOR_FACE, config.THICKNESS_FACE,
            )

    if flags["hands"]:
        for landmarks in hand_detector.detect(rgb_frame, timestamp_ms):
            renderer.draw_connections(
                canvas, landmarks, hand_detector.connections,
                width, height, config.COLOR_HANDS, config.THICKNESS_HANDS,
            )
            if flags["hand_silhouette"]:
                renderer.draw_hand_silhouette(
                    canvas, frame, landmarks, width, height,
                    config.COLOR_HAND_SILHOUETTE, config.THICKNESS_HAND_SILHOUETTE,
                    config.HAND_SILHOUETTE_PADDING, config.HAND_SILHOUETTE_ITERATIONS,
                    config.HAND_SILHOUETTE_SMOOTHING,
                )

    if flags["pose"]:
        pose_landmarks, mask = pose_detector.detect_with_mask(rgb_frame, timestamp_ms)
        renderer.draw_segmentation_contour(
            canvas, mask, width, height, config.COLOR_POSE, config.THICKNESS_POSE,
            config.SEGMENTATION_THRESHOLD, config.CONTOUR_SMOOTHING_EPSILON,
        )
        if flags["pose_detail"]:
            for landmarks in pose_landmarks:
                renderer.draw_connections(
                    canvas, landmarks, pose_detector.connections,
                    width, height, config.COLOR_POSE_DETAIL, config.THICKNESS_POSE_DETAIL,
                )

    return canvas


def draw_hud(canvas, fps, flags):
    line1 = (
        f"FPS: {fps:.1f}   "
        f"Rostro:{'ON' if flags['face'] else 'OFF'}"
        f"(malla:{'ON' if flags['face_detail'] else 'OFF'})"
    )
    line2 = (
        f"Manos:{'ON' if flags['hands'] else 'OFF'}"
        f"(silueta:{'ON' if flags['hand_silhouette'] else 'OFF'})  "
        f"Cuerpo:{'ON' if flags['pose'] else 'OFF'}"
        f"(esqueleto:{'ON' if flags['pose_detail'] else 'OFF'})"
    )
    cv2.putText(canvas, line1, (10, 30), cv2.FONT_HERSHEY_SIMPLEX,
                0.6, (255, 255, 255), 2, cv2.LINE_AA)
    cv2.putText(canvas, line2, (10, 55), cv2.FONT_HERSHEY_SIMPLEX,
                0.55, (200, 200, 200), 1, cv2.LINE_AA)


def main():
    face_detector, hand_detector, pose_detector = build_detectors()

    flags = {
        "face": config.SHOW_FACE_DEFAULT,
        "face_detail": config.SHOW_FACE_DETAIL_DEFAULT,
        "hands": config.SHOW_HANDS_DEFAULT,
        "hand_silhouette": config.SHOW_HAND_SILHOUETTE_DEFAULT,
        "pose": config.SHOW_POSE_DEFAULT,
        "pose_detail": config.SHOW_POSE_DETAIL_DEFAULT,
    }

    prev_time = time.time()

    try:
        with Camera(config.CAMERA_INDEX, config.FRAME_WIDTH, config.FRAME_HEIGHT) as cam:
            print("Controles: [f] rostro  [t] malla facial  [h] manos  [g] silueta manos  "
                  "[p] cuerpo  [b] esqueleto cuerpo  [s] captura  [q] salir")

            while True:
                frame = cam.read()
                if frame is None:
                    print("No se pudo leer el frame de la cámara. Deteniendo.")
                    break

                frame = cv2.flip(frame, 1)  # efecto espejo, más natural
                timestamp_ms = int(time.time() * 1000)
                canvas = process_frame(frame, face_detector, hand_detector,
                                        pose_detector, flags, timestamp_ms)

                curr_time = time.time()
                fps = 1 / (curr_time - prev_time) if curr_time != prev_time else 0.0
                prev_time = curr_time
                draw_hud(canvas, fps, flags)

                cv2.imshow("Contornos - Vision Artificial", canvas)

                key = cv2.waitKey(1) & 0xFF
                if key == ord('q'):
                    break
                elif key == ord('f'):
                    flags["face"] = not flags["face"]
                elif key == ord('t'):
                    flags["face_detail"] = not flags["face_detail"]
                elif key == ord('h'):
                    flags["hands"] = not flags["hands"]
                elif key == ord('g'):
                    flags["hand_silhouette"] = not flags["hand_silhouette"]
                elif key == ord('p'):
                    flags["pose"] = not flags["pose"]
                elif key == ord('b'):
                    flags["pose_detail"] = not flags["pose_detail"]
                elif key == ord('s'):
                    filename = f"captura_{int(time.time())}.png"
                    cv2.imwrite(filename, canvas)
                    print(f"Captura guardada como: {filename}")

    finally:
        face_detector.close()
        hand_detector.close()
        pose_detector.close()
        cv2.destroyAllWindows()


if __name__ == "__main__":
    main()