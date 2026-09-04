import uuid
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
from apps.core.models import TimeStampedModel


class UserManager(BaseUserManager):
    use_in_migrations = True

    def _create_user(self, email, password, **extra_fields):
        if not email:
            raise ValueError('The Email must be set')
        email = self.normalize_email(email)
        username = extra_fields.pop('username', email.split('@')[0])
        user = self.model(email=email, username=username, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', False)
        extra_fields.setdefault('is_superuser', False)
        extra_fields.setdefault('role', User.Role.CUSTOMER)
        return self._create_user(email, password, **extra_fields)

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', User.Role.ADMIN)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self._create_user(email, password, **extra_fields)


class User(AbstractUser):
    class Role(models.TextChoices):
        CUSTOMER = 'CUSTOMER', 'Customer / Buyer'
        FARMER = 'FARMER', 'Farmer / Producer'
        ADMIN = 'ADMIN', 'Marketplace Admin'

    class AuthProvider(models.TextChoices):
        EMAIL = 'EMAIL', 'Email & Password'
        GOOGLE = 'GOOGLE', 'Google OAuth 2.0'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True, db_index=True)
    phone_number = models.CharField(max_length=30, blank=True, null=True)
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.CUSTOMER, db_index=True)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    email_verified = models.BooleanField(default=False, db_index=True)
    auth_provider = models.CharField(max_length=20, choices=AuthProvider.choices, default=AuthProvider.EMAIL, db_index=True)
    google_sub = models.CharField(max_length=255, blank=True, null=True, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    @property
    def account_id(self):
        prefix = 'FMR' if self.role == self.Role.FARMER else ('ADM' if self.role == self.Role.ADMIN else 'USR')
        return f"{prefix}-{str(self.id)[:8].upper()}"

    def __str__(self):
        return f"{self.email} ({self.role})"


class CustomerProfile(TimeStampedModel):
    class BusinessType(models.TextChoices):
        INDIVIDUAL = 'INDIVIDUAL', 'Individual Consumer'
        RESTAURANT = 'RESTAURANT', 'Restaurant / Cafe'
        HOTEL = 'HOTEL', 'Hotel / Resort'
        LOCAL_STORE = 'LOCAL_STORE', 'Local Grocery / Store'
        OTHER = 'OTHER', 'Other Organization'

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='customer_profile')
    profile_image = models.ImageField(upload_to='customers/profiles/', blank=True, null=True)
    business_name = models.CharField(max_length=200, blank=True)
    business_type = models.CharField(max_length=30, choices=BusinessType.choices, default=BusinessType.INDIVIDUAL)
    delivery_instructions = models.TextField(blank=True)

    def __str__(self):
        return f"Customer Profile: {self.user.email}"


class Address(TimeStampedModel):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='addresses')
    label = models.CharField(max_length=100, default='Home', help_text='e.g. Home, Kitchen, Warehouse')
    recipient_name = models.CharField(max_length=150)
    phone_number = models.CharField(max_length=30)
    province = models.CharField(max_length=100, db_index=True)
    district = models.CharField(max_length=100)
    commune = models.CharField(max_length=100, blank=True)
    street_address = models.CharField(max_length=255)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    is_default = models.BooleanField(default=False)

    class Meta:
        ordering = ['-is_default', '-created_at']

    def save(self, *args, **kwargs):
        if self.is_default:
            Address.objects.filter(user=self.user, is_default=True).exclude(id=self.id).update(is_default=False)
        elif not Address.objects.filter(user=self.user).exclude(id=self.id).exists():
            self.is_default = True
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.recipient_name} - {self.street_address}, {self.province}"

