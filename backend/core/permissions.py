from rest_framework.permissions import BasePermission


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        identity = getattr(request, 'identity', None)
        return bool(identity and identity.role == 'admin')


class IsOverseer(BasePermission):
    def has_permission(self, request, view):
        return (
            request.identity is not None
            and getattr(request.identity, 'handle', None) == 'overseer'
        )
