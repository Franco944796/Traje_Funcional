import cv2
import numpy as np
from ultralytics import YOLO

MODEL_PATH = "yolo26n-seg.pt"  # variante "nano": la más rápida en CPU
CAMERA_INDEX = 0
CONFIDENCE = 0.5
PERSON_CLASS_ID = 0  # "person" en el dataset COCO
CONTOUR_COLOR = (0, 255, 0)
CONTOUR_THICKNESS = 2


def draw_person_contours(canvas: np.ndarray, masks: np.ndarray, width: int, height: int) -> None:
    for mask in masks:
        binary = (mask > 0.5).astype(np.uint8) * 255
        if binary.shape[:2] != (height, width):
            binary = cv2.resize(binary, (width, height), interpolation=cv2.INTER_NEAREST)
        contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        cv2.drawContours(canvas, contours, -1, CONTOUR_COLOR, CONTOUR_THICKNESS, cv2.LINE_AA)


def main():
    model = YOLO(MODEL_PATH)

    cap = cv2.VideoCapture(CAMERA_INDEX)
    if not cap.isOpened():
        raise RuntimeError("No se pudo abrir la cámara.")

    print("Presiona 'q' para salir.")
    while True:
        ok, frame = cap.read()
        if not ok:
            break

        frame = cv2.flip(frame, 1)
        height, width = frame.shape[:2]

        results = model.predict(frame, classes=[PERSON_CLASS_ID],
                                 conf=CONFIDENCE, verbose=False)[0]

        canvas = np.zeros((height, width, 3), dtype=np.uint8)
        if results.masks is not None:
            masks = results.masks.data.cpu().numpy()
            draw_person_contours(canvas, masks, width, height)

        cv2.imshow("Contorno corporal - YOLO26", canvas)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()


if __name__ == "__main__":
    main()