"""
Django management command to create sample data for clubs and events
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import date, timedelta, time
from accounts.models import Profile
from clubs.models import Club, BoardMember, Achievement
from events.models import Event

User = get_user_model()


class Command(BaseCommand):
    help = 'Creates sample clubs and events for testing'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Creating sample data...'))
        
        # Create sample users if they don't exist
        users_data = [
            {
                'email': 'club1@example.com',
                'password': 'testpass123',
                'full_name': 'Tech Club President',
                'role': 'club'
            },
            {
                'email': 'club2@example.com',
                'password': 'testpass123',
                'full_name': 'Arts Club Director',
                'role': 'club'
            },
            {
                'email': 'club3@example.com',
                'password': 'testpass123',
                'full_name': 'Sports Club Manager',
                'role': 'club'
            },
            {
                'email': 'club4@example.com',
                'password': 'testpass123',
                'full_name': 'Cultural Society Head',
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
                self.stdout.write(self.style.SUCCESS(f'Created user: {user.email}'))
            else:
                self.stdout.write(self.style.WARNING(f'User already exists: {user.email}'))
            
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
        
        # Create sample clubs
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
            {
                'name': 'Cultural Exchange Society',
                'description': 'Celebrating diversity through cultural events, food festivals, traditional performances, and language exchange programs. Join us to experience cultures from around the world.',
                'club_type': 'cultural',
                'contact_email': 'culture@university.edu',
                'contact_phone': '+1 (555) 234-5678',
                'website': 'https://culturalexchange.edu',
                'owner': created_users[3],
            },
            {
                'name': 'Academic Excellence Club',
                'description': 'Dedicated to promoting academic achievement and providing study groups, tutoring, and academic support to all students. We organize study sessions and academic workshops.',
                'club_type': 'academic',
                'contact_email': 'info@academicexcellence.edu',
                'contact_phone': '+1 (555) 345-6789',
                'website': 'https://academicexcellence.edu',
                'owner': created_users[0],
            },
        ]
        
        created_clubs = []
        for club_data in clubs_data:
            club, created = Club.objects.get_or_create(
                name=club_data['name'],
                defaults=club_data
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f'Created club: {club.name}'))
            else:
                self.stdout.write(self.style.WARNING(f'Club already exists: {club.name}'))
            created_clubs.append(club)
        
        # Create sample events
        today = date.today()
        events_data = [
            {
                'title': 'Tech Career Fair 2024',
                'description': 'Meet top tech companies and discover internship opportunities. Network with recruiters from Google, Microsoft, Amazon, and more. Bring your resume!',
                'event_type': 'conference',
                'event_date': today + timedelta(days=15),
                'event_time': time(14, 0),
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
                'event_time': time(18, 0),
                'location': 'Campus Quad',
                'is_virtual': False,
                'price': 15.00,
                'max_attendees': 300,
                'club': created_clubs[1],
                'created_by': created_users[1],
            },
            {
                'title': 'Research Symposium',
                'description': 'Student research presentations across all disciplines. Showcase your work and learn from peers. Perfect opportunity for networking and academic collaboration.',
                'event_type': 'conference',
                'event_date': today + timedelta(days=18),
                'event_time': time(9, 0),
                'location': 'Academic Center, Main Auditorium',
                'is_virtual': False,
                'price': 0,
                'max_attendees': 200,
                'club': created_clubs[4],
                'created_by': created_users[0],
            },
            {
                'title': 'Basketball Tournament Finals',
                'description': 'Inter-department basketball championship finals. Cheer for your department and enjoy the competition. Food and drinks available!',
                'event_type': 'sports',
                'event_date': today + timedelta(days=10),
                'event_time': time(16, 0),
                'location': 'Sports Complex, Main Court',
                'is_virtual': False,
                'price': 0,
                'max_attendees': 500,
                'club': created_clubs[2],
                'created_by': created_users[2],
            },
            {
                'title': 'Cultural Food Festival',
                'description': 'Taste cuisines from around the world! Student organizations prepare traditional dishes from their cultures. Free admission, food tickets available.',
                'event_type': 'social',
                'event_date': today + timedelta(days=25),
                'event_time': time(12, 0),
                'location': 'Student Union Building',
                'is_virtual': False,
                'price': 0,
                'max_attendees': 400,
                'club': created_clubs[3],
                'created_by': created_users[3],
            },
            {
                'title': 'Web Development Workshop',
                'description': 'Learn modern web development with React and Django. Hands-on coding session for beginners and intermediate developers. Bring your laptop!',
                'event_type': 'workshop',
                'event_date': today + timedelta(days=5),
                'event_time': time(10, 0),
                'location': 'Computer Lab 301',
                'is_virtual': False,
                'price': 0,
                'max_attendees': 50,
                'club': created_clubs[0],
                'created_by': created_users[0],
            },
            {
                'title': 'Art Gallery Opening',
                'description': 'Showcase of student artwork from this semester. Wine, cheese, and creative conversations. Opening night reception with the artists.',
                'event_type': 'cultural',
                'event_date': today + timedelta(days=28),
                'event_time': time(19, 0),
                'location': 'Arts Building Gallery',
                'is_virtual': False,
                'price': 10.00,
                'max_attendees': 100,
                'club': created_clubs[1],
                'created_by': created_users[1],
            },
            {
                'title': 'Sustainability Workshop',
                'description': 'Learn practical tips for sustainable living on campus. DIY projects and eco-friendly initiatives. Make your own reusable items!',
                'event_type': 'workshop',
                'event_date': today + timedelta(days=22),
                'event_time': time(15, 30),
                'location': 'Environmental Science Building, Room 205',
                'is_virtual': False,
                'price': 5.00,
                'max_attendees': 40,
                'club': created_clubs[4],
                'created_by': created_users[0],
            },
        ]
        
        for event_data in events_data:
            event, created = Event.objects.get_or_create(
                title=event_data['title'],
                club=event_data['club'],
                defaults=event_data
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f'Created event: {event.title}'))
            else:
                self.stdout.write(self.style.WARNING(f'Event already exists: {event.title}'))
        
        # Create some board members
        board_members_data = [
            {
                'club': created_clubs[0],
                'name': 'Sarah Johnson',
                'position': 'President',
                'email': 'sarah@techinnovators.com',
                'year_in_college': 'Senior',
                'joined_date': today - timedelta(days=365),
            },
            {
                'club': created_clubs[0],
                'name': 'Mike Chen',
                'position': 'Vice President',
                'email': 'mike@techinnovators.com',
                'year_in_college': 'Junior',
                'joined_date': today - timedelta(days=200),
            },
            {
                'club': created_clubs[1],
                'name': 'Emily Rodriguez',
                'position': 'Director',
                'email': 'emily@creativeartsoc.org',
                'year_in_college': 'Senior',
                'joined_date': today - timedelta(days=300),
            },
        ]
        
        for bm_data in board_members_data:
            BoardMember.objects.get_or_create(
                club=bm_data['club'],
                name=bm_data['name'],
                defaults=bm_data
            )
        
        # Create some achievements
        achievements_data = [
            {
                'club': created_clubs[0],
                'title': 'Won National Hackathon 2024',
                'description': 'First place in the National University Hackathon competition',
                'date_achieved': today - timedelta(days=30),
            },
            {
                'club': created_clubs[1],
                'title': 'Annual Art Exhibition Success',
                'description': 'Organized largest student art exhibition in university history with 200+ participants',
                'date_achieved': today - timedelta(days=60),
            },
            {
                'club': created_clubs[2],
                'title': 'Championship Victory',
                'description': 'Won inter-university basketball championship',
                'date_achieved': today - timedelta(days=90),
            },
        ]
        
        for ach_data in achievements_data:
            Achievement.objects.get_or_create(
                club=ach_data['club'],
                title=ach_data['title'],
                defaults=ach_data
            )
        
        self.stdout.write(self.style.SUCCESS(f'\nSuccessfully created sample data!'))
        self.stdout.write(self.style.SUCCESS(f'- {User.objects.count()} users'))
        self.stdout.write(self.style.SUCCESS(f'- {Club.objects.count()} clubs'))
        self.stdout.write(self.style.SUCCESS(f'- {Event.objects.count()} events'))
        self.stdout.write(self.style.SUCCESS(f'- {BoardMember.objects.count()} board members'))
        self.stdout.write(self.style.SUCCESS(f'- {Achievement.objects.count()} achievements'))

