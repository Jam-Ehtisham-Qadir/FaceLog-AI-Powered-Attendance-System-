import os
import base64
import json
import concurrent.futures
from openai import OpenAI
from deepface import DeepFace
from django.conf import settings

client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
MINIMUM_CONFIDENCE_THRESHOLD = 0.60


def encode_image_to_base64(image_path):
    with open(image_path, "rb") as f:
        return base64.b64encode(f.read()).decode("utf-8")


def check_liveness(image_path):
    """
    Use GPT-4o-mini Vision for anti-spoofing detection.
    """
    try:
        image_b64 = encode_image_to_base64(image_path)
        prompt = """You are an anti-spoofing system for a face recognition attendance system.

Analyze this image and determine if it shows a LIVE person or a SPOOF attempt.

Spoof indicators:
- Phone or monitor screen showing a face
- Printed photo being held up
- Screen glare, pixels, or display artifacts
- Flat/2D appearance
- Photo edges or borders visible
- Moire patterns from screens
- AI-generated face features

Respond ONLY in this exact JSON format:
{
  "is_live": true or false,
  "confidence": 0.0 to 1.0,
  "reason": "brief explanation under 15 words"
}"""

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{
                "role": "user",
                "content": [
                    {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{image_b64}"}},
                    {"type": "text", "text": prompt}
                ]
            }],
            max_tokens=100
        )

        text = response.choices[0].message.content.strip()
        text = text.replace("```json", "").replace("```", "").strip()
        result = json.loads(text)

        is_live = result.get("is_live", False)
        confidence = result.get("confidence", 0.0)
        reason = result.get("reason", "")

        if is_live:
            return True, reason, float(confidence), float(1.0 - confidence)
        else:
            return False, reason, float(confidence), float(1.0 - confidence)

    except Exception as e:
        print(f"Anti-spoofing error: {e}")
        return True, "Check skipped", 1.0, 0.0


def match_face_single(captured_image_path, employee):
    best_distance = float('inf')
    matched = False

    all_photos = []
    primary_path = os.path.join(settings.MEDIA_ROOT, str(employee.photo))
    if os.path.exists(primary_path):
        all_photos.append(primary_path)

    for extra_photo in employee.extra_photos.all():
        extra_path = os.path.join(settings.MEDIA_ROOT, str(extra_photo.photo))
        if os.path.exists(extra_path):
            all_photos.append(extra_path)

    for photo_path in all_photos:
        try:
            result = DeepFace.verify(
                img1_path=captured_image_path,
                img2_path=photo_path,
                model_name="Facenet",
                enforce_detection=False
            )
            distance = result.get("distance", 1.0)
            if result.get("verified") and distance < best_distance:
                best_distance = distance
                matched = True
        except Exception:
            continue

    return employee, best_distance, matched


def match_face(captured_image_path, registered_employees):
    employees_list = list(registered_employees)
    if not employees_list:
        return None, 0.0

    best_match = None
    best_distance = float('inf')

    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
        futures = {
            executor.submit(match_face_single, captured_image_path, emp): emp
            for emp in employees_list
        }
        for future in concurrent.futures.as_completed(futures):
            try:
                employee, distance, matched = future.result()
                if matched and distance < best_distance:
                    best_distance = distance
                    best_match = employee
            except Exception:
                continue

    if best_match:
        confidence = max(0.0, round(1.0 - best_distance, 2))
        if confidence < MINIMUM_CONFIDENCE_THRESHOLD:
            return None, confidence
        return best_match, confidence

    return None, 0.0


def verify_attendance(image_path, registered_employees):
    """
    Run GPT anti-spoofing + DeepFace matching in parallel.
    """
    employees_list = list(registered_employees)

    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:
        liveness_future = executor.submit(check_liveness, image_path)
        match_future = executor.submit(match_face, image_path, employees_list)

        liveness_result = liveness_future.result()
        match_result = match_future.result()

    return liveness_result, match_result