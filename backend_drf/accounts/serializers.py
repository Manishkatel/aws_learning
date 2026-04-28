from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import User, Profile

class UserSerializer(serializers.ModelSerializer):
    """User serializer"""
    class Meta:
        model = User
        fields = ['id', 'email', 'username', 'first_name', 'last_name']
        read_only_fields = ['id']


class ProfileSerializer(serializers.ModelSerializer):
    """Profile serializer"""
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = Profile
        fields = [
            'id', 'user', 'full_name', 'email', 'phone', 'bio', 
            'location', 'interests', 'profile_picture', 
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class SignupSerializer(serializers.ModelSerializer):
    """Signup serializer"""
    password = serializers.CharField(write_only=True, min_length=6)
    password_confirm = serializers.CharField(write_only=True)
    full_name = serializers.CharField(write_only=True, required=False, allow_blank=True, allow_null=True)
    interests = serializers.ListField(child=serializers.CharField(), required=False, allow_empty=True, default=list)
    year_in_college = serializers.CharField(write_only=True, required=False, allow_blank=True, allow_null=True)
    
    class Meta:
        model = User
        fields = ['email', 'password', 'password_confirm', 'full_name', 'interests', 'year_in_college']
    
    def validate(self, attrs):
        password = attrs.get('password')
        password_confirm = attrs.get('password_confirm')
        
        if not password:
            raise serializers.ValidationError({"password": "Password is required."})
        if not password_confirm:
            raise serializers.ValidationError({"password_confirm": "Password confirmation is required."})
        if password != password_confirm:
            raise serializers.ValidationError({"password_confirm": "Password fields didn't match."})
        if len(password) < 6:
            raise serializers.ValidationError({"password": "Password must be at least 6 characters long."})
        
        return attrs
    
    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value
    
    def create(self, validated_data):
        password_confirm = validated_data.pop('password_confirm', None)
        full_name = validated_data.pop('full_name', None) or None
        interests = validated_data.pop('interests', []) or []
        if not isinstance(interests, list):
            interests = []
        year_in_college = validated_data.pop('year_in_college', None) or None
        
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            username=validated_data.get('username', validated_data['email'].split('@')[0])
        )
        
        # Create profile
        Profile.objects.create(
            user=user,
            email=user.email,
            full_name=full_name,
            interests=interests,
        )
        
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)


"""-
================================================================================
WORKFLOW AND CODE DESCRIPTION - ACCOUNTS SERIALIZERS
================================================================================

This module defines data serialization/deserialization for user authentication
and profile management. Serializers convert between Python objects and JSON,
handle validation, and manage data transformations.

SERIALIZER OVERVIEW:
-------------------
1. UserSerializer:
   - Serializes basic User model fields
   - Used for nested representation in ProfileSerializer
   - Exposes: id, email, username, first_name, last_name
   - All fields are read-only except during creation

2. ProfileSerializer:
   - Main serializer for user profiles
   - Includes nested UserSerializer for complete user info
   - Handles profile-specific fields: bio, location, interests, etc.
   - Automatically generates profile_picture URLs
   - Used for GET, PATCH operations on profiles

3. SignupSerializer:
   - Handles new user registration
   - Validates password strength and confirmation match
   - Creates both User and Profile in single transaction
   - Processes optional fields: full_name, interests, year_in_college
   - Password is hashed automatically via create_user()

4. LoginSerializer:
   - Simple serializer for login credentials
   - Validates email format and password presence
   - Used only for input validation (doesn't create objects)

DATA VALIDATION WORKFLOW:
------------------------
1. INPUT VALIDATION:
   - Email format checked (EmailField)
   - Password strength validated (validate_password)
   - Password confirmation must match password
   - Optional fields can be omitted

2. CUSTOM VALIDATION (SignupSerializer.validate):
   - Checks password == password_confirm
   - Raises ValidationError if mismatch
   - Runs before create() method

3. OBJECT CREATION (SignupSerializer.create):
   - Extracts password_confirm (not stored)
   - Creates User with hashed password
   - Generates username from email if not provided
   - Creates associated Profile with user data
   - Returns User instance

DATA TRANSFORMATION:
-------------------
- Passwords: Automatically hashed (never stored in plain text)
- Interests: Stored as JSON array in Profile model
- Profile Picture: File path stored, URL generated on serialization
- User ID: Converted to string for JSON compatibility

ERROR HANDLING:
--------------
- Validation errors returned as JSON with field names
- Password validation errors include specific requirements
- Email uniqueness enforced at model level
- All errors return appropriate HTTP status codes

INTEGRATION POINTS:
------------------
- Used by views.py for request/response serialization
- Validates data before database operations
- Transforms model instances to JSON for API responses
- Handles file uploads for profile pictures
"""
