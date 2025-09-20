import cv2
import mediapipe as mp
import numpy as np
import pyautogui
import time

# --- MediaPipe setup ---
mp_selfie_segmentation = mp.solutions.selfie_segmentation
mp_pose = mp.solutions.pose
mp_drawing = mp.solutions.drawing_utils

segmentation = mp_selfie_segmentation.SelfieSegmentation(model_selection=1)
pose = mp_pose.Pose(static_image_mode=False,
                    min_detection_confidence=0.5,
                    min_tracking_confidence=0.3)

cap = cv2.VideoCapture(0)
cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
cap.set(cv2.CAP_PROP_FPS, 30)

# --- Drum detection thresholds ---
HIT_THRESHOLD = 40    # pixels below shoulder to count as hit
RESET_THRESHOLD = 20  # pixels above shoulder to reset

# Hand states
left_hand_down = False
right_hand_down = False

# FPS tracking
frame_count = 0
fps_start_time = cv2.getTickCount()

while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        break
    frame = cv2.flip(frame, 1)
    h, w = frame.shape[:2]

    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

    # --- Segmentation ---
    segmentation_results = segmentation.process(rgb_frame)
    body_mask = segmentation_results.segmentation_mask > 0.5

    # --- Pose detection ---
    pose_results = pose.process(rgb_frame)

    # Base output frame (black background)
    output_frame = np.zeros_like(frame)

    # Paint silhouette purple where body mask is True
    purple = np.array([128, 0, 128], dtype=np.uint8)
    output_frame[body_mask] = purple

    # --- Drum detection ---
    if pose_results.pose_landmarks:
        lm = pose_results.pose_landmarks.landmark

        left_shoulder_y = lm[11].y * h
        right_shoulder_y = lm[12].y * h
        left_wrist_y = lm[15].y * h
        right_wrist_y = lm[16].y * h

        rel_left = left_wrist_y - left_shoulder_y
        rel_right = right_wrist_y - right_shoulder_y

        # LEFT hand triggers RIGHT drum
        if not left_hand_down and rel_left > HIT_THRESHOLD:
            print("Right drum hit!")
            pyautogui.press('l')
            left_hand_down = True
        elif left_hand_down and rel_left < RESET_THRESHOLD:
            left_hand_down = False

        # RIGHT hand triggers LEFT drum
        if not right_hand_down and rel_right > HIT_THRESHOLD:
            print("Left drum hit!")
            pyautogui.press('a')
            right_hand_down = True
        elif right_hand_down and rel_right < RESET_THRESHOLD:
            right_hand_down = False

        # Draw pose landmarks on top of purple silhouette
        mp_drawing.draw_landmarks(
            output_frame, pose_results.pose_landmarks, mp_pose.POSE_CONNECTIONS,
            mp_drawing.DrawingSpec(color=(0, 255, 255), thickness=2, circle_radius=2),
            mp_drawing.DrawingSpec(color=(0, 255, 255), thickness=2)
        )

        # Draw wrist markers
        cv2.circle(output_frame, (int(lm[15].x * w), int(left_wrist_y)), 6, (255, 255, 255), -1)
        cv2.circle(output_frame, (int(lm[16].x * w), int(right_wrist_y)), 6, (255, 255, 255), -1)

    # --- FPS display ---
    frame_count += 1
    if frame_count % 30 == 0:
        fps_end_time = cv2.getTickCount()
        fps = 30.0 / ((fps_end_time - fps_start_time) / cv2.getTickFrequency())
        fps_start_time = fps_end_time
        cv2.putText(output_frame, f"FPS: {fps:.1f}", (10, 30),
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)

    cv2.imshow("Drum Detector with Visualization", output_frame)
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
