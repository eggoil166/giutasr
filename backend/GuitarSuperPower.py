#OpenCV gesture tracker with keyboard simulation for web frontend

import cv2
import mediapipe as mp
import numpy as np
import time
from pynput import keyboard
from pynput.keyboard import Key, Listener
import threading

# Initialize MediaPipe solutions
mp_selfie_segmentation = mp.solutions.selfie_segmentation
mp_hands = mp.solutions.hands
mp_pose = mp.solutions.pose
mp_drawing = mp.solutions.drawing_utils

# Initialize models with optimized settings for high FPS
segmentation = mp_selfie_segmentation.SelfieSegmentation(model_selection=1)
hands = mp_hands.Hands(
    static_image_mode=False,
    max_num_hands=2,
    min_detection_confidence=0.5,
    min_tracking_confidence=0.3,
    model_complexity=0
)

# Initialize pose detection for shoulder tracking
pose = mp_pose.Pose(
    static_image_mode=False,
    min_detection_confidence=0.5,
    min_tracking_confidence=0.3
)

# Keyboard controller
keyboard_controller = keyboard.Controller()

# Global state for keyboard simulation
spacebar_pressed = False
last_gesture_time = 0
gesture_cooldown = 0.1  # 100ms cooldown between gesture checks

# Open webcam with optimized settings
cap = cv2.VideoCapture(0)
cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
cap.set(cv2.CAP_PROP_FPS, 30)
cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)

# Performance tracking
frame_count = 0
fps_start_time = cv2.getTickCount()

# Rainbow/neon color animation variables
rainbow_start_time = time.time()
rainbow_speed = 2.0  # Speed of color cycling

def count_fingers_above_shoulders(hand_landmarks, pose_landmarks, frame_height, frame_width):
    """Count fingers that are above the shoulder level"""
    if not pose_landmarks or not hand_landmarks:
        return 0
    
    # Get shoulder landmarks (left and right shoulder)
    left_shoulder = pose_landmarks.landmark[mp_pose.PoseLandmark.LEFT_SHOULDER]
    right_shoulder = pose_landmarks.landmark[mp_pose.PoseLandmark.RIGHT_SHOULDER]
    
    # Calculate average shoulder height
    shoulder_y = (left_shoulder.y + right_shoulder.y) / 2
    
    # Count fingers above shoulder level
    finger_tips = [4, 8, 12, 16, 20]  # Thumb, Index, Middle, Ring, Pinky tips
    fingers_above = 0
    
    for tip_idx in finger_tips:
        finger_tip = hand_landmarks.landmark[tip_idx]
        if finger_tip.y < shoulder_y:  # Above shoulder (y is smaller when higher)
            fingers_above += 1
    
    return fingers_above

def simulate_keyboard_input(should_press_spacebar):
    """Simulate keyboard input based on gesture detection"""
    global spacebar_pressed
    
    if should_press_spacebar and not spacebar_pressed:
        keyboard_controller.press(Key.space)
        spacebar_pressed = True
        print("SPACEBAR PRESSED - Gesture detected!")
    elif not should_press_spacebar and spacebar_pressed:
        keyboard_controller.release(Key.space)
        spacebar_pressed = False
        print("SPACEBAR RELEASED - Gesture ended!")

def get_rainbow_color(time_offset=0):
    """Generate rainbow color based on time for cycling effect"""
    current_time = time.time() + time_offset
    cycle = (current_time * rainbow_speed) % (2 * np.pi)
    
    # Create smooth color transitions
    r = int(255 * (0.5 + 0.5 * np.sin(cycle)))
    g = int(255 * (0.5 + 0.5 * np.sin(cycle + 2 * np.pi / 3)))
    b = int(255 * (0.5 + 0.5 * np.sin(cycle + 4 * np.pi / 3)))
    
    return (b, g, r)  # BGR format for OpenCV

