from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
# Register specific routes first to avoid conflicts
router.register(r'club-members', views.ClubMemberViewSet, basename='club-member')
router.register(r'board-members', views.BoardMemberViewSet, basename='board-member')
router.register(r'achievements', views.AchievementViewSet, basename='achievement')
router.register(r'club-applications', views.ClubApplicationViewSet, basename='club-application')
# Register main ViewSet last (empty string matches everything else)
router.register(r'', views.ClubViewSet, basename='club')

urlpatterns = [
    path('', include(router.urls)),
]

