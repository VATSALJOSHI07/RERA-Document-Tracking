# RERA-Document-Tracking
# Developer Management System

A full-stack application for managing RERA clients, documents, and payments. It provides a secure backend API (Node.js/Express/MongoDB) and a modern, user-friendly frontend (HTML/JS/CSS) for tracking clients, their required documents, and payment statuses.

## Features
- User authentication (JWT-based)
- Add, edit, delete, and search clients (Developer, Agent, Litigation)
- Track required and custom documents for each client
- Manage payments, record transactions, and view payment history
- Dashboard and search functionality
- Responsive, modern UI (see `documents.html` and `documents2.html`)

## Tech Stack
- **Backend:** Node.js, Express, MongoDB (Mongoose), JWT, bcryptjs
- **Frontend:** HTML, CSS, JavaScript (no framework)
- **Other:** dotenv, cors

## Setup Instructions

### 1. Clone the Repository
```bash
git clone <repo-url>
cd <repo-directory>
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Edit `Environment Variable.env` (or create a `.env` file):
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/developer_management
NODE_ENV=development
# For production, use your MongoDB Atlas URI
```

### 4. Start the Backend Server
```bash
npm start
# or for development with auto-reload:
npm run dev
```
The server will run on `http://localhost:5000` by default.

### 5. Launch the Frontend
You can open `documents.html` or `documents2.html` directly in your browser, or serve them using a static server:
```bash
npx http-server
# or use any static file server
```

## API Endpoints (Brief)
- `POST   /api/register` — Register a new user
- `POST   /api/login` — Login and receive JWT
- `GET    /api/clients` — List all clients (auth required)
- `POST   /api/clients` — Add a new client
- `GET    /api/clients/:id` — Get client details
- `PUT    /api/clients/:id` — Update client
- `DELETE /api/clients/:id` — Delete client
- `GET    /api/documents/:clientId` — Get documents for a client
- `PUT    /api/documents/:clientId` — Update document status
- `POST   /api/documents/:clientId/add` — Add custom document
- `GET    /api/payments/:clientId` — Get payments for a client
- `POST   /api/payments` — Add payment
- `PUT    /api/payments/:id/record` — Record payment transaction
- `DELETE /api/payments/:id` — Delete payment
- `GET    /api/search/clients?q=...` — Search clients

All endpoints (except `/api/register`, `/api/login`, `/api/health`) require a valid JWT in the `Authorization` header.

## Frontend Usage
- Open `documents.html` for a modern, tabbed UI with authentication, client/document/payment management, and search.
- UIs support adding/editing clients, tracking document status, and managing payments.
- Login/register is required for API-backed features (see `documents.html`).

## Environment Variables
- `PORT` — Port for backend server (default: 5000)
- `MONGODB_URI` — MongoDB connection string
- `NODE_ENV` — Set to `development` or `production`
- `JWT_SECRET` — (Optional) Secret for JWT signing (default: `dev_secret_key`)

## License
MIT 
