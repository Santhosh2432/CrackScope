# CrackScope — Dev Setup

## Folder Structure
```
crackscope/
├── backend/
│   ├── app.py
│   ├── requirements.txt
│   └── uploads/ & outputs/
└── frontend/
    ├── src/
    │   ├── App.jsx
    │   ├── main.jsx
    │   ├── index.css
    │   └── components/
    │       ├── Header.jsx
    │       ├── UploadZone.jsx
    │       ├── ConfidenceSlider.jsx
    │       ├── ResultView.jsx
    │       ├── DetectionHistory.jsx
    │       └── ReportExport.jsx
    ├── package.json
    ├── vite.config.js
    └── index.html
```

---

## Running the Backend

Open a terminal inside `crackscope/backend/` and run:

```bash
# First time only — install dependencies
pip install -r requirements.txt

# Start the server
uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

Backend runs at: http://localhost:8000

---

## Running the Frontend

Open a second terminal inside `crackscope/frontend/` and run:

```bash
# First time only — install node packages
npm install

# Start dev server
npm run dev
```

Frontend runs at: http://localhost:5173

---

## Notes
- Always start the **backend first**, then the frontend.
- The Vite proxy in `vite.config.js` forwards `/detect`, `/output`, `/health` to port 8000 automatically — no CORS issues.
- Models are loaded from: `../../Result/Wall crack dataset result/best.pt` and `../../Result/window data set results/best.pt`
