from django.contrib import admin
from .models import FarmerProfile, FarmerVerification


class FarmerVerificationInline(admin.StackedInline):
    model = FarmerVerification
    extra = 0


@admin.register(FarmerProfile)
class FarmerProfileAdmin(admin.ModelAdmin):
    list_display = ('farm_name', 'user', 'province', 'farming_practice', 'is_verified', 'verification_status', 'rating_avg', 'created_at')
    list_filter = ('is_verified', 'verification_status', 'farming_practice', 'province')
    search_fields = ('farm_name', 'user__email', 'province', 'district')
    prepopulated_fields = {'slug': ('farm_name',)}
    inlines = [FarmerVerificationInline]
    actions = ['approve_verification', 'reject_verification']

    def approve_verification(self, request, queryset):
        queryset.update(is_verified=True, verification_status=FarmerProfile.VerificationStatus.APPROVED)
    approve_verification.short_description = "Approve selected farmers for Verified Badge"

    def reject_verification(self, request, queryset):
        queryset.update(is_verified=False, verification_status=FarmerProfile.VerificationStatus.REJECTED)
    reject_verification.short_description = "Reject selected farmers verification"


@admin.register(FarmerVerification)
class FarmerVerificationAdmin(admin.ModelAdmin):
    list_display = ('farmer', 'reviewed_by', 'reviewed_at', 'created_at')
    search_fields = ('farmer__farm_name',)