def get_neon_person_color():
    """Generate neon rainbow color for person silhouette with fade effect"""
    current_time = time.time()
    cycle = (current_time * rainbow_speed) % (2 * np.pi)
    
    # Create neon colors with higher intensity
    r = int(255 * (0.7 + 0.3 * np.sin(cycle)))
    g = int(255 * (0.7 + 0.3 * np.sin(cycle + 2 * np.pi / 3)))
    b = int(255 * (0.7 + 0.3 * np.sin(cycle + 4 * np.pi / 3)))
    
    # Add neon glow effect with fade
    intensity = 0.8 + 0.2 * np.sin(cycle * 2)
    r = int(r * intensity)
    g = int(g * intensity)
    b = int(b * intensity)
    
    return (b, g, r)  # BGR format for OpenCV

def get_neon_outline_color():
    """Generate neon rainbow color for outline with different phase"""
    current_time = time.time()
    cycle = (current_time * rainbow_speed + np.pi) % (2 * np.pi)  # Offset phase
    
    # Create neon colors with higher intensity
    r = int(255 * (0.8 + 0.2 * np.sin(cycle)))
    g = int(255 * (0.8 + 0.2 * np.sin(cycle + 2 * np.pi / 3)))
    b = int(255 * (0.8 + 0.2 * np.sin(cycle + 4 * np.pi / 3)))
    
    # Add neon glow effect
    intensity = 0.9 + 0.1 * np.sin(cycle * 3)
    r = int(r * intensity)
    g = int(g * intensity)
    b = int(b * intensity)
    
    return (b, g, r)  # BGR format for OpenCV

