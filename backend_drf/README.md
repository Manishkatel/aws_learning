# Django REST Framework Backend

This is a Django REST Framework backend for the Party Spark Creator Hub frontend application.

## Features

- **Authentication**: JWT-based authentication using Simple JWT
- **User Management**: Custom user model with profiles
- **Clubs**: Full CRUD operations for clubs
- **Events**: Full CRUD operations for events with registration
- **CORS**: Configured for frontend integration

## Setup

1. **Activate virtual environment**:
   ```powershell
   .\env\Scripts\Activate.ps1
   ```

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Run migrations**:
   ```bash
   python manage.py migrate
   ```

4. **Create superuser** (optional):
   ```bash
   python manage.py createsuperuser
   ```

5. **Run development server**:
   ```bash
   python manage.py runserver
   ```

The API will be available at `http://localhost:8000`

## API Endpoints

### Authentication
- `POST /api/auth/signup/` - User registration
- `POST /api/auth/login/` - User login
- `POST /api/auth/logout/` - User logout
- `POST /api/auth/token/refresh/` - Refresh JWT token
- `GET /api/auth/profile/` - Get current user profile

### Profile
- `PATCH /api/profile/update/` - Update user profile
- `POST /api/profile/upload-picture/` - Upload profile picture

### Clubs
- `GET /api/clubs/` - List all clubs (with filters: `?club_type=`, `?search=`)
- `GET /api/clubs/{id}/` - Get club details
- `POST /api/clubs/` - Create new club (authenticated)
- `PUT /api/clubs/{id}/` - Update club (owner only)
- `DELETE /api/clubs/{id}/` - Delete club (owner only)
- `GET /api/clubs/my-clubs/` - Get user's clubs
- `POST /api/clubs/{id}/upload-logo/` - Upload club logo

### Events
- `GET /api/events/` - List all events (with filters: `?event_type=`, `?search=`, `?is_free=`, `?start_date=`, `?end_date=`)
- `GET /api/events/{id}/` - Get event details
- `POST /api/events/` - Create new event (authenticated)
- `PUT /api/events/{id}/` - Update event (creator only)
- `DELETE /api/events/{id}/` - Delete event (creator only)
- `GET /api/events/my-events/` - Get user's events
- `POST /api/events/{id}/register/` - Register for event

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <access_token>
```

Tokens are stored in localStorage by the frontend:
- `django_access_token` - Access token (short-lived)
- `django_refresh_token` - Refresh token (long-lived)

## Database

The default database is SQLite (`db.sqlite3`). For production, configure PostgreSQL or another database in `settings.py`.

## Media Files

Uploaded files (profile pictures, club logos) are stored in the `media/` directory and served at `/media/` in development.

## CORS Configuration

CORS is configured to allow requests from:
- `http://localhost:5173` (Vite dev server)
- `http://localhost:3000` (React dev server)

Update `CORS_ALLOWED_ORIGINS` in `settings.py` for production.


For Future:
Searching
INSTALLED_APPS = [
    # ...
    "django.contrib.postgres",  # Required for full-text features
]

from django.contrib.postgres.search import SearchQuery, SearchVector, SearchRank

vector = SearchVector("title", weight="A") + SearchVector("author__name", weight="B")
query = SearchQuery(query)  # User input

results = Book.objects.annotate(
    rank=SearchRank(vector, query)
).filter(rank__gte=0.05).order_by("-rank")  # Best matches first