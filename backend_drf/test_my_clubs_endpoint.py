"""
Test script to verify my-clubs endpoint is accessible
Run this with: python manage.py shell < test_my_clubs_endpoint.py
Or: python manage.py shell, then copy-paste the code
"""
from django.contrib.auth import get_user_model
from clubs.models import Club
from clubs.views import ClubViewSet
from rest_framework.test import APIRequestFactory
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()

# Get or create a test user
user = User.objects.first()
if not user:
    print("No users found. Please create a user first.")
    exit()

# Create a test club for this user if it doesn't exist
club, created = Club.objects.get_or_create(
    name="Test Club",
    defaults={
        'description': 'Test club for endpoint verification',
        'owner': user,
        'contact_email': 'test@example.com'
    }
)

if created:
    print(f"Created test club: {club.name}")
else:
    print(f"Test club already exists: {club.name}")

# Test the endpoint
factory = APIRequestFactory()
viewset = ClubViewSet()

# Create a request
request = factory.get('/api/clubs/my-clubs/')
request.user = user

# Call the action
try:
    response = viewset.my_clubs(request)
    print(f"\n✅ Endpoint works! Status: {response.status_code}")
    print(f"Response data: {len(response.data)} clubs")
    for club_data in response.data:
        print(f"  - {club_data.get('name')} (ID: {club_data.get('id')})")
except Exception as e:
    print(f"\n❌ Error: {e}")
    import traceback
    traceback.print_exc()

print(f"\nTotal clubs owned by {user.email}: {Club.objects.filter(owner=user).count()}")