while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        break

    # Convert to RGB (MediaPipe expects RGB input)
    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

    # Process frame with segmentation model
    segmentation_results = segmentation.process(rgb_frame)
    
    # Process frame with hand detection
    hand_results = hands.process(rgb_frame)
    
    # Process frame with pose detection
    pose_results = pose.process(rgb_frame)

    # Create base mask from body segmentation
    full_body_mask = segmentation_results.segmentation_mask > 0.5
    
    # Find the largest connected component (closest/most prominent person)
    body_mask = np.zeros_like(full_body_mask, dtype=bool)
    if np.any(full_body_mask):
        num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(
            full_body_mask.astype(np.uint8), connectivity=8
        )
        
        if num_labels > 1:
            largest_component = 1
            largest_area = stats[1, cv2.CC_STAT_AREA]
            
            for i in range(2, num_labels):
                if stats[i, cv2.CC_STAT_AREA] > largest_area:
                    largest_area = stats[i, cv2.CC_STAT_AREA]
                    largest_component = i
            
            body_mask = (labels == largest_component)
        else:
            body_mask = full_body_mask
    
    # Optimized hand mask creation - only for hands belonging to tracked person
    hand_mask = np.zeros(frame.shape[:2], dtype=bool)
    
    # Gesture detection variables
    total_fingers_above_shoulders = 0
    gesture_detected = False
    
    if hand_results.multi_hand_landmarks:
        h, w = frame.shape[:2]
        for hand_landmarks in hand_results.multi_hand_landmarks:
            # Get wrist position to check if hand belongs to tracked person
            wrist = hand_landmarks.landmark[0]
            wrist_x = int(wrist.x * w)
            wrist_y = int(wrist.y * h)
            
            # Check if wrist is within the tracked person's body area
            buffer_size = 50
            wrist_in_person = False
            
            for dx in range(-buffer_size, buffer_size + 1, 10):
                for dy in range(-buffer_size, buffer_size + 1, 10):
                    check_x = max(0, min(w-1, wrist_x + dx))
                    check_y = max(0, min(h-1, wrist_y + dy))
                    if body_mask[check_y, check_x]:
                        wrist_in_person = True
                        break
                if wrist_in_person:
                    break
            
            # Only process hands that belong to the tracked person
            if wrist_in_person:
                # Count fingers above shoulders for gesture detection
                fingers_above = count_fingers_above_shoulders(
                    hand_landmarks, pose_results.pose_landmarks, h, w
                )
                total_fingers_above_shoulders += fingers_above
                
                # Create hand mask
                key_points = [4, 8, 12, 16, 20]
                hand_points = []
                
                for idx in key_points:
                    landmark = hand_landmarks.landmark[idx]
                    x = int(landmark.x * w)
                    y = int(landmark.y * h)
                    hand_points.append([x, y])
                
                hand_points.append([wrist_x, wrist_y])
                
                if len(hand_points) >= 3:
                    hand_points = np.array(hand_points, dtype=np.int32)
                    hull = cv2.convexHull(hand_points)
                    
                    temp_mask = np.zeros((h, w), dtype=np.uint8)
                    cv2.fillPoly(temp_mask, [hull], 255)
                    hand_mask = hand_mask | (temp_mask > 0)
    
    # Check gesture condition: 2+ fingers above shoulders on each hand
    if total_fingers_above_shoulders >= 4:  # At least 2 fingers per hand
        gesture_detected = True
    
    # Simulate keyboard input with cooldown
    current_time = time.time()
    if current_time - last_gesture_time > gesture_cooldown:
        simulate_keyboard_input(gesture_detected)
        last_gesture_time = current_time
    
    # Create black background
    output_frame = np.zeros_like(frame)
    
    # Draw stickman using pose landmarks
    if pose_results.pose_landmarks:
        h, w = frame.shape[:2]
        rainbow_color = get_neon_person_color()
        
        # Get pose landmarks
        landmarks = pose_results.pose_landmarks.landmark
        
        # Define stickman connections (simplified skeleton)
        connections = [
            # Head to shoulders
            (mp_pose.PoseLandmark.NOSE, mp_pose.PoseLandmark.LEFT_EAR),
            (mp_pose.PoseLandmark.NOSE, mp_pose.PoseLandmark.RIGHT_EAR),
            (mp_pose.PoseLandmark.LEFT_EAR, mp_pose.PoseLandmark.LEFT_SHOULDER),
            (mp_pose.PoseLandmark.RIGHT_EAR, mp_pose.PoseLandmark.RIGHT_SHOULDER),
            
            # Torso
            (mp_pose.PoseLandmark.LEFT_SHOULDER, mp_pose.PoseLandmark.RIGHT_SHOULDER),
            (mp_pose.PoseLandmark.LEFT_SHOULDER, mp_pose.PoseLandmark.LEFT_HIP),
            (mp_pose.PoseLandmark.RIGHT_SHOULDER, mp_pose.PoseLandmark.RIGHT_HIP),
            (mp_pose.PoseLandmark.LEFT_HIP, mp_pose.PoseLandmark.RIGHT_HIP),
            
            # Arms
            (mp_pose.PoseLandmark.LEFT_SHOULDER, mp_pose.PoseLandmark.LEFT_ELBOW),
            (mp_pose.PoseLandmark.LEFT_ELBOW, mp_pose.PoseLandmark.LEFT_WRIST),
            (mp_pose.PoseLandmark.RIGHT_SHOULDER, mp_pose.PoseLandmark.RIGHT_ELBOW),
            (mp_pose.PoseLandmark.RIGHT_ELBOW, mp_pose.PoseLandmark.RIGHT_WRIST),
            
            # Legs
            (mp_pose.PoseLandmark.LEFT_HIP, mp_pose.PoseLandmark.LEFT_KNEE),
            (mp_pose.PoseLandmark.LEFT_KNEE, mp_pose.PoseLandmark.LEFT_ANKLE),
            (mp_pose.PoseLandmark.RIGHT_HIP, mp_pose.PoseLandmark.RIGHT_KNEE),
            (mp_pose.PoseLandmark.RIGHT_KNEE, mp_pose.PoseLandmark.RIGHT_ANKLE),
        ]
        
        # Draw stickman lines
        for connection in connections:
            start_landmark = landmarks[connection[0]]
            end_landmark = landmarks[connection[1]]
            
            # Convert to pixel coordinates
            start_x = int(start_landmark.x * w)
            start_y = int(start_landmark.y * h)
            end_x = int(end_landmark.x * w)
            end_y = int(end_landmark.y * h)
            
            # Draw thick line for stickman
            cv2.line(output_frame, (start_x, start_y), (end_x, end_y), rainbow_color, 8)
        
        # Draw joints as circles
        joint_landmarks = [
            mp_pose.PoseLandmark.NOSE,
            mp_pose.PoseLandmark.LEFT_SHOULDER, mp_pose.PoseLandmark.RIGHT_SHOULDER,
            mp_pose.PoseLandmark.LEFT_ELBOW, mp_pose.PoseLandmark.RIGHT_ELBOW,
            mp_pose.PoseLandmark.LEFT_WRIST, mp_pose.PoseLandmark.RIGHT_WRIST,
            mp_pose.PoseLandmark.LEFT_HIP, mp_pose.PoseLandmark.RIGHT_HIP,
            mp_pose.PoseLandmark.LEFT_KNEE, mp_pose.PoseLandmark.RIGHT_KNEE,
            mp_pose.PoseLandmark.LEFT_ANKLE, mp_pose.PoseLandmark.RIGHT_ANKLE
        ]
        
        for joint in joint_landmarks:
            landmark = landmarks[joint]
            x = int(landmark.x * w)
            y = int(landmark.y * h)
            cv2.circle(output_frame, (x, y), 6, rainbow_color, -1)
            # Add white outline to joints
            cv2.circle(output_frame, (x, y), 6, (255, 255, 255), 2)
    
    # Draw hand landmarks with individual finger colors
    if hand_results.multi_hand_landmarks:
        h, w = frame.shape[:2]
        for hand_landmarks in hand_results.multi_hand_landmarks:
            wrist = hand_landmarks.landmark[0]
            wrist_x = int(wrist.x * w)
            wrist_y = int(wrist.y * h)
            
            buffer_size = 50
            wrist_in_person = False
            
            for dx in range(-buffer_size, buffer_size + 1, 10):
                for dy in range(-buffer_size, buffer_size + 1, 10):
                    check_x = max(0, min(w-1, wrist_x + dx))
                    check_y = max(0, min(h-1, wrist_y + dy))
                    if body_mask[check_y, check_x]:
                        wrist_in_person = True
                        break
                if wrist_in_person:
                    break
            
            if wrist_in_person:
                # Draw individual finger points with different colors
                finger_colors = [
                    (0, 255, 0),    # Thumb - Green
                    (255, 0, 0),    # Index - Blue  
                    (0, 0, 255),    # Middle - Red
                    (255, 255, 0),  # Ring - Cyan
                    (255, 0, 255)   # Pinky - Magenta
                ]
                
                finger_points = [
                    [4], [8], [12], [16], [20]  # Thumb, Index, Middle, Ring, Pinky tips
                ]
                
                # Draw wrist point
                cv2.circle(output_frame, (wrist_x, wrist_y), 4, (255, 255, 255), -1)
                
                # Draw each finger tip with different colors
                for finger_idx, finger_tips in enumerate(finger_points):
                    color = finger_colors[finger_idx]
                    for tip_idx in finger_tips:
                        landmark = hand_landmarks.landmark[tip_idx]
                        x = int(landmark.x * w)
                        y = int(landmark.y * h)
                        cv2.circle(output_frame, (x, y), 4, color, -1)
    
    # Draw pose landmarks for shoulder reference
    if pose_results.pose_landmarks:
        mp_drawing.draw_landmarks(
            output_frame, pose_results.pose_landmarks, mp_pose.POSE_CONNECTIONS,
            mp_drawing.DrawingSpec(color=(0, 255, 255), thickness=2, circle_radius=2),
            mp_drawing.DrawingSpec(color=(0, 255, 255), thickness=2)
        )
    
    # Display gesture status
    status_text = "GESTURE ACTIVE" if gesture_detected else "NO GESTURE"
    status_color = (0, 255, 0) if gesture_detected else (0, 0, 255)
    cv2.putText(output_frame, status_text, (10, 60), 
               cv2.FONT_HERSHEY_SIMPLEX, 1, status_color, 2)
    
    # Display finger count
    cv2.putText(output_frame, f"Fingers above shoulders: {total_fingers_above_shoulders}", 
               (10, 90), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
    
    # Calculate and display FPS
    frame_count += 1
    if frame_count % 30 == 0:
        fps_end_time = cv2.getTickCount()
        fps = 30.0 / ((fps_end_time - fps_start_time) / cv2.getTickFrequency())
        fps_start_time = fps_end_time
        cv2.putText(output_frame, f"FPS: {fps:.1f}", (10, 30), 
                   cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)

    # Show the result
    cv2.imshow("Gesture Tracker with Keyboard Simulation", output_frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

# Clean up
if spacebar_pressed:
    keyboard_controller.release(Key.space)
cap.release()
cv2.destroyAllWindows()
