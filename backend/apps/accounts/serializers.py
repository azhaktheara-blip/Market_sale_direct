from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model
from django.db import transaction
from .models import CustomerProfile, Address
from apps.farmers.models import FarmerProfile

User = get_user_model()


class CustomerProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomerProfile
        fields = ['id', 'business_name', 'business_type', 'delivery_instructions']


class FarmerSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = FarmerProfile
        fields = ['id', 'farm_name', 'slug', 'province', 'is_verified', 'verification_status', 'profile_image', 'rating_avg']


class UserSerializer(serializers.ModelSerializer):
    account_id = serializers.CharField(read_only=True)
    customer_profile = CustomerProfileSerializer(read_only=True)
    farmer_profile = FarmerSummarySerializer(read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'account_id', 'email', 'username', 'phone_number', 'role',
            'email_verified', 'auth_provider',
            'avatar', 'customer_profile', 'farmer_profile',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'account_id', 'email_verified', 'auth_provider', 'created_at', 'updated_at']


from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    role = serializers.ChoiceField(
        choices=[(User.Role.CUSTOMER, 'Customer'), (User.Role.FARMER, 'Farmer')],
        default=User.Role.CUSTOMER
    )
    
    # Extra fields for farmer registration
    farm_name = serializers.CharField(required=False, allow_blank=True)
    province = serializers.CharField(required=False, allow_blank=True)
    district = serializers.CharField(required=False, allow_blank=True)
    farming_practice = serializers.CharField(required=False, allow_blank=True)
    bio = serializers.CharField(required=False, allow_blank=True)
    bank_name = serializers.CharField(required=False, allow_blank=True)
    bank_account_name = serializers.CharField(required=False, allow_blank=True)
    bank_account_number = serializers.CharField(required=False, allow_blank=True)
    bakong_account_id = serializers.CharField(required=False, allow_blank=True)

    # Extra fields for business customers
    business_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    business_type = serializers.ChoiceField(choices=CustomerProfile.BusinessType.choices, required=False)
    profile_image = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = User
        fields = [
            'id', 'email', 'username', 'password', 'phone_number', 'role',
            'farm_name', 'province', 'district', 'farming_practice', 'bio',
            'bank_name', 'bank_account_name', 'bank_account_number', 'bakong_account_id',
            'business_name', 'business_type', 'profile_image'
        ]

    def validate_password(self, value):
        try:
            validate_password(value)
        except DjangoValidationError as e:
            raise serializers.ValidationError(list(e.messages))
        return value

    def validate(self, attrs):
        role = attrs.get('role', User.Role.CUSTOMER)
        if role not in [User.Role.CUSTOMER, User.Role.FARMER]:
            raise serializers.ValidationError({"role": "Invalid registration role."})

        if role == User.Role.FARMER:
            if not attrs.get('farm_name') or len(attrs.get('farm_name', '').strip()) < 3:
                raise serializers.ValidationError({"farm_name": "Farm name is required (min 3 characters)."})
            if not attrs.get('province'):
                raise serializers.ValidationError({"province": "Province/City is required when registering as a farmer."})
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        role = validated_data.get('role', User.Role.CUSTOMER)
        farm_name = validated_data.pop('farm_name', '')
        province = validated_data.pop('province', 'Siem Reap')
        district = validated_data.pop('district', '')
        farming_practice = validated_data.pop('farming_practice', FarmerProfile.FarmingPractice.ORGANIC)
        bio = validated_data.pop('bio', '')
        bank_name = validated_data.pop('bank_name', 'ABA Bank')
        bank_account_name = validated_data.pop('bank_account_name', '')
        bank_account_number = validated_data.pop('bank_account_number', '')
        bakong_account_id = validated_data.pop('bakong_account_id', '')
        business_name = validated_data.pop('business_name', '')
        business_type = validated_data.pop('business_type', CustomerProfile.BusinessType.INDIVIDUAL)
        profile_image = validated_data.pop('profile_image', None)
        password = validated_data.pop('password')

        from django.conf import settings
        verification_required = getattr(settings, 'EMAIL_VERIFICATION_REQUIRED', False)
        if not verification_required:
            validated_data['email_verified'] = True

        user = User.objects.create_user(password=password, **validated_data)

        if role == User.Role.FARMER:
            profile = FarmerProfile.objects.create(
                user=user,
                farm_name=farm_name,
                province=province,
                district=district,
                farming_practice=farming_practice or FarmerProfile.FarmingPractice.ORGANIC,
                bio=bio or f"Fresh natural produce straight from {farm_name}.",
                story=f"Welcome to {farm_name}. We take pride in cultivating healthy, clean, and sustainable agricultural products directly for our community.",
                bank_name=bank_name or 'ABA Bank',
                bank_account_name=bank_account_name or farm_name,
                bank_account_number=bank_account_number,
                bakong_account_id=bakong_account_id,
            )
            if profile_image:
                profile.profile_image = profile_image
                profile.save()
        else:
            profile = CustomerProfile.objects.create(
                user=user,
                business_name=business_name,
                business_type=business_type or CustomerProfile.BusinessType.INDIVIDUAL
            )
            if profile_image:
                profile.profile_image = profile_image
                profile.save()

        return user


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        user = self.user

        # Gate login on email verification only when required
        if not user.is_staff and not user.is_superuser:
            from django.conf import settings
            verification_required = getattr(settings, 'EMAIL_VERIFICATION_REQUIRED', False)
            if verification_required and not user.email_verified and getattr(user, 'auth_provider', 'EMAIL') == User.AuthProvider.EMAIL:
                raise serializers.ValidationError({
                    'detail': 'Please verify your email address before logging in.',
                    'code': 'email_not_verified',
                    'email': user.email
                })
            elif not user.email_verified:
                user.email_verified = True
                user.save(update_fields=['email_verified'])

        user_data = {
            'id': str(user.id),
            'account_id': user.account_id,
            'email': user.email,
            'username': user.username,
            'phone_number': user.phone_number,
            'role': user.role,
            'email_verified': user.email_verified,
            'auth_provider': user.auth_provider,
            'avatar': user.avatar.url if user.avatar else None,
        }

        if user.role == User.Role.FARMER and hasattr(user, 'farmer_profile'):
            fp = user.farmer_profile
            user_data['farmer_profile'] = {
                'id': str(fp.id),
                'farm_name': fp.farm_name,
                'slug': fp.slug,
                'province': fp.province,
                'is_verified': fp.is_verified,
                'verification_status': fp.verification_status,
                'rating_avg': float(fp.rating_avg),
            }
        elif hasattr(user, 'customer_profile'):
            cp = user.customer_profile
            user_data['customer_profile'] = {
                'id': str(cp.id),
                'business_name': cp.business_name,
                'business_type': cp.business_type,
            }

        data['user'] = user_data
        return data


