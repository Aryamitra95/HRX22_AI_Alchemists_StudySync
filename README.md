# StudySync

**StudySync** is an educational tool integrating YouTube video playback, AI-powered summarization, and real-time concentration tracking. The backend leverages `asutoshp10/ConcentrationBackend` for analytics, while the frontend handles user interaction and video management.

---

## Features

- **YouTube Video Integration**: Play and manage YouTube videos directly.
- **AI Summarization**: Automatically generate concise summaries and quiz questions from video transcripts.
- **Focus Tracking**: Monitor concentration levels during study sessions using webcam input.
- **Session Reports**: Access historical data and performance metrics.
- **Quiz Generation**: Create assessments from video content.

---

## Setup

### Prerequisites

- **Python 3.8+**
- **Node.js v16+**
- **Google Cloud API key** (for YouTube integration)

### Installation

Clone repositories
git clone https://github.com/Aryamitra95/HRX22_AI_Alchemists_StudySync
git clone https://github.com/asutoshp10/ConcentrationBackend

Install frontend dependencies
cd HRX22_AI_Alchemists_StudySync/frontend
npm install

Setup backend
cd ../../ConcentrationBackend
pip install -r requirements.txt

---

## Configuration

1. **Backend Setup**

   Create `.env` file in the backend directory:

2. **Frontend Setup**

Update `frontend/src/services/api.js` with your backend URL:
const BASE_URL = "http://localhost:5000"; // ConcentrationBackend URL
---

## Usage

1. **Start Backend Service**

cd ConcentrationBackend
python app.py

text

2. **Launch Frontend**

cd HRX22_AI_Alchemists_StudySync/frontend
npm start

text

3. **Core Workflow**

- **Video Summarization**
  - Paste a YouTube URL and click "Generate Summary".
  - View key points and quiz questions.
- **Concentration Tracking**
  - Enable webcam during study sessions.
  - Monitor real-time focus metrics.
- **Session Reports**
  - Access historical data via the `/reports` endpoint.

---

## Troubleshooting

- **Quiz Generation Failures**: Ensure video transcripts are enabled on YouTube.
- **Concentration Model Errors**: Verify camera permissions and model path in `.env`.
- **API Connection Issues**: Check CORS settings in the backend configuration.

---

## Contribution

For contribution guidelines and known issues, visit the [project wiki](https://github.com/Aryamitra95/HRX22_AI_Alchemists_StudySync).

