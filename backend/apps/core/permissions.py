from rest_framework import permissions


class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Allow GET/HEAD/OPTIONS to anyone, but only ADMIN users can modify.
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return bool(request.user and request.user.is_authenticated and (request.user.is_staff or request.user.role == 'ADMIN'))


class IsAdminUserOnly(permissions.BasePermission):
    """
    Strictly allow only ADMIN users.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and (request.user.is_staff or request.user.role == 'ADMIN'))


class IsFarmer(permissions.BasePermission):
    """
    Allow access only to registered FARMER users.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'FARMER')


class IsCustomer(permissions.BasePermission):
    """
    Allow access only to registered CUSTOMER users.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'CUSTOMER')


class IsOwnerOrAdmin(permissions.BasePermission):
    """
    Object-level permission to only allow owners of an object or admins to view/edit it.
    """
    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_staff or request.user.role == 'ADMIN':
            return True
        
        # Check user field or farmer.user or customer.user
        if hasattr(obj, 'user'):
            return obj.user == request.user
        if hasattr(obj, 'customer'):
            return obj.customer == request.user
        if hasattr(obj, 'farmer') and hasattr(obj.farmer, 'user'):
            return obj.farmer.user == request.user
        return False

