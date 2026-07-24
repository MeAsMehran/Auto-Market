
from django.test import TestCase
from django.db import IntegrityError
from accounts.models import User

######################################

class UserModelTest(TestCase):

    def test_str(self):
        user = User.objects.create_user(phone='09123456789', name='Ali', password='testpass')
        self.assertEqual(str(user), 'Ali')

    def test_create_user_normalizes_phone(self):
        # format 1
        user1 = User.objects.create_user(phone='+989123456789', name='Ali', password='testpass')
        self.assertEqual(user1.phone, '09123456789')

        # format 2
        user2 = User.objects.create_user(phone='09123456788', name='Ali', password='testpass')
        self.assertEqual(user2.phone, '09123456788')

        # format 3
        user3 = User.objects.create_user(phone='9123456787', name='Ali', password='testpass')
        self.assertEqual(user3.phone, '09123456787')

    def test_create_user_hashes_password(self):
        user = User.objects.create_user(phone='09123456789', name='Ali', password='testpass')
        self.assertNotEqual(user.password, 'testpass')
        self.assertTrue(user.check_password('testpass'))

    def test_create_user_default_is_active_false(self):
        user = User.objects.create_user(phone='09123456789', name='Ali', password='testpass')
        self.assertFalse(user.is_active)

    def test_create_user_default_is_staff_false(self):
        user = User.objects.create_user(phone='09123456789', name='Ali', password='testpass')
        self.assertFalse(user.is_staff)

    def test_create_user_with_email(self):
        user = User.objects.create_user(phone='09123456789', name='Ali', password='testpass', email='Ali@Test.Com')
        self.assertEqual(user.email, 'Ali@test.com')

    def test_create_user_without_email(self):
        user = User.objects.create_user(phone='09123456789', name='Ali', password='testpass')
        self.assertIsNone(user.email)

    def test_create_user_missing_phone(self):
        with self.assertRaises(ValueError):
            User.objects.create_user(phone='', name='Ali', password='testpass')

    def test_create_superuser_sets_flags(self):
        user = User.objects.create_superuser(phone='09123456789', name='Admin', password='testpass')
        self.assertTrue(user.is_active)
        self.assertTrue(user.is_staff)
        self.assertTrue(user.is_superuser)

    def test_create_superuser_is_staff_false(self):
        with self.assertRaises(ValueError):
            User.objects.create_superuser(phone='09123456789', name='Admin', password='testpass', is_staff=False)

    def test_create_superuser_is_superuser_false(self):
        with self.assertRaises(ValueError):
            User.objects.create_superuser(phone='09123456789', name='Admin', password='testpass', is_superuser=False)

    def test_unique_phone_constraint(self):
        User.objects.create_user(phone='09123456789', name='Ali', password='testpass')
        with self.assertRaises(IntegrityError):
            User.objects.create_user(phone='09123456789', name='Another', password='testpass')

    def test_normalize_phone_plus_98_format(self):
        self.assertEqual(User.objects.normalize_phone_number('+989123456789'), '09123456789')

    def test_normalize_phone_zero_leading_format(self):
        self.assertEqual(User.objects.normalize_phone_number('09123456789'), '09123456789')

    def test_normalize_phone_no_leading_zero_format(self):
        self.assertEqual(User.objects.normalize_phone_number('9123456789'), '09123456789')

    def test_normalize_phone_with_spaces(self):
        self.assertEqual(User.objects.normalize_phone_number('0912 345 6789'), '09123456789')

    def test_normalize_phone_wrong_length(self):
        with self.assertRaises(ValueError):
            User.objects.normalize_phone_number('12345678901234')

    def test_normalize_phone_invalid_format(self):
        with self.assertRaises(ValueError):
            User.objects.normalize_phone_number('abc123')

    def test_date_joined_auto_now_add(self):
        user = User.objects.create_user(phone='09123456789', name='Ali', password='testpass')
        self.assertIsNotNone(user.date_joined)

    def test_username_field_is_phone(self):
        self.assertEqual(User.USERNAME_FIELD, 'phone')

    def test_required_fields(self):
        self.assertEqual(User.REQUIRED_FIELDS, ['name'])

    def test_get_by_natural_key(self):
        User.objects.create_user(phone='09123456789', name='Ali', password='testpass')
        user = User.objects.get_by_natural_key('09123456789')
        self.assertEqual(user.name, 'Ali')

    def test_get_by_natural_key_not_found(self):
        with self.assertRaises(User.DoesNotExist):
            User.objects.get_by_natural_key('09123456789')


















