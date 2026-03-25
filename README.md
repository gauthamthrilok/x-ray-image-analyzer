# X-ray Image Analyzer

An advanced machine learning web application for analyzing X-ray images. It classifies bone types, detects fractures, and identifies the anatomical view (Frontal, Lateral, or Oblique).

## Features
- **Bone Classification**: Identifies 15 different bone types.
- **Fracture Detection**: Uses deep learning to detect potential fractures.
- **View Identification**: Classifies the image perspective.
- **Modern UI**: A premium React interface with smooth animations and dark mode.

## Tech Stack
- **Backend**: FastAPI, TensorFlow, Keras, OpenCV
- **Frontend**: React, Vite, Tailwind CSS

## Prerequisites
- Python 3.11+
- Node.js 18+
- npm

## Setup Instructions

### Backend Setup
1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the server:
   ```bash
   python main.py
   ```

### Frontend Setup
1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## Usage
1. Open your browser and go to `http://localhost:5173`.
2. Upload an X-ray image (JPG, PNG).
3. View the analysis results.

## License
MIT