class VerifyEmailSerializer(serializers.Serializer):
    uid = serializers.CharField(required=True)
    token = serializers.CharField(required=True)


class ResendVerificationSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)


class GoogleAuthSerializer(serializers.Serializer):
    id_token = serializers.CharField(required=True)


class UserProfileUpdateSerializer(serializers.ModelSerializer):
    business_name = serializers.CharField(write_only=True, required=False, allow_blank=True)
    business_type = serializers.CharField(write_only=True, required=False, allow_blank=True)
    delivery_instructions = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ['username', 'phone_number', 'avatar', 'business_name', 'business_type', 'delivery_instructions']

    def update(self, instance, validated_data):
        business_name = validated_data.pop('business_name', None)
        business_type = validated_data.pop('business_type', None)
        delivery_instructions = validated_data.pop('delivery_instructions', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if hasattr(instance, 'customer_profile'):
            cp = instance.customer_profile
            if business_name is not None:
                cp.business_name = business_name
            if business_type is not None:
                cp.business_type = business_type
            if delivery_instructions is not None:
                cp.delivery_instructions = delivery_instructions
            cp.save()

        return instance


class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = [
            'id', 'label', 'recipient_name', 'phone_number',
            'province', 'district', 'commune', 'street_address',
            'latitude', 'longitude', 'is_default',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)

