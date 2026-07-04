"""
Funciones puras de dibujo. Nunca dibujan la imagen de la cámara, solo
líneas/contornos sobre un canvas negro.
"""

import cv2
import numpy as np


def landmarks_to_pixels(landmark_list, width: int, height: int) -> np.ndarray:
    return np.array(
        [[int(lm.x * width), int(lm.y * height)] for lm in landmark_list],
        dtype=np.int32,
    )


def draw_connections(canvas: np.ndarray, landmark_list, connections,
                      width: int, height: int, color: tuple,
                      thickness: int = 1) -> None:

    pts = landmarks_to_pixels(landmark_list, width, height)
    n_points = len(pts)
    for start_idx, end_idx in connections:
        if start_idx < n_points and end_idx < n_points:
            cv2.line(canvas, tuple(pts[start_idx]), tuple(pts[end_idx]),
                      color, thickness, cv2.LINE_AA)


def compute_hand_silhouette_mask(frame_bgr: np.ndarray, landmark_list, width: int,
                                  height: int, padding: int = 25, iterations: int = 3):

    pts = landmarks_to_pixels(landmark_list, width, height)
    x, y, w, h = cv2.boundingRect(pts)
    x0, y0 = max(0, x - padding), max(0, y - padding)
    x1, y1 = min(width, x + w + padding), min(height, y + h + padding)
    if x1 <= x0 or y1 <= y0:
        return None, 0, 0

    roi = frame_bgr[y0:y1, x0:x1]
    if roi.size == 0:
        return None, 0, 0

    local_pts = pts - [x0, y0]

    gc_mask = np.full(roi.shape[:2], cv2.GC_BGD, dtype=np.uint8)
    hull = cv2.convexHull(local_pts)
    cv2.fillConvexPoly(gc_mask, hull, cv2.GC_PR_FGD)
    for px, py in local_pts:
        if 0 <= px < roi.shape[1] and 0 <= py < roi.shape[0]:
            cv2.circle(gc_mask, (int(px), int(py)), 6, cv2.GC_FGD, -1)

    bgd_model = np.zeros((1, 65), np.float64)
    fgd_model = np.zeros((1, 65), np.float64)
    try:
        cv2.grabCut(roi, gc_mask, None, bgd_model, fgd_model,
                    iterations, cv2.GC_INIT_WITH_MASK)
    except cv2.error:
        return None, 0, 0

    binary = np.where(
        (gc_mask == cv2.GC_FGD) | (gc_mask == cv2.GC_PR_FGD), 255, 0
    ).astype(np.uint8)
    return binary, x0, y0


def draw_hand_silhouette(canvas: np.ndarray, frame_bgr: np.ndarray, landmark_list,
                          width: int, height: int, color: tuple, thickness: int = 2,
                          padding: int = 25, iterations: int = 3,
                          smoothing_epsilon_ratio: float = 0.003) -> None:
    binary, x0, y0 = compute_hand_silhouette_mask(
        frame_bgr, landmark_list, width, height, padding, iterations
    )
    if binary is None:
        return

    kernel = np.ones((3, 3), np.uint8)
    binary = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel)

    contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    if not contours:
        return

    largest = max(contours, key=cv2.contourArea)
    if smoothing_epsilon_ratio > 0:
        epsilon = smoothing_epsilon_ratio * cv2.arcLength(largest, True)
        largest = cv2.approxPolyDP(largest, epsilon, True)

    largest = largest + [x0, y0]  # volver a coordenadas globales del frame
    cv2.drawContours(canvas, [largest], -1, color, thickness, cv2.LINE_AA)


def draw_segmentation_contour(canvas: np.ndarray, mask: np.ndarray,
                               width: int, height: int, color: tuple,
                               thickness: int = 2, threshold: float = 0.5,
                               smoothing_epsilon_ratio: float = 0.001) -> None:

    if mask is None:
        return

    binary = (mask > threshold).astype(np.uint8) * 255
    if binary.shape[:2] != (height, width):
        binary = cv2.resize(binary, (width, height), interpolation=cv2.INTER_NEAREST)

    kernel = np.ones((5, 5), np.uint8)
    binary = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel)

    contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    if not contours:
        return

    largest = max(contours, key=cv2.contourArea)

    if smoothing_epsilon_ratio > 0:
        epsilon = smoothing_epsilon_ratio * cv2.arcLength(largest, True)
        largest = cv2.approxPolyDP(largest, epsilon, True)

    cv2.drawContours(canvas, [largest], -1, color, thickness, cv2.LINE_AA)