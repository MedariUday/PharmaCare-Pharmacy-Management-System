# Pharmacy Management System - VS Code Setup Guide

To run this project in VS Code, follow these steps to start both the **Backend** and **Frontend**.

## 1. Open the Project
Open the root directory `pharmacy management system` in VS Code.

## 2. Start the Backend (FastAPI)
1. Open a new terminal in VS Code (`Ctrl + ` `).
2. Change directory to backend:
   ```powershell
   cd backend
   ```
3. Activate the virtual environment:
   ```powershell
   .\venv\Scripts\activate
   ```
4. Start the server with reload:
   ```powershell
   uvicorn app.main:app --reload --port 8000
   ```
   *The backend is now live at http://localhost:8000/docs*

## 3. Start the Frontend (Vite + React)
1. Open a **second** terminal tab in VS Code (click the `+` icon in the terminal panel).
2. Change directory to frontend:
   ```powershell
   cd frontend
   ```
3. Install dependencies (only required the first time):
   ```powershell
   npm install
   ```
4. Start the development server:
   ```powershell
   npm run dev
   ```
   *The frontend is now live at http://localhost:5173*

---

## 💡 Quick Tips for VS Code
- **Splitting Terminals**: You can click the "Split Terminal" icon (middle-right of terminal bar) to see both Backend and Frontend logs side-by-side.
- **Environment Variables**: Ensure your `.env` files in both `backend/` and `frontend/` are correctly configured (MongoDB URI, etc.).
