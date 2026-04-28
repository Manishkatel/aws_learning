from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from .models import User, Profile
from .serializers import SignupSerializer, LoginSerializer, UserSerializer, ProfileSerializer


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def signup(request):
    """User signup endpoint"""
    serializer = SignupSerializer(data=request.data)
    if serializer.is_valid():
        try:
            user = serializer.save()
            
            # Generate tokens
            refresh = RefreshToken.for_user(user)
            
            # Get profile
            profile = user.profile
            
            return Response({
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user': {
                    'id': str(user.id),
                    'email': user.email,
                    'full_name': profile.full_name or '',
                    'role': profile.role
                }
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({
                'detail': f'Error creating user: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def login(request):
    """User login endpoint"""
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        email = serializer.validated_data['email']
        password = serializer.validated_data['password']
        
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response(
                {'detail': 'Invalid credentials.'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        user = authenticate(username=user.username, password=password)
        if user is None:
            return Response(
                {'detail': 'Invalid credentials.'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Generate tokens
        refresh = RefreshToken.for_user(user)
        
        # Get profile
        profile = user.profile
        
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': {
                'id': str(user.id),
                'email': user.email,
                'full_name': profile.full_name or '',
                'role': profile.role
            }
        }, status=status.HTTP_200_OK)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def logout(request):
    """User logout endpoint"""
    try:
        refresh_token = request.data.get('refresh')
        if refresh_token:
            token = RefreshToken(refresh_token)
            token.blacklist()
        return Response({'detail': 'Successfully logged out.'}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({'detail': 'Invalid token.'}, status=status.HTTP_400_BAD_REQUEST)

    
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def profile(request):
    """Get current user profile"""
    profile = request.user.profile
    serializer = ProfileSerializer(profile, context={'request': request})
    return Response(serializer.data)


class UpdateProfileView(generics.UpdateAPIView):
    """Update user profile"""
    serializer_class = ProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        return self.request.user.profile


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def upload_profile_picture(request):
    """Upload profile picture"""
    profile = request.user.profile
    if 'file' in request.FILES:
        profile.profile_picture = request.FILES['file']
        profile.save()
        serializer = ProfileSerializer(profile, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)
    elif 'picture' in request.FILES:
        profile.profile_picture = request.FILES['picture']
        profile.save()
        serializer = ProfileSerializer(profile, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)
    return Response({'detail': 'No file provided.'}, status=status.HTTP_400_BAD_REQUEST)


"""
================================================================================
WORKFLOW AND CODE DESCRIPTION - ACCOUNTS VIEWS
================================================================================

This module handles all user authentication and profile management operations.

AUTHENTICATION WORKFLOW:
------------------------
1. SIGNUP (POST /api/auth/signup/):
   - Validates user input using SignupSerializer
   - Creates new User instance with hashed password
   - Automatically creates associated Profile with default 'regular' role
   - Generates JWT access and refresh tokens
   - Returns tokens and user info for immediate login

2. LOGIN (POST /api/auth/login/):
   - Validates email/password using LoginSerializer
   - Authenticates user credentials
   - Generates new JWT tokens (access + refresh)
   - Returns tokens and user profile information
   - Frontend stores tokens in localStorage for subsequent requests

3. LOGOUT (POST /api/auth/logout/):
   - Receives refresh token from request body
   - Blacklists the refresh token (prevents reuse)
   - Clears authentication state on client side
   - Note: Access tokens remain valid until expiry (stateless JWT)

4. TOKEN REFRESH (POST /api/auth/token/refresh/):
   - Handled by Simple JWT's TokenRefreshView
   - Takes refresh token, returns new access token
   - Used when access token expires (typically after 1 day)

PROFILE MANAGEMENT WORKFLOW:
-----------------------------
1. GET PROFILE (GET /api/auth/profile/):
   - Retrieves current authenticated user's profile
   - Uses ProfileSerializer to include nested user data
   - Returns complete profile information

2. UPDATE PROFILE (PATCH /api/profile/update/):
   - Uses UpdateAPIView for partial updates
   - Automatically gets user's profile (no ID needed)
   - Validates and saves profile changes
   - Returns updated profile data

3. UPLOAD PROFILE PICTURE (POST /api/profile/upload-picture/):
   - Accepts file upload via multipart/form-data
   - Saves file to media/profile_pictures/
   - Updates profile.profile_picture field
   - Returns updated profile with new picture URL

SECURITY FEATURES:
-----------------
- Password validation using Django's built-in validators
- JWT tokens for stateless authentication
- Token blacklisting on logout
- Permission classes ensure only authenticated users access protected endpoints
- Password confirmation check during signup

DATA FLOW:
----------
Request → Serializer Validation → Model Operations → JWT Token Generation → Response
         ↓
    Error Handling → Validation Errors → HTTP 400/401 Responses

INTEGRATION WITH FRONTEND:
--------------------------
- Frontend stores 'django_access_token' and 'django_refresh_token' in localStorage
- Access token sent in Authorization header: "Bearer <token>"
- Automatic token refresh handled by frontend when access token expires
- Profile updates immediately reflected in frontend state
"""
