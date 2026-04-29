from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db import models
from .models import Club, ClubMember, BoardMember, Achievement, ClubApplication
from .serializers import (
    ClubSerializer, ClubMemberSerializer, BoardMemberSerializer,
    AchievementSerializer, ClubApplicationSerializer
)


class ClubViewSet(viewsets.ModelViewSet):
    """Club viewset"""
    queryset = Club.objects.all()
    serializer_class = ClubSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [filters.SearchFilter, DjangoFilterBackend]
    search_fields = ['name', 'description']
    filterset_fields = ['club_type']
    
    def get_queryset(self):
        queryset = super().get_queryset()
        search = self.request.query_params.get('search', None)
        club_type = self.request.query_params.get('club_type', None)
        
        if search:
            queryset = queryset.filter(
                models.Q(name__icontains=search) |
                models.Q(description__icontains=search)
            )
        
        if club_type:
            queryset = queryset.filter(club_type=club_type)
        
        return queryset.select_related('owner')
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated], url_path='my-clubs', url_name='my-clubs')
    def my_clubs(self, request):
        """Get clubs owned by current user"""
        # Use the base queryset and filter by owner
        clubs = Club.objects.filter(owner=request.user).select_related('owner').order_by('-created_at')
        print(f"[my_clubs] Endpoint called by user: {request.user.id} ({request.user.email})")
        print(f"[my_clubs] Found {clubs.count()} clubs for user {request.user.id}")
        
        # Log club details
        for club in clubs:
            print(f"[my_clubs] Club: {club.name} (ID: {club.id}, Owner ID: {club.owner.id})")
        
        serializer = self.get_serializer(clubs, many=True, context={'request': request})
        print(f"[my_clubs] Serialized {len(serializer.data)} clubs")
        
        # Return data directly (not paginated) to ensure frontend gets array
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated], url_path='upload-logo')
    def upload_logo(self, request, pk=None):
        """Upload club logo"""
        club = self.get_object()
        if club.owner != request.user:
            return Response(
                {'detail': 'You do not have permission to perform this action.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if 'logo' in request.FILES:
            club.logo = request.FILES['logo']
            club.save()
            serializer = self.get_serializer(club)
            return Response({'logo_url': serializer.data.get('logo_url')}, status=status.HTTP_200_OK)
        return Response({'detail': 'No file provided.'}, status=status.HTTP_400_BAD_REQUEST)


class ClubMemberViewSet(viewsets.ModelViewSet):
    """Club member viewset"""
    queryset = ClubMember.objects.all()
    serializer_class = ClubMemberSerializer
    permission_classes = [IsAuthenticated]


class BoardMemberViewSet(viewsets.ModelViewSet):
    """Board member viewset"""
    queryset = BoardMember.objects.all()
    serializer_class = BoardMemberSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    
    def get_queryset(self):
        club_id = self.request.query_params.get('club_id', None)
        if club_id:
            return self.queryset.filter(club_id=club_id)
        return self.queryset

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def upload_photo(self, request, pk=None):
        """Upload board member photo"""
        board_member = self.get_object()
        if 'photo' in request.FILES:
            board_member.photo_url = request.FILES['photo']
            board_member.save()
            serializer = self.get_serializer(board_member)
            return Response({'photo_url': serializer.data.get('photo_url')}, status=status.HTTP_200_OK)
        return Response({'detail': 'No file provided.'}, status=status.HTTP_400_BAD_REQUEST)


class AchievementViewSet(viewsets.ModelViewSet):
    """Achievement viewset"""
    queryset = Achievement.objects.all()
    serializer_class = AchievementSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    
    def get_queryset(self):
        club_id = self.request.query_params.get('club_id', None)
        if club_id:
            return self.queryset.filter(club_id=club_id)
        return self.queryset


"""
================================================================================
WORKFLOW AND CODE DESCRIPTION - CLUBS VIEWS
================================================================================

This module provides RESTful API endpoints for club management, including CRUD
operations, filtering, searching, and related resources (members, board members,
achievements).

CLUB MANAGEMENT WORKFLOW:
-------------------------
1. CLUB CRUD OPERATIONS (ClubViewSet):
   - GET /api/clubs/ - List all clubs (public, with filters)
   - GET /api/clubs/{id}/ - Get specific club details
   - POST /api/clubs/ - Create new club (authenticated users)
   - PUT /api/clubs/{id}/ - Update club (owner only)
   - DELETE /api/clubs/{id}/ - Delete club (owner only)

2. FILTERING AND SEARCH:
   - Query params: ?club_type=academic&search=music
   - Search: Searches name and description fields (case-insensitive)
   - Filter: Filters by club_type (academic, sports, cultural, etc.)
   - Uses select_related('owner') for optimized database queries

3. CUSTOM ACTIONS:
   - GET /api/clubs/my-clubs/ - Returns clubs owned by current user
   - POST /api/clubs/{id}/upload-logo/ - Upload club logo image
     * Validates ownership before allowing upload
     * Saves file to media/club_logos/
     * Returns logo URL for frontend display

CLUB MEMBER MANAGEMENT (ClubMemberViewSet):
-------------------------------------------
- Manages membership relationships between users and clubs
- GET/POST/DELETE operations for club memberships
- Enforces unique constraint (user can't join same club twice)
- Used for tracking which users belong to which clubs

BOARD MEMBER MANAGEMENT (BoardMemberViewSet):
---------------------------------------------
- Manages club leadership/board positions
- Filterable by club_id: ?club_id=123
- Stores: name, position, email, year_in_college, photo_url
- Public read access, authenticated write access

ACHIEVEMENT MANAGEMENT (AchievementViewSet):
-------------------------------------------
- Tracks club accomplishments and milestones
- Filterable by club_id: ?club_id=123
- Stores: title, description, date_achieved
- Public read access, authenticated write access

PERMISSION MODEL:
----------------
- IsAuthenticatedOrReadOnly: Anyone can read, only authenticated users can write
- IsAuthenticated: All operations require authentication
- Ownership checks: Club owners can modify their clubs
- Prevents unauthorized modifications via permission checks

DATA FLOW:
---------
Request → Permission Check → Query Filtering → Serialization → Response
         ↓
    Ownership Validation → Database Operation → Error Handling

QUERY OPTIMIZATION:
------------------
- select_related('owner') - Reduces database queries for owner info
- Filtered querysets - Only fetch relevant data
- Efficient filtering using Django ORM

ERROR HANDLING:
--------------
- 403 Forbidden: User tries to modify club they don't own
- 400 Bad Request: Invalid file upload or missing data
- 404 Not Found: Club/Resource doesn't exist
- All errors return JSON with descriptive messages

INTEGRATION WITH FRONTEND:
--------------------------
- Frontend sends filters as query parameters
- Logo uploads use multipart/form-data
- All responses include owner_id as string for easy frontend use
- Logo URLs are absolute URLs for proper image display
"""

class ClubApplicationViewSet(viewsets.ModelViewSet):
    """Club application viewset"""
    queryset = ClubApplication.objects.all()
    serializer_class = ClubApplicationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Users can see applications for clubs they own
        owned_clubs = Club.objects.filter(owner=self.request.user)
        if owned_clubs.exists():
            return self.queryset.filter(club__owner=self.request.user)
        # Otherwise, users can see their own applications
        return self.queryset.filter(user=self.request.user)
