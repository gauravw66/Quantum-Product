# Deployment Guide: Quantum Product

This guide provides step-by-step instructions to deploy the Quantum Product backend, frontend, and crawler components.

---

## 1. Prerequisites

- Node.js (v18 or higher)
- Python 3.8+
- npm (Node.js package manager)
- (Optional) Qiskit, Scrapy, or other quantum/data libraries
- Git (for version control)

---

## 2. Clone the Repository

```sh
git clone <repo-url>
cd Quantum-Product
```

---

## 3. Backend Deployment

### a. Install Dependencies
```sh
cd backend
npm install
```

### b. Environment Variables
- Copy `.env.example` to `.env` (if exists) and set required variables (API keys, DB tokens, etc.)

### c. Start Backend Server
```sh
npm start
```
Or from the root directory:
```sh
start-backend.bat
```

---

## 4. Frontend Deployment

### a. Install Dependencies
```sh
cd frontend
npm install
```

### b. Start Frontend Server
```sh
npm start
```
Or from the root directory:
```sh
start-frontend.bat
```

---

## 5. Crawler Deployment

### a. Install Node and Python Dependencies
```sh
cd crawler
pip install -r requirements.txt
npm install
```

### b. Run Crawler
```sh
node index.js
# or
node scrapy-crawl.js
```

---

## 6. Additional Notes

- Ensure all required environment variables are set for backend and crawler.
- For production, consider using process managers (e.g., PM2 for Node.js) and secure storage for secrets.
- For cloud deployment, configure hosting (e.g., AWS, Azure, GCP) as per your requirements.

---

## 7. Troubleshooting

- Check logs for errors in backend/frontend terminals.
- Ensure all dependencies are installed and correct versions are used.
- Verify API keys and tokens are valid.

---

## 8. License

MIT
