# ⚡ Sustainable Energy Monitoring & Optimization System (PulseGrid)

A real-time, vision-grounded digital twin application designed for sustainable energy monitoring, anomaly detection (Unexplained Load), what-if scenario simulations, and AI-driven energy optimization.

---

## 🚀 Key Features

- **2.5D Isometric Digital Twin**: Live floor plan visualization mapping energy zones, active equipment, and thermal/power intensity.
- **Unexplained Load (UL) Detection**: Real-time detection of energy waste and phantom loads.
- **Vision-Grounded Energy Advisor**: Integrated AI advisor that contextualizes live telemetry and operational parameters.
- **What-If Scenario Simulator**: Simulate operational changes (HVAC setbacks, equipment scheduling, peak shaving) to project cost and carbon savings.
- **Optimization Center**: Automated recommendations for energy reduction and peak load management.

---

## 🛠️ Architecture & Tech Stack

- **Frontend**: Next.js 15 (App Router), React, TypeScript, Tailwind CSS, Lucide Icons.
- **Backend**: FastAPI, Python 3.11+, Uvicorn, Pydantic.
- **Telemetry & Models**: Simulated live telemetry feeds, anomaly detection engine, digital twin mapping.

---

## 💻 Getting Started Locally

### 1. Prerequisites
- **Node.js** (v18+ recommended)
- **Python** (v3.11+ recommended)

### 2. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Create and activate virtual environment
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On macOS/Linux:
source .venv/bin/activate

# Install dependencies and start server
pip install fastapi uvicorn pydantic
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
> FastAPI Swagger documentation will be available at [http://localhost:8000/docs](http://localhost:8000/docs).

### 3. Frontend Setup
```bash
# Navigate to web directory
cd web

# Install dependencies
npm install

# Start development server
npm run dev
```
> Web Dashboard will be available at [http://localhost:3000](http://localhost:3000).

---

## 🌐 Deploying Frontend to Vercel

The frontend is a Next.js 16 application located in the `web` directory.

### Method 1: Via Vercel Web Dashboard (Recommended)
1. Log in to [Vercel](https://vercel.com) and click **"Add New..." > "Project"**.
2. Import the Git repository: `Sustainable-Energy-Monitoring-AnD-Optimization`.
3. In the project configuration:
   - **Framework Preset**: `Next.js`
   - **Root Directory**: Click **Edit** and select `web`
4. *(Optional)* Under **Environment Variables**, add:
   - `NEXT_PUBLIC_API_URL`: URL of your hosted FastAPI backend (e.g., `https://your-backend.onrender.com`). If omitted, PulseGrid uses built-in fallback simulation data.
5. Click **Deploy**.

### Method 2: Via Vercel CLI
```bash
# Navigate to web directory
cd web

# Deploy preview
npx vercel

# Deploy production
npx vercel --prod
```

---

## 📄 License
MIT License.
