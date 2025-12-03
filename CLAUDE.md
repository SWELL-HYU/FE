# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Swell** is a fashion recommendation web application with:
- **Backend (BE/)**: FastAPI-based Python REST API for fashion recommendations and virtual fitting
- **Frontend (FE/)**: Next.js 16 React application for the user interface

The application features personalized outfit recommendations, virtual fitting room functionality, user closet management, and integration with LLM services (Google Gemini) for AI-powered styling.

## Repository Structure

```
swell/
├── BE/
│   ├── backend/               # FastAPI application
│   │   ├── app/
│   │   │   ├── api/           # API endpoints (auth, recommendations, outfits, closet, fitting)
│   │   │   ├── services/      # Business logic (auth, recommendations, LLM integration)
│   │   │   ├── models/        # SQLAlchemy ORM models
│   │   │   ├── schemas/       # Pydantic request/response schemas
│   │   │   ├── core/          # Security, exceptions, file utilities
│   │   │   └── db/            # Database configuration
│   │   ├── migrations/        # Alembic database migrations
│   │   ├── scripts/           # Data loading scripts (coordis, items, tags)
│   │   ├── data/              # Sample JSON data files
│   │   ├── main.py            # FastAPI app entry point
│   │   └── docker-compose.yml # PostgreSQL container setup
│   └── README.md
├── FE/
│   ├── app/                   # Next.js App Router pages
│   │   ├── page.tsx           # Landing page
│   │   ├── start/             # Authentication flow
│   │   ├── main/              # Main recommendation feed
│   │   ├── favorites/         # Liked outfits
│   │   ├── closet/            # User closet management
│   │   ├── onboarding/        # User preference setup
│   │   └── layout.tsx         # Root layout
│   ├── components/            # React components
│   │   ├── common/            # Shared components
│   │   ├── features/          # Feature-specific components
│   │   └── layout/            # Layout components
│   ├── lib/                   # API client utilities and services
│   │   ├── api.ts             # Axios instance with interceptors
│   │   ├── auth.ts            # Authentication endpoints
│   │   ├── user.ts            # User profile endpoints
│   │   ├── outfits.ts         # Outfit/recommendation endpoints
│   │   ├── closet.ts          # Closet management endpoints
│   │   ├── fitting.ts         # Virtual fitting endpoints
│   │   └── favorites.ts       # Favorites endpoints
│   ├── hooks/                 # Custom React hooks
│   ├── types/                 # TypeScript type definitions
│   ├── public/                # Static assets
│   │   └── images/            # Image assets
│   │       └── start_bg.png   # Background image for authentication flow
│   ├── package.json           # Frontend dependencies
│   └── tsconfig.json          # TypeScript configuration
└── CLAUDE.md (this file)
```

## Development Setup

### Backend Setup

```bash
cd BE/backend

# Create and activate virtual environment
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Start PostgreSQL container
docker-compose up -d

# Set up environment (.env file)
cp .env.example .env
# Configure DATABASE_URL=postgresql://postgres:postgres@localhost:5432/hci_fashion_db
```

### Frontend Setup

```bash
cd FE

# Install dependencies
npm install
```

## Common Commands

### Backend

```bash
# Run API server (with auto-reload)
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# Alternative
fastapi run

# Access documentation
# API: http://localhost:8000
# Swagger UI: http://localhost:8000/docs
# ReDoc: http://localhost:8000/redoc

# Load initial data
python scripts/load_coordis.py data/coordis_sample.json
python scripts/load_tags.py data/tags_sample.json

# Stop PostgreSQL container
docker-compose down
```

### Frontend

```bash
# Start development server
npm run dev
# Open http://localhost:3000

# Build for production
npm run build

# Run production server
npm start

# Linting
npm run lint
```

## Architecture Highlights

### Backend Architecture

**Database Schema**: PostgreSQL with SQLAlchemy ORM, including:
- User authentication and profiles
- Outfit/coordi catalog with item associations
- User-outfit interactions (likes, skips, view logs)
- Virtual fitting results with images
- User closet items (saved items)
- User preference tags

