from django.db import models
from django.conf import settings
from django.utils.text import slugify
from apps.core.models import TimeStampedModel


class FarmerProfile(TimeStampedModel):
    class FarmingPractice(models.TextChoices):
        ORGANIC = 'ORGANIC', 'Certified Organic / Natural'
        CONVENTIONAL = 'CONVENTIONAL', 'Conventional Sustainable'
        HYDROPONIC = 'HYDROPONIC', 'Hydroponic / Greenhouse'
        PERMACULTURE = 'PERMACULTURE', 'Permaculture / Agroforestry'
        REGENERATIVE = 'REGENERATIVE', 'Regenerative Agriculture'

    class VerificationStatus(models.TextChoices):
        PENDING = 'PENDING', 'Pending Review'
        APPROVED = 'APPROVED', 'Verified & Approved'
        REJECTED = 'REJECTED', 'Verification Rejected'

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='farmer_profile'
    )
    farm_name = models.CharField(max_length=200, db_index=True)
    slug = models.SlugField(max_length=220, unique=True, db_index=True)
    bio = models.CharField(max_length=300, help_text="Short 1-2 sentence farm hook.")
    story = models.TextField(help_text="Full background story, values, and traditions.")
    farming_practice = models.CharField(
        max_length=30,
        choices=FarmingPractice.choices,
        default=FarmingPractice.ORGANIC,
        db_index=True
    )
    years_of_experience = models.PositiveIntegerField(default=1)
    profile_image = models.ImageField(upload_to='farmers/profiles/', blank=True, null=True)
    cover_image = models.ImageField(upload_to='farmers/covers/', blank=True, null=True)
    
    # Location
    province = models.CharField(max_length=100, db_index=True)
    district = models.CharField(max_length=100)
    commune = models.CharField(max_length=100, blank=True)
    address_line = models.CharField(max_length=255)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    phone_number = models.CharField(max_length=30, blank=True)
    website_url = models.URLField(blank=True)

    # Direct Banking & QR Payment Credentials
    bank_name = models.CharField(max_length=100, blank=True, default='ABA Bank')
    bank_account_name = models.CharField(max_length=150, blank=True)
    bank_account_number = models.CharField(max_length=50, blank=True)
    bakong_account_id = models.CharField(max_length=100, blank=True, help_text="e.g. sokha_farm@aba or 012888999@aclb")
    farmer_qr_image = models.ImageField(upload_to='farmers/qrcodes/', blank=True, null=True)

    # Trust & Reputation
    is_verified = models.BooleanField(default=False, db_index=True)
    verification_status = models.CharField(
        max_length=20,
        choices=VerificationStatus.choices,
        default=VerificationStatus.PENDING,
        db_index=True
    )
    rating_avg = models.DecimalField(max_digits=3, decimal_places=2, default=0.00, db_index=True)
    rating_count = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['-is_verified', '-rating_avg', '-created_at']

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.farm_name)
            slug = base_slug
            counter = 1
            while FarmerProfile.objects.filter(slug=slug).exclude(id=self.id).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = slug
        super().save(*args, **kwargs)

    def recalculate_rating(self):
        from apps.reviews.models import Review
        reviews = Review.objects.filter(farmer=self, is_approved=True)
        count = reviews.count()
        if count > 0:
            avg = reviews.aggregate(models.Avg('rating'))['rating__avg'] or 0.0
            self.rating_avg = round(avg, 2)
            self.rating_count = count
        else:
            self.rating_avg = 0.0
            self.rating_count = 0
        self.save(update_fields=['rating_avg', 'rating_count'])

    def __str__(self):
        return f"{self.farm_name} ({self.province})"


class FarmerVerification(TimeStampedModel):
    farmer = models.OneToOneField(FarmerProfile, on_delete=models.CASCADE, related_name='verification_doc')
    id_card_image = models.ImageField(upload_to='verifications/ids/', blank=True, null=True)
    land_certificate_image = models.ImageField(upload_to='verifications/land/', blank=True, null=True)
    organic_certification_doc = models.FileField(upload_to='verifications/certs/', blank=True, null=True)
    admin_notes = models.TextField(blank=True)
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reviewed_verifications'
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Verification for {self.farmer.farm_name}"

