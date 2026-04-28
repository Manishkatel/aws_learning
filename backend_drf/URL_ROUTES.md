# API URL Routes

This document lists all available API endpoints.

## Events Endpoints

### Main Event Routes
- `GET /api/events/` - List all events
- `GET /api/events/{id}/` - Get specific event
- `POST /api/events/` - Create event
- `PUT /api/events/{id}/` - Update event
- `DELETE /api/events/{id}/` - Delete event

### Custom Actions
- `GET /api/events/my-events/` - Get events created by current user
- `POST /api/events/{id}/register/` - Register for an event

### Event Attendees
- `GET /api/events/event-attendees/` - List event attendees (filtered by user or event_id)
- `GET /api/events/event-attendees/{id}/` - Get specific attendee
- `POST /api/events/event-attendees/` - Create attendee (register for event)
- `DELETE /api/events/event-attendees/{id}/` - Remove attendee

### Event Stars
- `GET /api/events/event-stars/` - List starred events for current user
- `GET /api/events/event-stars/{id}/` - Get specific star
- `POST /api/events/event-stars/` - Star an event
- `DELETE /api/events/event-stars/{id}/` - Unstar an event

## Clubs Endpoints

### Main Club Routes
- `GET /api/clubs/` - List all clubs
- `GET /api/clubs/{id}/` - Get specific club
- `POST /api/clubs/` - Create club
- `PUT /api/clubs/{id}/` - Update club
- `DELETE /api/clubs/{id}/` - Delete club

### Custom Actions
- `GET /api/clubs/my-clubs/` - Get clubs owned by current user
- `POST /api/clubs/{id}/upload-logo/` - Upload club logo

### Club Members
- `GET /api/clubs/club-members/` - List club members (filtered by user or club_id)
- `GET /api/clubs/club-members/{id}/` - Get specific member
- `POST /api/clubs/club-members/` - Join a club
- `DELETE /api/clubs/club-members/{id}/` - Leave a club

### Board Members
- `GET /api/clubs/board-members/` - List board members
- `POST /api/clubs/board-members/` - Add board member

### Achievements
- `GET /api/clubs/achievements/` - List achievements
- `POST /api/clubs/achievements/` - Add achievement

### Club Applications
- `GET /api/clubs/club-applications/` - List club applications
- `POST /api/clubs/club-applications/` - Apply to club

## Notes

- All endpoints require authentication unless specified otherwise
- Custom actions (like `my-events` and `my-clubs`) are accessible at the base path with the action name
- The router registration order has been optimized to avoid conflicts