**Key Services**:
- `auth_service.py`: JWT-based authentication
- `recommendations_service.py`: Personalized outfit recommendations
- `llm_service.py`: Integration with Google Gemini API for outfit suggestions
- `virtual_fitting_service.py`: Virtual fitting room functionality using MediaPipe for pose detection
- `closet_service.py`: User closet management

**API Structure**: Feature-based organization with dedicated routers for:
- Authentication (`/api/auth/`)
- Recommendations (`/api/recommendations/`)
- Outfits (`/api/outfits/`)
- Closet (`/api/closet/`)
- Virtual Fitting (`/api/virtual-fitting/`)
- Users (`/api/users/`)

### Frontend Architecture

**State Management**: Session storage for JWT tokens (stored in `sessionStorage`), passed via axios interceptors.

**API Client Pattern**: Each feature has a dedicated module in `lib/` with typed API calls using axios:
- `api.ts`: Base axios instance with request/response interceptors
- Feature-specific modules (`auth.ts`, `outfits.ts`, etc.) export functions that use the axios instance

**Authentication Flow**:
1. Token stored in `sessionStorage` after login
2. Axios request interceptor automatically adds `Authorization: Bearer {token}` header
3. Response interceptor redirects to `/start` on 401 (token expiration)

**Styling**: Tailwind CSS v4 with PostCSS

## Important Technical Details

### Backend Specifics

- **Python Version**: 3.11 (required)
- **Database**: PostgreSQL (via Docker Compose for development)
- **LLM Integration**: Google Gemini API (requires `GOOGLE_API_KEY` in `.env`)
- **File Storage**: Uploaded files stored in `uploads/` directory (profile pics, fitting results)
- **Image Validation**: MediaPipe used for pose detection in virtual fitting
- **Embeddings**: Sentence-transformers for vector embeddings (recommendations)

### Frontend Specifics

- **Next.js**: v16 with App Router
- **React**: v19
- **API Communication**: Axios with automatic token injection
- **Base URL**: `http://localhost:8000/api` (configured in `lib/api.ts`)
- **Token Storage**: `sessionStorage` (not persistent across browser close)

## Key API Endpoints

### Authentication
- `POST /auth/signup` - User registration
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout
- `GET /auth/me` - Get current user info

### Recommendations
- `GET /recommendations/personalized` - Get personalized outfit recommendations

### Outfits
- `GET /outfits/list` - List all outfits
- `POST /outfits/{outfit_id}/like` - Like an outfit
- `DELETE /outfits/{outfit_id}/like` - Unlike an outfit
- `GET /outfits/favorites` - Get liked outfits
- `POST /outfits/{outfit_id}/skip` - Mark outfit as skipped
- `POST /outfits/{outfit_id}/view` - Log outfit view

### Closet
- `POST /closet/items` - Save item to closet
- `GET /closet/items` - List closet items
- `DELETE /closet/items/{item_id}` - Remove item from closet

### Virtual Fitting
- `POST /virtual-fitting/start` - Initiate fitting session
- `GET /virtual-fitting/status/{session_id}` - Check fitting status
- `GET /virtual-fitting/history` - Get fitting history
- `DELETE /virtual-fitting/history/{session_id}` - Delete fitting result

## Database Initialization

The backend automatically initializes tables on startup via `init_db()` called in the startup event. Initial data is seeded using Python scripts in `scripts/`:
- `load_coordis.py`: Loads outfit data with associated items
- `load_tags.py`: Loads preference tags for recommendations

## Testing & Validation

- **API Testing**: Use Postman with the collection outlined in `BE/backend/docs/API_TEST.md`
- Set Postman environment variable `token` after login for authenticated requests
- No automated test suite currently in place

## CORS Configuration

Backend CORS is configurable via `CORS_ORIGINS` environment variable in `.env`:
```
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
```
Defaults to `http://localhost:3000` for development.

## Notes

- The `.env.example` file should be checked for required environment variables
- Session-based token storage means tokens don't persist across browser restart
- Virtual fitting requires a camera/webcam on the client
- LLM service calls to Google Gemini are made from the backend service layer
