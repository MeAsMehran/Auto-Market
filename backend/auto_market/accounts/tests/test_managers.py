from django.test import TestCase
from accounts.models import User


class CreateUserTests(TestCase):
    """Tests for CustomUserManager.create_user()"""

    def test_normalizes_phone_plus_98(self):
        user = User.objects.create_user(phone='+989123456789', name='Ali', password='testpass')
        self.assertEqual(user.phone, '09123456789')

    def test_normalizes_phone_zero_leading(self):
        user = User.objects.create_user(phone='09123456789', name='Ali', password='testpass')
        self.assertEqual(user.phone, '09123456789')

    def test_normalizes_phone_no_leading_zero(self):
        user = User.objects.create_user(phone='9123456789', name='Ali', password='testpass')
        self.assertEqual(user.phone, '09123456789')

    def test_normalizes_email(self):
        user = User.objects.create_user(phone='09123456789', name='Ali', password='testpass', email='Ali@Test.Com')
        self.assertEqual(user.email, 'Ali@test.com')

    def test_handles_missing_email(self):
        user = User.objects.create_user(phone='09123456789', name='Ali', password='testpass')
        self.assertIsNone(user.email)

    def test_hashes_password(self):
        user = User.objects.create_user(phone='09123456789', name='Ali', password='testpass')
        self.assertNotEqual(user.password, 'testpass')

    def test_password_is_checkable(self):
        user = User.objects.create_user(phone='09123456789', name='Ali', password='testpass')
        self.assertTrue(user.check_password('testpass'))
        self.assertFalse(user.check_password('wrongpass'))

    def test_saves_to_db(self):
        count_before = User.objects.count()
        User.objects.create_user(phone='09123456789', name='Ali', password='testpass')
        self.assertEqual(User.objects.count(), count_before + 1)

    def test_missing_phone_raises_value_error(self):
        with self.assertRaises(ValueError):
            User.objects.create_user(phone='', name='Ali', password='testpass')

    def test_default_is_active_false(self):
        user = User.objects.create_user(phone='09123456789', name='Ali', password='testpass')
        self.assertFalse(user.is_active)

    def test_default_is_staff_false(self):
        user = User.objects.create_user(phone='09123456789', name='Ali', password='testpass')
        self.assertFalse(user.is_staff)


class CreateSuperuserTests(TestCase):
    """Tests for CustomUserManager.create_superuser()"""

    def test_sets_is_active_true(self):
        user = User.objects.create_superuser(phone='09123456789', name='Admin', password='testpass')
        self.assertTrue(user.is_active)

    def test_sets_is_staff_true(self):
        user = User.objects.create_superuser(phone='09123456789', name='Admin', password='testpass')
        self.assertTrue(user.is_staff)

    def test_sets_is_superuser_true(self):
        user = User.objects.create_superuser(phone='09123456789', name='Admin', password='testpass')
        self.assertTrue(user.is_superuser)

    def test_is_staff_false_raises_value_error(self):
        with self.assertRaises(ValueError):
            User.objects.create_superuser(phone='09123456789', name='Admin', password='testpass', is_staff=False)

    def test_is_superuser_false_raises_value_error(self):
        with self.assertRaises(ValueError):
            User.objects.create_superuser(phone='09123456789', name='Admin', password='testpass', is_superuser=False)

    def test_normalizes_phone(self):
        user = User.objects.create_superuser(phone='+989123456789', name='Admin', password='testpass')
        self.assertEqual(user.phone, '09123456789')

    def test_hashes_password(self):
        user = User.objects.create_superuser(phone='09123456789', name='Admin', password='testpass')
        self.assertNotEqual(user.password, 'testpass')
        self.assertTrue(user.check_password('testpass'))


class NormalizePhoneNumberTests(TestCase):
    """Tests for CustomUserManager.normalize_phone_number()"""

    def test_plus_98_format(self):
        self.assertEqual(User.objects.normalize_phone_number('+989123456789'), '09123456789')

    def test_zero_leading_format(self):
        self.assertEqual(User.objects.normalize_phone_number('09123456789'), '09123456789')

    def test_no_leading_zero_format(self):
        self.assertEqual(User.objects.normalize_phone_number('9123456789'), '09123456789')

    def test_strips_spaces(self):
        self.assertEqual(User.objects.normalize_phone_number('0912 345 6789'), '09123456789')

    def test_invalid_format_raises_value_error(self):
        with self.assertRaises(ValueError):
            User.objects.normalize_phone_number('abc123')

    def test_wrong_length_raises_value_error(self):
        with self.assertRaises(ValueError):
            User.objects.normalize_phone_number('12345678901234')

    def test_empty_string_raises_value_error(self):
        with self.assertRaises(ValueError):
            User.objects.normalize_phone_number('')


class GetByNaturalKeyTests(TestCase):
    """Tests for CustomUserManager.get_by_natural_key()"""

    def setUp(self):
        self.user = User.objects.create_user(phone='09123456789', name='Ali', password='testpass')

    def test_finds_user_by_phone(self):
        found = User.objects.get_by_natural_key('09123456789')
        self.assertEqual(found, self.user)

    def test_normalizes_input_phone(self):
        found = User.objects.get_by_natural_key('+989123456789')
        self.assertEqual(found, self.user)

    def test_not_found_raises_does_not_exist(self):
        with self.assertRaises(User.DoesNotExist):
            User.objects.get_by_natural_key('09999999999')



