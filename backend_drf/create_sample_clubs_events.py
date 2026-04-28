"""
Script to create 3 clubs and 3 events using Django shell.
Usage: python manage.py shell < create_sample_clubs_events.py
Or in Django shell: exec(open('create_sample_clubs_events.py').read())
"""

import os
import django
from datetime import date, timedelta, time as dt_time
from django.utils import timezone

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_drf_project.settings')
django.setup()

from django.contrib.auth import get_user_model
from accounts.models import Profile
from clubs.models import Club
from events.models import Event

User = get_user_model()

def create_sample_data():
    """Create 3 clubs and 3 events"""
    
    # Create users if they don't exist (one for each club)
    users_data = [
        {
            'email': 'tech_club@example.com',
            'password': 'testpass123',
            'full_name': 'Tech Club President',
            'role': 'club'
        },
        {
            'email': 'arts_club@example.com',
            'password': 'testpass123',
            'full_name': 'Arts Club Director',
            'role': 'club'
        },
        {
            'email': 'sports_club@example.com',
            'password': 'testpass123',
            'full_name': 'Sports Club Manager',
            'role': 'club'
        },
    ]
    
    created_users = []
    for user_data in users_data:
        user, created = User.objects.get_or_create(
            email=user_data['email'],
            defaults={
                'username': user_data['email'].split('@')[0],
            }
        )
        if created:
            user.set_password(user_data['password'])
            user.save()
            print(f'Created user: {user.email}')
        else:
            print(f'User already exists: {user.email}')
        
        # Create or update profile
        profile, _ = Profile.objects.get_or_create(
            user=user,
            defaults={
                'email': user.email,
                'full_name': user_data['full_name'],
                'role': user_data['role'],
            }
        )
        if not profile.full_name:
            profile.full_name = user_data['full_name']
            profile.role = user_data['role']
            profile.save()
        
        created_users.append(user)
    
    # Create 3 clubs
    clubs_data = [
        {
            'name': 'Tech Innovators Club',
            'description': 'A community of technology enthusiasts and innovators working on cutting-edge projects and sharing knowledge about the latest tech trends. We organize hackathons, tech talks, and coding workshops.',
            'club_type': 'technical',
            'contact_email': 'contact@techinnovators.com',
            'contact_phone': '+1 (555) 123-4567',
            'website': 'https://techinnovators.com',
            'owner': created_users[0],
        },
        {
            'name': 'Creative Arts Society',
            'description': 'Bringing together artists, designers, and creative minds to collaborate on artistic projects and showcase local talent. We organize exhibitions, workshops, and art shows.',
            'club_type': 'arts',
            'contact_email': 'hello@creativeartsoc.org',
            'contact_phone': '+1 (555) 987-6543',
            'website': 'https://creativeartsoc.org',
            'owner': created_users[1],
        },
        {
            'name': 'Campus Sports League',
            'description': 'For athletes and sports enthusiasts! We organize tournaments, training sessions, and friendly matches across various sports including basketball, soccer, and volleyball.',
            'club_type': 'sports',
            'contact_email': 'sports@campusleague.edu',
            'contact_phone': '+1 (555) 456-7890',
            'website': 'https://campussports.edu',
            'owner': created_users[2],
        },
    ]
    
    created_clubs = []
    for club_data in clubs_data:
        club, created = Club.objects.get_or_create(
            name=club_data['name'],
            defaults=club_data
        )
        if created:
            print(f'Created club: {club.name}')
        else:
            print(f'Club already exists: {club.name}')
        created_clubs.append(club)
    
    # Create 3 events
    today = date.today()
    events_data = [
        {
            'title': 'Tech Career Fair 2024',
            'description': 'Meet top tech companies and discover internship opportunities. Network with recruiters from Google, Microsoft, Amazon, and more. Bring your resume!',
            'event_type': 'conference',
            'event_date': today + timedelta(days=15),
            'event_time': dt_time(14, 0),
            'location': 'Engineering Building, Hall A',
            'is_virtual': False,
            'price': 0,
            'max_attendees': 500,
            'club': created_clubs[0],
            'created_by': created_users[0],
        },
        {
            'title': 'Spring Music Festival',
            'description': 'Live performances by student bands and local artists. Food trucks, games, and good vibes all day long. Come celebrate spring with music and community!',
            'event_type': 'social',
            'event_date': today + timedelta(days=20),
            'event_time': dt_time(18, 0),
            'location': 'Campus Quad',
            'is_virtual': False,
            'price': 15.00,
            'max_attendees': 300,
            'club': created_clubs[1],
            'created_by': created_users[1],
        },
        {
            'title': 'Basketball Tournament Finals',
            'description': 'Inter-department basketball championship finals. Cheer for your department and enjoy the competition. Food and drinks available!',
            'event_type': 'sports',
            'event_date': today + timedelta(days=10),
            'event_time': dt_time(16, 0),
            'location': 'Sports Complex, Main Court',
            'is_virtual': False,
            'price': 0,
            'max_attendees': 500,
            'club': created_clubs[2],
            'created_by': created_users[2],
        },
    ]
    
    for event_data in events_data:
        event, created = Event.objects.get_or_create(
            title=event_data['title'],
            club=event_data['club'],
            defaults=event_data
        )
        if created:
            print(f'Created event: {event.title}')
        else:
            print(f'Event already exists: {event.title}')
    
    print('\n✅ Successfully created sample data!')
    print(f'- {User.objects.count()} users')
    print(f'- {Club.objects.count()} clubs')
    print(f'- {Event.objects.count()} events')

if __name__ == '__main__':
    create_sample_data()
