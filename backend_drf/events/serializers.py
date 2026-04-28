from rest_framework import serializers
from .models import Event, EventAttendee, EventStar
from clubs.serializers import ClubSerializer


class EventSerializer(serializers.ModelSerializer):
    """Event serializer"""
    club_id = serializers.CharField(write_only=True, required=False)
    club_name = serializers.CharField(source='club.name', read_only=True)
    created_by_id = serializers.SerializerMethodField()
    is_free = serializers.SerializerMethodField()
    event_time = serializers.TimeField(format='%H:%M:%S', input_formats=['%H:%M:%S', '%H:%M'], required=False, allow_null=True)
    
    class Meta:
        model = Event
        fields = [
            'id', 'title', 'description', 'event_type', 'event_date',
            'event_time', 'location', 'is_virtual', 'price', 'max_attendees',
            'club', 'club_id', 'club_name', 'created_by_id', 'image_url',
            'additional_info', 'status', 'share_count', 'is_free',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'created_by_id', 'club_name']
        extra_kwargs = {
            'club': {'required': False, 'write_only': True}
        }
    
    def to_representation(self, instance):
        """Add club_id to response"""
        representation = super().to_representation(instance)
        representation['club_id'] = str(instance.club.id)
        if representation.get('event_time'):
            # Convert time to string format
            time_str = str(representation['event_time'])
            representation['event_time'] = time_str
        return representation
    
    def get_created_by_id(self, obj):
        return str(obj.created_by.id)
    
    def get_is_free(self, obj):
        return obj.is_free
    
    def create(self, validated_data):
        # Handle club_id if provided (convert to club object)
        club_id = validated_data.pop('club_id', None)
        club = validated_data.pop('club', None)
        
        if not club and club_id:
            from clubs.models import Club
            try:
                club = Club.objects.get(id=club_id)
            except Club.DoesNotExist:
                raise serializers.ValidationError({'club_id': 'Club does not exist.'})
        
        if not club:
            raise serializers.ValidationError({'club_id': 'Club is required. Please provide club_id.'})
        
        validated_data['club'] = club
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)


class EventAttendeeSerializer(serializers.ModelSerializer):
    """Event attendee serializer"""
    class Meta:
        model = EventAttendee
        fields = ['id', 'event', 'user', 'created_at']
        read_only_fields = ['id', 'user', 'created_at']
    
    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class EventStarSerializer(serializers.ModelSerializer):
    """Event star serializer"""
    event_id = serializers.CharField(source='event.id', read_only=True)
    event = EventSerializer(read_only=True)  # Include full event details
    user_id = serializers.CharField(source='user.id', read_only=True)
    
    class Meta:
        model = EventStar
        fields = ['id', 'event', 'event_id', 'user', 'user_id', 'created_at']
        read_only_fields = ['id', 'user', 'user_id', 'created_at']
    
    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


"""
================================================================================
WORKFLOW AND CODE DESCRIPTION - EVENTS SERIALIZERS
================================================================================

This module handles data serialization for event-related models, converting
between Python model instances and JSON format for API communication.

EVENT SERIALIZATION (EventSerializer):
-------------------------------------
1. CORE FUNCTIONALITY:
   - Serializes Event model with all relevant fields
   - Converts ForeignKeys to string IDs (club_id, created_by_id)
   - Includes computed fields (is_free, club_name)
   - Handles event creation with automatic creator assignment

2. CUSTOM FIELDS:
   - club_id: Extracted from club ForeignKey, converted to string
   - club_name: Extracted from related club.name
   - created_by_id: Extracted from created_by ForeignKey
   - is_free: Computed property (price == 0)
   - event_time: Formatted as string (HH:MM:SS or HH:MM)

3. TIME HANDLING:
   - event_time stored as TimeField in database
   - Serialized as string format for frontend compatibility
   - Supports multiple input formats: 'HH:MM:SS' or 'HH:MM'
   - to_representation() converts time object to string

4. CREATION WORKFLOW (create method):
   - Receives validated data from request
   - Automatically sets created_by to current authenticated user
   - Creates Event instance in database
   - Returns serialized event data

5. DATA TRANSFORMATION:
   - club.id → club_id (string format)
   - club.name → club_name (readable name)
   - created_by.id → created_by_id (string format)
   - price == 0 → is_free (boolean)
   - TimeField → string (HH:MM:SS format)

EVENT ATTENDEE SERIALIZATION (EventAttendeeSerializer):
-------------------------------------------------------
- Simple serializer for event registration records
- Exposes: id, event, user, created_at
- Automatically sets user to current authenticated user on create
- Used for tracking who registered for which events
- Minimal fields for efficient API responses

EVENT STAR SERIALIZATION (EventStarSerializer):
-----------------------------------------------
- Serializes user's favorite/starred events
- Exposes: id, event, user, created_at
- Automatically sets user to current authenticated user on create
- Used for "Saved Events" or "Favorites" functionality
- Prevents duplicate stars via unique_together constraint

SERIALIZATION WORKFLOW:
----------------------
1. REQUEST → SERIALIZER:
   - JSON data received from frontend
   - Validated against model fields and types
   - Time strings parsed to TimeField objects
   - Date strings parsed to DateField objects

2. VALIDATION:
   - Field-level validation (email, URL, date formats)
   - Model-level validation (foreign key references)
   - Custom validation in create() method
   - Time format validation (HH:MM:SS or HH:MM)

3. DATABASE OPERATION:
   - create() method called for POST requests
   - update() method called for PUT/PATCH requests
   - Creator automatically assigned from request.user
   - Related objects (club) validated before save

4. RESPONSE SERIALIZATION:
   - Model instance converted to JSON
   - Custom fields (club_id, is_free) computed
   - Nested relationships (club_name) resolved
   - Time objects converted to strings
   - Timestamps formatted to ISO 8601

DATA FORMATTING:
---------------
- IDs: Always returned as strings for JSON compatibility
- Dates: ISO 8601 format (YYYY-MM-DD)
- Times: String format (HH:MM:SS)
- Prices: Decimal format (preserves precision)
- Booleans: is_free, is_virtual as true/false

COMPUTED PROPERTIES:
-------------------
- is_free: Calculated from price field (price == 0)
- club_name: Fetched from related club object
- These fields are read-only and computed on serialization

ERROR HANDLING:
--------------
- Validation errors returned with field names
- Foreign key validation ensures valid club/user references
- Time parsing errors handled gracefully
- Date validation ensures valid date formats
- All errors include descriptive messages

INTEGRATION POINTS:
------------------
- Used by views.py for request/response handling
- Validates data before database operations
- Transforms database models to JSON for frontend
- Handles time/date format conversions
- Supports complex filtering via serialized data
"""
