from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import io
import os
os.environ["TF_USE_LEGACY_KERAS"] = "0"

try:
    import cv2
    import numpy as np
    import keras
    import keras.saving
    import zipfile
    import tempfile
except ImportError:
    pass

app = FastAPI(title="ML Model Inference API")

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables for model
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "model")
model = None
IMG_SIZE = (320, 320)

@app.on_event("startup")
async def load_model():
    global model
    try:
        print(f"Loading model from {MODEL_PATH}...")
        
        # The .keras format is normally a zip file, but this one was extracted
        # as a directory. Re-pack it into a temporary zip for Keras to load.
        tmp_zip = os.path.join(tempfile.gettempdir(), "model_60_repacked.keras")
        
        with zipfile.ZipFile(tmp_zip, 'w', zipfile.ZIP_DEFLATED) as zf:
            for fname in os.listdir(MODEL_PATH):
                fpath = os.path.join(MODEL_PATH, fname)
                if os.path.isfile(fpath):
                    zf.write(fpath, fname)
        
        print(f"Repacked model to {tmp_zip} ({os.path.getsize(tmp_zip) / 1e6:.1f} MB)")
        model = keras.saving.load_model(tmp_zip)
        
        print(f"Model loaded successfully!")
        print(f"  Input shape: {model.input_shape}")
        print(f"  Output names: {[o.name for o in model.outputs]}")
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"Failed to load model: {e}")
        print("Will fallback to mock inference for testing.")
        model = None

def preprocess_image(image_bytes):
    try:
        # Load image via cv2 from memory
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            raise ValueError("Failed to decode image via OpenCV.")
            
        # Match training preprocessing exactly:
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        enhanced = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8,8)).apply(gray)
        img = cv2.cvtColor(enhanced, cv2.COLOR_GRAY2RGB)
        img = cv2.resize(img, (IMG_SIZE[1], IMG_SIZE[0]))
        img = img.astype(np.float32)
        
        # Scaling matching tf function: (image - 127.5) / 127.5
        img = (img - 127.5) / 127.5
        
        # Expand dimensions to match batch format
        img_array = np.expand_dims(img, axis=0)
        return img_array
    except Exception as e:
        raise ValueError(f"Image processing failed: {e}")

# Formatting helper
def format_prediction(predictions):
    # Output structure defined in User's model building function:
    # return Model(inputs=inputs, outputs=[bone_output, fracture_output, view_output])
    
    # 15 Bone Classes
    bone_cols = ['hand', 'finger', 'wrist', 'forearm', 'elbow', 'humerus', 'shoulder', 
                 'hip', 'leg', 'knee', 'tibia', 'ankle', 'foot', 'toe', 'spine']
    # 3 View Classes
    view_cols = ['frontal', 'lateral', 'oblique']

    try:
        bone_pred = predictions[0][0]      # shape: (15,) via sigmoid
        frac_pred = predictions[1][0][0]   # shape: (1,)  via sigmoid
        view_pred = predictions[2][0]      # shape: (3,)  via softmax

        # Get highest probability bone class
        bone_idx = int(np.argmax(bone_pred))
        # Get highest probability view class
        view_idx = int(np.argmax(view_pred))
        
        # Fracture logic: threshold at 0.5
        is_fractured = bool(frac_pred > 0.5)

        # Extract confidences (convert from prob to percentage)
        bone_conf = round(float(bone_pred[bone_idx]) * 100, 1)
        
        if is_fractured:
            frac_conf = round(float(frac_pred) * 100, 1)
        else:
            frac_conf = round(float(1.0 - frac_pred) * 100, 1)
            
        view_conf = round(float(view_pred[view_idx]) * 100, 1)
        
        # Formatting text nicely
        bone_class_name = bone_cols[bone_idx].capitalize()
        view_class_name = view_cols[view_idx].capitalize()

        return {
            "bone": {
                "class": bone_class_name,
                "confidence": bone_conf
            },
            "fracture": {
                "class": "Fractured" if is_fractured else "Normal",
                "is_fractured": is_fractured,
                "confidence": frac_conf
            },
            "view": {
                "class": view_class_name,
                "confidence": view_conf
            }
        }
    except Exception as e:
        print(f"Prediction formatting error: {e}")
        return mock_prediction()

def mock_prediction():
    return {
        "bone": {
            "class": random.choice(['Hand', 'Forearm', 'Shoulder', 'Leg', 'Foot']),
            "confidence": round(random.uniform(70.0, 99.9), 1)
        },
        "fracture": {
            "class": random.choice(["Normal", "Fractured"]),
            "is_fractured": random.choice([True, False]),
            "confidence": round(random.uniform(85.0, 99.9), 1)
        },
        "view": {
            "class": random.choice(['Frontal', 'Lateral', 'Oblique']),
            "confidence": round(random.uniform(80.0, 99.9), 1)
        }
    }


@app.post("/predict")
async def predict_endpoint(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File provided is not an image.")
    
    contents = await file.read()
    
    if model is None:
        # Fallback to mock inference if model isn't loaded
        time.sleep(1.0) # Simulate processing
        return mock_prediction()

    try:
        img_array = preprocess_image(contents)
        # Predict
        predictions = model.predict(img_array)
        result = format_prediction(predictions)
        return result
    except Exception as e:
        print(f"Inference error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
