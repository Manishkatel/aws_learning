from django.contrib import admin
from .models import Club, ClubMember, BoardMember, Achievement, ClubApplication


admin.site.register(Club)
admin.site.register(ClubMember)
admin.site.register(Achievement)
admin.site.register(ClubApplication)

# @admin.register(Club)
# class ClubAdmin(admin.ModelAdmin):
#     list_display = ['name', 'club_type', 'owner', 'contact_email', 'created_at']
#     list_filter = ['club_type', 'created_at']
#     search_fields = ['name', 'description', 'contact_email']
#     readonly_fields = ['created_at', 'updated_at']


# @admin.register(ClubMember)
# class ClubMemberAdmin(admin.ModelAdmin):
#     list_display = ['club', 'user', 'created_at']
#     list_filter = ['created_at']
#     search_fields = ['club__name', 'user__email']


# @admin.register(BoardMember)
# class BoardMemberAdmin(admin.ModelAdmin):
#     list_display = ['name', 'club', 'position', 'joined_date']
#     list_filter = ['club', 'joined_date']
#     search_fields = ['name', 'club__name', 'position']


# @admin.register(Achievement)
# class AchievementAdmin(admin.ModelAdmin):
#     list_display = ['title', 'club', 'date_achieved', 'created_at']
#     list_filter = ['club', 'date_achieved', 'created_at']
#     search_fields = ['title', 'description', 'club__name']


# @admin.register(ClubApplication)
# class ClubApplicationAdmin(admin.ModelAdmin):
#     list_display = ['club', 'user', 'status', 'created_at']
#     list_filter = ['status', 'created_at']
#     search_fields = ['club__name', 'user__email']
