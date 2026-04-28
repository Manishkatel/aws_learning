from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Profile


admin.site.register(User)
admin.site.register(Profile)
# @admin.register(User)
# class UserAdmin(BaseUserAdmin):
#     list_display = ['email', 'username', 'is_staff', 'is_active', 'date_joined']
#     list_filter = ['is_staff', 'is_active', 'date_joined']
#     search_fields = ['email', 'username']
#     ordering = ['email']


# @admin.register(Profile)
# class ProfileAdmin(admin.ModelAdmin):
#     list_display = ['user', 'full_name', 'email', 'role', 'created_at']
#     list_filter = ['role', 'created_at']
#     search_fields = ['user__email', 'full_name', 'email']
#     readonly_fields = ['created_at', 'updated_at']
