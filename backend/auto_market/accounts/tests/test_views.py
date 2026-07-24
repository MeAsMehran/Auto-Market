
from rest_framework.test import APITestCase
from rest_framework import status
from django.urls import reverse

from accounts.models import User

############################################

class RegisterViewTests(APITestCase):

    def setUp(self):
        self.url = reverse("register")  # or '/api/auth/accounts/register/'

        self.valid_data = {
            "phone": "09929132029",
            "name": "Test User",
            "password": "mehrannn",
            "confirm_password": "mehrannn",
        }

    def test_register_success(self):
        """Valid data creates a user."""

        response = self.client.post(
            self.url,
            self.valid_data,
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Response
        self.assertEqual(response.data["phone"], "09929132029")
        self.assertEqual(response.data["name"], "Test User")
        self.assertIn("id", response.data)
        self.assertIn("date_joined", response.data)

        # User exists
        self.assertTrue(
            User.objects.filter(phone="09929132029").exists()
        )

        user = User.objects.get(phone="09929132029")

        self.assertEqual(user.name, "Test User")
        self.assertTrue(user.is_active, True)
        self.assertTrue(user.check_password("mehrannn"))


class LoginViewTests(APITestCase):

    def setUp(self) -> None:

        self.url = reverse('login')
        self.password = "mehrannn"

        self.user = User.objects.create_user(
            phone='09929132029',
            name='Test User',
            password=self.password,
            email=None,
        )
        self.user.is_active = True
        self.user.save(update_fields=['is_active'])

        self.valid_data = {
            'phone' : "09929132029",
            'password' : self.password,
        }

    def test_login_success(self):
        """Valid data logins a user."""

        response = self.client.post(
            self.url,
            self.valid_data,
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Response
        self.assertIn("access", response.data)
        self.assertIn("user", response.data)

        user_data = response.data["user"]
        self.assertIn("id", user_data)
        self.assertIn("name", user_data)
        self.assertIn("phone", user_data)
        self.assertIn("date_joined", user_data)
        self.assertEqual(user_data["phone"], "09929132029")
        self.assertEqual(user_data["name"], "Test User")


class MeViewTests(APITestCase):
    
    def setUp(self) -> None:
        
        self.url = reverse('me')
        self.user = User.objects.create_user(phone='09929132029', name='Test User', password='mehrannn', email=None)
        self.user.is_active = True
        self.user.save(update_fields=['is_active'])

    def test_me_success(self):
        """Authenticated user gets their profile."""

        self.client.force_authenticate(user=self.user)
        response = self.client.get(self.url, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('id', response.data)
        self.assertIn('phone', response.data)
        self.assertIn('name', response.data)
        self.assertIn('date_joined', response.data)
        self.assertEqual(response.data['phone'], "09929132029")
        self.assertEqual(response.data['name'], 'Test User')

    def test_me_unauthorized(self):
        """Unauthenticated request returns 401."""

        response = self.client.post(self.url, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class LogoutViewTests(APITestCase):
    
    def setUp(self) -> None:
        self.url = reverse('logout')
        self.password = 'mehrannn'

        self.user = User.objects.create_user(phone='09929132029', name='Test User', password=self.password)
        self.user.is_active = True
        self.user.save(update_fields=['is_active'])

    def test_logout_success(self):
        self.client.force_authenticate(user=self.user)
        self.client.cookies['refresh_token'] = "some-token"     # set a token
        response = self.client.post(self.url, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('detail', response.data)

    def test_logout_unauthorized(self):
        response = self.client.post(self.url, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_logout_without_cookie(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post(self.url, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('detail', response.data)


class CookieTokenRefreshViewTests(APITestCase):

    def setUp(self):
        self.url = reverse('refresh')
        self.user = User.objects.create_user(
            phone='09929132029',
            name='Test User',
            password='mehrannn',
        )
        self.user.is_active = True
        self.user.save(update_fields=['is_active'])

    def _login_and_get_cookie(self):
        login_url = reverse('login')
        res = self.client.post(login_url, {
            'phone': '09929132029',
            'password': 'mehrannn',
        }, format='json')
        return res.cookies.get('refresh_token')

    def test_refresh_success(self):
        cookie = self._login_and_get_cookie()
        self.client.cookies['refresh_token'] = cookie
        response = self.client.post(self.url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)

    def test_refresh_no_cookie(self):
        response = self.client.post(self.url, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn('detail', response.data)

    def test_refresh_invalid_token(self):
        self.client.cookies['refresh_token'] = 'not-a-valid-jwt'
        response = self.client.post(self.url, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn('detail', response.data)











