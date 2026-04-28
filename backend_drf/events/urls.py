from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
# Register specific routes first to avoid conflicts
router.register(r'event-attendees', views.EventAttendeeViewSet, basename='event-attendee')
router.register(r'event-stars', views.EventStarViewSet, basename='event-star')
# Register main ViewSet last (empty string matches everything else)
router.register(r'', views.EventViewSet, basename='event')

urlpatterns = [
    path('', include(router.urls)),
]

