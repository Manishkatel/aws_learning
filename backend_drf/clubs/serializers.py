from rest_framework import serializers
from .models import Club, ClubMember, BoardMember, Achievement, ClubApplication


class ClubSerializer(serializers.ModelSerializer):
    owner_id = serializers.SerializerMethodField()
    logo_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Club
        fields = [
            'id', 'name', 'description', 'club_type', 'custom_type',
            'contact_email', 'contact_phone', 'website', 'logo', 'logo_url',
            'owner_id', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'owner_id']
    
    def get_owner_id(self, obj):
        return str(obj.owner.id)
    
    def get_logo_url(self, obj):
        if obj.logo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.logo.url)
            return obj.logo.url
        return None
    
    def create(self, validated_data):
        validated_data['owner'] = self.context['request'].user
        return super().create(validated_data)


class ClubMemberSerializer(serializers.ModelSerializer):
    """Club member serializer"""
    class Meta:
        model = ClubMember
        fields = ['id', 'club', 'user', 'created_at']
        read_only_fields = ['id', 'created_at']


class BoardMemberSerializer(serializers.ModelSerializer):
    """Board member serializer"""
    class Meta:
        model = BoardMember
        fields = [
            'id', 'club', 'name', 'position', 'email', 
            'year_in_college', 'photo_url', 'joined_date',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class AchievementSerializer(serializers.ModelSerializer):
    """Achievement serializer"""
    class Meta:
        model = Achievement
        fields = [
            'id', 'club', 'title', 'description', 
            'date_achieved', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class ClubApplicationSerializer(serializers.ModelSerializer):
    """Club application serializer"""
    class Meta:
        model = ClubApplication
        fields = [
            'id', 'club', 'user', 'application_message',
            'status', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)
        
