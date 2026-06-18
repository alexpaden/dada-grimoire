from rest_framework import serializers

from accounts.models import Identity


class IdentitySerializer(serializers.ModelSerializer):
    handle = serializers.CharField(max_length=64)

    class Meta:
        model = Identity
        # `role` is writable here (the mass-assignment bug). Escalating no longer
        # hands back anything — the operator has to use the admin role they gained.
        fields = ["handle", "role", "bio"]
