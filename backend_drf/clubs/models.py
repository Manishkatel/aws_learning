from django.db import models
from django.conf import settings


class Club(models.Model):
    CLUB_TYPE_CHOICES = [
        ('academic', 'Academic'),
        ('sports', 'Sports'),
        ('cultural', 'Cultural'),
        ('technical', 'Technical'),
        ('arts', 'Arts'),
        ('social', 'Social'),
        ('professional', 'Professional'),
        ('entertainment', 'Entertainment'),
        ('other', 'Other'),
    ]
    
    name = models.CharField(max_length=255)
    description = models.TextField(null=True, blank=True)
    club_type = models.CharField(max_length=20, choices=CLUB_TYPE_CHOICES, null=True, blank=True)
    custom_type = models.CharField(max_length=255, null=True, blank=True)
    contact_email = models.EmailField(null=True, blank=True)
    contact_phone = models.CharField(max_length=20, null=True, blank=True)
    website = models.URLField(null=True, blank=True)
    logo = models.ImageField(upload_to='club_logos/', null=True, blank=True)
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='owned_clubs')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return self.name


class ClubMember(models.Model):
    club = models.ForeignKey(Club, on_delete=models.CASCADE, related_name='members')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='club_memberships')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['club', 'user']
    
    def __str__(self):
        return f"{self.user.email} - {self.club.name}"


class BoardMember(models.Model):
    club = models.ForeignKey(Club, on_delete=models.CASCADE, related_name='board_members')
    name = models.CharField(max_length=255)
    position = models.CharField(max_length=255, null=True, blank=True)
    email = models.EmailField(null=True, blank=True)
    year_in_college = models.CharField(max_length=50, null=True, blank=True)
    photo_url = models.ImageField(upload_to='board_member_photos/', null=True, blank=True)
    joined_date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.name} - {self.club.name}"


class Achievement(models.Model):
    club = models.ForeignKey(Club, on_delete=models.CASCADE, related_name='achievements')
    title = models.CharField(max_length=255)
    description = models.TextField(null=True, blank=True)
    date_achieved = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.title} - {self.club.name}"


class ClubApplication(models.Model):
    """Club application model"""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]
    
    club = models.ForeignKey(Club, on_delete=models.CASCADE, related_name='applications')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='club_applications')
    application_message = models.TextField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['club', 'user']
    
    def __str__(self):
        return f"{self.user.email} - {self.club.name} - {self.status}"
