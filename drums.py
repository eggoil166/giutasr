import cv2
import mediapipe as mp
import numpy as np
import time
import colorsys
import pyautogui

# --- Setup MediaPipe ---
mp_pose = mp.solutions.pose
pose = mp_pose.Pose()

cap = cv2.VideoCapture(0)

mp_selfie_segmentation = mp.solutions.selfie_segmentation
segment = mp_selfie_segmentation.SelfieSegmentation(model_selection=1)

# --- Detection thresholds ---
HIT_THRESHOLD = 40
RESET_THRESHOLD = 20

left_hand_down = False
right_hand_down = False

# --- Visual state ---
prev_frame = None
flash_timer = 0
FLASH_DURATION = 0.08  # very brief flash

# Pairs of landmarks to connect (stick figure skeleton)
SKELETON_CONNECTIONS = [
    (11, 12),  # shoulders
    (11, 13), (13, 15),  # left arm
    (12, 14), (14, 16),  # right arm
    (11, 23), (12, 24),  # torso
    (23, 24),  # hips
    (23, 25), (25, 27),  # left leg
    (24, 26), (26, 28)   # right leg
]

# Basic face landmarks we care about (nose, eyes, ears)
FACE_POINTS = [0, 1, 2, 3, 4]

while True:
    ret, frame = cap.read()
    if not ret:
        break
    frame = cv2.flip(frame, 1)
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

    results = pose.process(rgb)

    h, w = frame.shape[:2]
    output_frame = np.zeros_like(frame)
    rel_left, rel_right = 0, 0

    if results.pose_landmarks:
        lm = results.pose_landmarks.landmark

        

        # Wrist/shoulder positions
        left_shoulder_y = lm[11].y * h
        right_shoulder_y = lm[12].y * h
        left_wrist_y = lm[15].y * h
        right_wrist_y = lm[16].y * h

        rel_left = left_wrist_y - left_shoulder_y
        rel_right = right_wrist_y - right_shoulder_y

        # --- Drum hit logic ---
        if not left_hand_down and rel_left > HIT_THRESHOLD:
            pyautogui.press('l')
            left_hand_down = True
            flash_timer = time.time()
            print("right hit")
        elif left_hand_down and rel_left < RESET_THRESHOLD:
            left_hand_down = False

        if not right_hand_down and rel_right > HIT_THRESHOLD:
            pyautogui.press('a')
            right_hand_down = True
            flash_timer = time.time()
            print("left hit")
        elif right_hand_down and rel_right < RESET_THRESHOLD:
            right_hand_down = False

        # --- Psychedelic color ---
        hue = (time.time() * 0.5) % 1.0
        rgb_color = colorsys.hsv_to_rgb(hue, 1.0, 1.0)
        psychedelic_color = (
            int(rgb_color[2]*255),
            int(rgb_color[1]*255),
            int(rgb_color[0]*255)
        )

        # --- Draw skeleton ---
        for a, b in SKELETON_CONNECTIONS:
            ax, ay = int(lm[a].x * w), int(lm[a].y * h)
            bx, by = int(lm[b].x * w), int(lm[b].y * h)
            cv2.line(output_frame, (ax, ay), (bx, by), psychedelic_color, 6)

        # --- Draw joints ---
        for idx in [11,12,13,14,15,16,23,24,25,26,27,28]:
            x, y = int(lm[idx].x * w), int(lm[idx].y * h)
            cv2.circle(output_frame, (x, y), 8, psychedelic_color, -1)

    # --- Motion trails ---
    if prev_frame is not None:
        output_frame = cv2.addWeighted(output_frame, 0.7, prev_frame, 0.3, 0)
    prev_frame = output_frame.copy()

    # --- Full screen flash ---
    now = time.time()
    if now - flash_timer < FLASH_DURATION:
        white_overlay = np.full_like(output_frame, 255)
        alpha = 1 - ((now - flash_timer) / FLASH_DURATION)
        output_frame = cv2.addWeighted(white_overlay, alpha, output_frame, 1 - alpha, 0)

    seg_results = segment.process(rgb)

    if seg_results.segmentation_mask is not None:
        mask = seg_results.segmentation_mask
        # Threshold to get binary mask
        binary_mask = (mask > 0.5).astype(np.uint8) * 255

        # Find contours of person
        contours, _ = cv2.findContours(binary_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        # Draw thick white outline
        cv2.drawContours(output_frame, contours, -1, (255, 255, 255), 5)

    # Debug text
    cv2.putText(output_frame, f"L:{rel_left:.1f} R:{rel_right:.1f}",
                (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7,
                (255, 255, 255), 2)

    cv2.imshow("Psychedelic Stick Figure + Head", output_frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
