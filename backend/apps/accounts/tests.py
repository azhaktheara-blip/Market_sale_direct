from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from .models import Address, CustomerProfile
from apps.farmers.models import FarmerProfile

User = get_user_model()


class AccountsAuthTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_customer_registration(self):
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
        self.assertIn('tokens', response.data)
        self.assertEqual(response.data['user']['role'], 'CUSTOMER')
        self.assertTrue(CustomerProfile.objects.filter(user__email='newbuyer@example.com').exists())

    def test_farmer_registration(self):
        payload = {
            'email': 'newfarmer@example.com',
            'username': 'newfarmer',
            'password': 'SecureKhmer@2026!',
            'role': 'FARMER',
            'farm_name': 'Sunrise Valley Orchard',
            'province': 'Battambang',
            'farming_practice': 'ORGANIC'
        }
        response = self.client.post('/api/v1/auth/register/', payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('tokens', response.data)
        self.assertEqual(response.data['user']['role'], 'FARMER')
        self.assertTrue(FarmerProfile.objects.filter(user__email='newfarmer@example.com').exists())

    def test_jwt_login_returns_custom_claims(self):
        user = User.objects.create_user(email='testlogin@example.com', password='SecureKhmer@2026!', role='CUSTOMER')
        response = self.client.post('/api/v1/auth/login/', {
            'email': 'testlogin@example.com',
            'password': 'SecureKhmer@2026!'
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('user', response.data)
        self.assertEqual(response.data['user']['email'], 'testlogin@example.com')

    def test_address_management_and_default_toggle(self):
        user = User.objects.create_user(email='addrtest@example.com', password='password123')
        self.client.force_authenticate(user=user)

        # Create first address (should automatically be default)
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

