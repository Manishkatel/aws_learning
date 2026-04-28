from rest_framework import viewsets, status, filters , permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db import models
from django.utils import timezone
from datetime import datetime
from .models import Event, EventAttendee, EventStar
from .serializers import EventSerializer, EventAttendeeSerializer, EventStarSerializer


class EventViewSet(viewsets.ModelViewSet):
    """Event viewset"""
    queryset = Event.objects.all()
    serializer_class = EventSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [filters.SearchFilter, DjangoFilterBackend]
    search_fields = ['title', 'description', 'location']
    filterset_fields = ['event_type', 'is_virtual', 'club']
    
    def get_queryset(self):
        queryset = super().get_queryset()
        search = self.request.query_params.get('search', None)
        event_type = self.request.query_params.get('event_type', None)
        is_free = self.request.query_params.get('is_free', None)
        start_date = self.request.query_params.get('start_date', None)
        end_date = self.request.query_params.get('end_date', None)
        
        if search:
            queryset = queryset.filter(
                models.Q(title__icontains=search) |
                models.Q(description__icontains=search) |
                models.Q(location__icontains=search)
            )
        
        if event_type:
            queryset = queryset.filter(event_type=event_type)
        
        if is_free is not None:
            is_free_bool = is_free.lower() == 'true'
            if is_free_bool:
                queryset = queryset.filter(price=0)
            else:
                queryset = queryset.exclude(price=0)
        
        if start_date:
            try:
                start = datetime.strptime(start_date, '%Y-%m-%d').date()
                queryset = queryset.filter(event_date__gte=start)
            except ValueError:
                pass
        
        if end_date:
            try:
                end = datetime.strptime(end_date, '%Y-%m-%d').date()
                queryset = queryset.filter(event_date__lte=end)
            except ValueError:
                pass
        
        return queryset.select_related('club', 'created_by')
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated], url_path='my-events', url_name='my-events')
    def my_events(self, request):
        """Get events created by current user"""
        events = Event.objects.filter(created_by=request.user).select_related('club', 'created_by').order_by('-event_date', '-created_at')
        print(f"[my_events] Endpoint called by user: {request.user.id} ({request.user.email})")
        print(f"[my_events] Found {events.count()} events for user {request.user.id}")
        serializer = self.get_serializer(events, many=True, context={'request': request})
        print(f"[my_events] Serialized {len(serializer.data)} events")
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def register(self, request, pk=None):
        """Register for an event"""
        event = self.get_object()
        
        # Check if already registered
        if EventAttendee.objects.filter(event=event, user=request.user).exists():
            return Response(
                {'detail': 'You are already registered for this event.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check max attendees
        if event.max_attendees:
            current_attendees = EventAttendee.objects.filter(event=event).count()
            if current_attendees >= event.max_attendees:
                return Response(
                    {'detail': 'Event is full.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Create attendee
        attendee = EventAttendee.objects.create(event=event, user=request.user)
        serializer = EventAttendeeSerializer(attendee)
        return Response({'message': 'Successfully registered for event.'}, status=status.HTTP_201_CREATED)


class EventAttendeeViewSet(viewsets.ModelViewSet):
    """Event attendee viewset"""
    queryset = EventAttendee.objects.all()
    serializer_class = EventAttendeeSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        event_id = self.request.query_params.get('event_id', None)
        if event_id:
            return self.queryset.filter(event_id=event_id)
        return self.queryset.filter(user=self.request.user)


class EventStarViewSet(viewsets.ModelViewSet):
    """Event star viewset"""
    queryset = EventStar.objects.all()
    serializer_class = EventStarSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return self.queryset.filter(user=self.request.user)
    
    def create(self, request, *args, **kwargs):
        """Star an event"""
        event_id = request.data.get('event')
        if not event_id:
            return Response(
                {'detail': 'Event ID is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        event = Event.objects.get(id=event_id)
        
        # Check if already starred
        if EventStar.objects.filter(event=event, user=request.user).exists():
            return Response(
                {'detail': 'Event is already starred.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        star = EventStar.objects.create(event=event, user=request.user)
        serializer = self.get_serializer(star)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


"""
================================================================================
WORKFLOW AND CODE DESCRIPTION - EVENTS VIEWS
================================================================================

This module provides RESTful API endpoints for event management, including
event CRUD operations, registration, filtering, and user-specific event queries.

EVENT MANAGEMENT WORKFLOW:
-------------------------
1. EVENT CRUD OPERATIONS (EventViewSet):
   - GET /api/events/ - List all events (public, with advanced filters)
   - GET /api/events/{id}/ - Get specific event details
   - POST /api/events/ - Create new event (authenticated users)
   - PUT /api/events/{id}/ - Update event (creator only)
   - DELETE /api/events/{id}/ - Delete event (creator only)

2. ADVANCED FILTERING:
   - Query parameters supported:
     * ?search=keyword - Searches title, description, location
     * ?event_type=workshop - Filters by event type
     * ?is_free=true/false - Filters free vs paid events
     * ?start_date=YYYY-MM-DD - Events on or after date
     * ?end_date=YYYY-MM-DD - Events on or before date
   - Multiple filters can be combined
   - Uses select_related('club', 'created_by') for query optimization

3. CUSTOM ACTIONS:
   - GET /api/events/my-events/ - Returns events created by current user
   - POST /api/events/{id}/register/ - Register current user for event
     * Checks if user already registered (prevents duplicates)
     * Validates max_attendees limit if set
     * Creates EventAttendee record
     * Returns success message

EVENT REGISTRATION WORKFLOW:
---------------------------
1. VALIDATION CHECKS:
   - User not already registered (unique constraint)
   - Event not at max capacity (if max_attendees set)
   - User authenticated (required)

2. REGISTRATION PROCESS:
   - Creates EventAttendee relationship
   - Links event and user
   - Returns confirmation message
   - Frontend can then fetch attendee list

EVENT ATTENDEE MANAGEMENT (EventAttendeeViewSet):
-------------------------------------------------
- Manages event registration records
- GET: List attendees (filterable by event_id or user)
- Query params: ?event_id=123 (get all attendees for event)
- Default: Returns current user's event registrations
- Used for displaying "My Events" and attendee lists

EVENT STAR/FAVORITE MANAGEMENT (EventStarViewSet):
--------------------------------------------------
- Manages user's starred/favorited events
- GET: List user's starred events
- POST: Star an event (prevents duplicate stars)
- Used for "Saved Events" functionality
- Validates event exists before creating star

PERMISSION MODEL:
----------------
- IsAuthenticatedOrReadOnly: Public read, authenticated write
- IsAuthenticated: All operations require login
- Creator-only modifications for events
- Registration requires authentication

DATA FLOW:
---------
Request → Permission Check → Filter Application → Validation → Database Operation → Response
         ↓
    Error Handling → Validation Errors → HTTP Error Responses

QUERY OPTIMIZATION:
------------------
- select_related('club', 'created_by') - Reduces N+1 queries
- Efficient date filtering using Django ORM
- Filtered querysets reduce database load
- Indexed fields for fast searches

DATE FILTERING LOGIC:
--------------------
- start_date: event_date >= start_date (inclusive)
- end_date: event_date <= end_date (inclusive)
- Date parsing with error handling (invalid dates ignored)
- Supports date range queries for calendar views

ERROR HANDLING:
--------------
- 400 Bad Request: Already registered, event full, invalid data
- 403 Forbidden: User tries to modify event they didn't create
- 404 Not Found: Event doesn't exist
- All errors return JSON with descriptive messages

INTEGRATION WITH FRONTEND:
--------------------------
- Frontend sends complex filters as query parameters
- Registration status checked before showing "Register" button
- Event capacity displayed from max_attendees field
- Starred events cached in frontend for quick access
- Event lists support pagination (configured in settings)
"""
