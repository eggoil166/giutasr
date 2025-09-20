import cv2
import mediapipe as mp
import pyautogui

# --- Setup ---
mp_pose = mp.solutions.pose
pose = mp_pose.Pose()
mp_draw = mp.solutions.drawing_utils

cap = cv2.VideoCapture(0)

# Detection thresholds (pixels)
HIT_THRESHOLD = 40    # hand must be this far below shoulder to trigger
RESET_THRESHOLD = 20  # hand must come this far above shoulder to reset

# Edge detection states
left_hand_down = False
right_hand_down = False

while True:
    ret, frame = cap.read()
    if not ret:
        break
    frame = cv2.flip(frame, 1)
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = pose.process(rgb)

    if results.pose_landmarks:
        mp_draw.draw_landmarks(frame, results.pose_landmarks, mp_pose.POSE_CONNECTIONS)
        lm = results.pose_landmarks.landmark

        # --- Wrist and shoulder positions ---
        left_shoulder_y = lm[11].y * frame.shape[0]
        right_shoulder_y = lm[12].y * frame.shape[0]
        left_wrist_y = lm[15].y * frame.shape[0]
        right_wrist_y = lm[16].y * frame.shape[0]

        # --- Relative positions (wrist - shoulder) ---
        rel_left = left_wrist_y - left_shoulder_y
        rel_right = right_wrist_y - right_shoulder_y

        # --- Edge-triggered detection ---
        # LEFT HAND triggers RIGHT DRUM (reversed)
        if not left_hand_down and rel_left > HIT_THRESHOLD:
            print("Right drum hit!")
            pyautogui.press('l')
            left_hand_down = True
        elif left_hand_down and rel_left < RESET_THRESHOLD:
            left_hand_down = False  # reset

        # RIGHT HAND triggers LEFT DRUM (reversed)
        if not right_hand_down and rel_right > HIT_THRESHOLD:
            print("Left drum hit!")
            pyautogui.press('a')
            right_hand_down = True
        elif right_hand_down and rel_right < RESET_THRESHOLD:
            right_hand_down = False  # reset

        # --- Optional visualization ---
        cv2.putText(frame, f"L_rel: {rel_left:.1f}", (10,30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0,255,0), 2)
        cv2.putText(frame, f"R_rel: {rel_right:.1f}", (10,60), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0,0,255), 2)

    cv2.imshow("Simple Drum Detector", frame)
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
