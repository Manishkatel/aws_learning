from django.contrib import admin
from .models import Event, EventAttendee, EventStar


admin.site.register(Event)
admin.site.register(EventAttendee)
admin.site.register(EventStar)

# @admin.register(Event)
# class EventAdmin(admin.ModelAdmin):
#     list_display = ['title', 'event_type', 'club', 'event_date', 'status', 'created_at']
#     list_filter = ['event_type', 'status', 'event_date', 'created_at']
#     search_fields = ['title', 'description', 'location', 'club__name']
#     readonly_fields = ['created_at', 'updated_at']


# @admin.register(EventAttendee)
# class EventAttendeeAdmin(admin.ModelAdmin):
#     list_display = ['event', 'user', 'created_at']
#     list_filter = ['created_at']
#     search_fields = ['event__title', 'user__email']


# @admin.register(EventStar)
# class EventStarAdmin(admin.ModelAdmin):
#     list_display = ['event', 'user', 'created_at']
#     list_filter = ['created_at']
#     search_fields = ['event__title', 'user__email']
