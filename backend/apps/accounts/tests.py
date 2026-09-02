from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from .models import Address, CustomerProfile
from apps.farmers.models import FarmerProfile
from .utils import generate_verification_token

User = get_user_model()


class AccountsAuthTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_customer_registration_requires_verification(self):
        payload = {
            'email': 'newbuyer@example.com',
            'username': 'newbuyer',
            'password': 'SecureKhmer@2026!',
            'role': 'CUSTOMER',
            'phone_number': '+85512000111',
            'business_name': 'Green Leaf Bistro',
            'business_type': 'RESTAURANT'
        }
        response = self.client.post('/api/v1/auth/register/', payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data.get('requires_verification'))
        self.assertEqual(response.data['user']['role'], 'CUSTOMER')
        
        user = User.objects.get(email='newbuyer@example.com')
        self.assertFalse(user.email_verified)
        self.assertTrue(CustomerProfile.objects.filter(user=user).exists())

    def test_unverified_user_cannot_login(self):
        User.objects.create_user(
            email='unverified@example.com',
            password='SecureKhmer@2026!',
            role='CUSTOMER',
            email_verified=False
        )
        response = self.client.post('/api/v1/auth/login/', {
            'email': 'unverified@example.com',
            'password': 'SecureKhmer@2026!'
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email_not_verified', str(response.data))

    def test_email_verification_success_and_auto_login(self):
        user = User.objects.create_user(
            email='verify_me@example.com',
            password='SecureKhmer@2026!',
            role='CUSTOMER',
            email_verified=False
        )
        uidb64, token = generate_verification_token(user)

        response = self.client.post('/api/v1/auth/verify-email/', {
            'uid': uidb64,
            'token': token
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('tokens', response.data)
        self.assertIn('access', response.data['tokens'])

        user.refresh_from_db()
        self.assertTrue(user.email_verified)

        # Login now succeeds
        login_res = self.client.post('/api/v1/auth/login/', {
            'email': 'verify_me@example.com',
            'password': 'SecureKhmer@2026!'
        })
        self.assertEqual(login_res.status_code, status.HTTP_200_OK)
        self.assertIn('access', login_res.data)

    def test_tampered_token_rejected(self):
        user = User.objects.create_user(
            email='tamper@example.com',
            password='SecureKhmer@2026!',
            role='CUSTOMER',
            email_verified=False
        )
        uidb64, _ = generate_verification_token(user)

        response = self.client.post('/api/v1/auth/verify-email/', {
            'uid': uidb64,
            'token': 'invalid-tampered-token-123'
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['code'], 'invalid_token')

    def test_resend_verification_email(self):
        User.objects.create_user(
            email='resend@example.com',
            password='SecureKhmer@2026!',
            role='CUSTOMER',
            email_verified=False
        )
        response = self.client.post('/api/v1/auth/resend-verification/', {
            'email': 'resend@example.com'
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'success')

    def test_address_management_and_default_toggle(self):
        user = User.objects.create_user(
            email='addrtest@example.com',
            password='SecureKhmer@2026!',
            email_verified=True
        )
        self.client.force_authenticate(user=user)

        # Create first address
        res1 = self.client.post('/api/v1/addresses/', {
            'label': 'Home',
            'recipient_name': 'Addr Tester',
            'phone_number': '+85512345678',
            'province': 'Siem Reap',
            'district': 'Siem Reap',
            'street_address': 'Wat Bo Rd'
        })
        self.assertEqual(res1.status_code, status.HTTP_201_CREATED)
        self.assertTrue(res1.data['is_default'])

        # Create second address as default
        res2 = self.client.post('/api/v1/addresses/', {
            'label': 'Kitchen',
            'recipient_name': 'Addr Tester Kitchen',
            'phone_number': '+85512345678',
            'province': 'Phnom Penh',
            'district': 'Daun Penh',
            'street_address': 'St 178',
            'is_default': True
        })
        self.assertEqual(res2.status_code, status.HTTP_201_CREATED)
        self.assertTrue(res2.data['is_default'])

        # Verify first address is no longer default
        addr1 = Address.objects.get(id=res1.data['id'])
        self.assertFalse(addr1.is_default)
