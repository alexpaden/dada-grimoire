from rest_framework import serializers

from .models import Identity


class IdentitySerializer(serializers.ModelSerializer):
    handle = serializers.CharField(max_length=64)

    class Meta:
        model = Identity
        fields = ['handle', 'bio']


class ProfileCardSerializer(serializers.ModelSerializer):
    """Public profile card used by the richer profile editor."""

    class Meta:
        model = Identity
        fields = '__all__'
        read_only_fields = [
            'id', 'role', 'points', 'staff_note', 'is_npc',
            'created_at', 'last_seen',
        ]
