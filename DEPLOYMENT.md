# Pharmacy Management System — Deployment Guide

## Quick Start (Local Development)

### 1. Backend

```bash
cd backend
python -m venv venv

# Windows
.\venv\Scripts\activate

# Mac/Linux
source venv/bin/activate

pip install -r requirements.txt

# Copy and fill in environment variables
cp .env.example .env

uvicorn app.main:app --reload --port 8000
```

Swagger docs available at: **http://localhost:8000/docs**

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

App available at: **http://localhost:5173**

---

## Environment Variables (backend/.env)

| Variable | Description |
|---|---|
| `MONGODB_URL` | MongoDB connection string (Atlas or local) |
| `DATABASE_NAME` | MongoDB database name (`pharmacy_db`) |
| `SECRET_KEY` | JWT secret key — use a long random string |
| `ALGORITHM` | JWT algorithm (`HS256`) |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token lifetime in minutes (`1440` = 1 day) |

---

## Production Deployment

### Backend — Docker

```bash
cd backend
docker build -t pharmacare-backend .
docker run -d -p 8000:8000 \
  -e MONGODB_URL="your-atlas-url" \
  -e SECRET_KEY="your-secret-key" \
  pharmacare-backend
```

### Frontend — Vercel

1. Push the `frontend/` folder to GitHub.
2. Import the repo in [Vercel](https://vercel.com).
3. Set root directory to `frontend`.
4. Add environment variable: `VITE_API_URL=https://your-backend.com`

> **Update** `frontend/src/services/api.js` `baseURL` to use `import.meta.env.VITE_API_URL` for production.

### Database — MongoDB Atlas

1. Create a free cluster at [atlas.mongodb.com](https://cloud.mongodb.com).
2. Create a database user with read/write access.
3. Whitelist your server IP (or `0.0.0.0/0` for dev).
4. Copy the connection string and set it as `MONGODB_URL`.

---

## Default Admin Setup

Register the first admin via the API:

```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name": "Admin", "email": "admin@pharmacy.com", "password": "Admin@1234", "role": "Admin"}'
```

---

## Folder Structure

```
pharmacy-management-system/
├── backend/
│   ├── app/
│   │   ├── api/            # Route handlers
│   │   ├── models/         # DB operations
│   │   ├── schemas/        # Pydantic models
│   │   ├── utils/          # JWT + password helpers
│   │   ├── database/       # MongoDB connection
│   │   ├── config.py       # Settings
│   │   └── main.py         # App entry point
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
└── frontend/
    └── src/
        ├── components/     # Navbar, Sidebar, Charts
        ├── context/        # Auth context
        ├── pages/          # All 7 pages
        ├── routes/         # ProtectedRoute
        ├── services/       # axios api.js
        └── App.jsx
```
