
from django.test import SimpleTestCase

from rest_framework.exceptions import ValidationError, AuthenticationFailed
from unittest.mock import patch, MagicMock

from accounts.validations.validate_user_register import validate as register_validate
from accounts.validations.validate_user_login import validate as login_validate
from accounts.models import User

###################################################

class RegisterValidationTests(SimpleTestCase):
    """Tests for validate_user_register.py"""

    def test_missing_phone(self):
        with self.assertRaises(ValidationError):
            register_validate({'name': 'Test', 'password': 'mehrannn', 'confirm_password': 'mehrannn'})

    def test_missing_name(self):
        with self.assertRaises(ValidationError):
            register_validate({'phone': '09929132029', 'password': 'mehrannn', 'confirm_password': 'mehrannn'})

    def test_missing_password(self):
        with self.assertRaises(ValidationError):
            register_validate({'phone': '09929132029', 'name': 'Test', 'confirm_password': 'mehrannn'})

    def test_missing_confirm_password(self):
        with self.assertRaises(ValidationError):
            register_validate({'phone': '09929132029', 'name': 'Test', 'password': 'mehrannn'})

    def test_password_mismatch(self):
        with self.assertRaises(ValidationError):
            register_validate({
                'phone': '09929132029', 'name': 'Test',
                'password': 'mehrannn', 'confirm_password': 'different'
            })

    @patch('accounts.validations.validate_user_register.User.objects.normalize_phone_number')
    def test_invalid_phone_format(self, mock_normalize):
        mock_normalize.side_effect = ValueError("Invalid Iranian phone number format")
        with self.assertRaises(ValidationError):
            register_validate({
                'phone': '12345', 'name': 'Test',
                'password': 'mehrannn', 'confirm_password': 'mehrannn'
            })

    @patch('accounts.validations.validate_user_register.User.objects.normalize_phone_number')
    def test_phone_wrong_length(self, mock_normalize):
        mock_normalize.return_value = '0992913202'
        with self.assertRaises(ValidationError):
            register_validate({
                'phone': '0992913202', 'name': 'Test',
                'password': 'mehrannn', 'confirm_password': 'mehrannn'
            })

    @patch('accounts.validations.validate_user_register.User.objects.normalize_phone_number')
    @patch('accounts.validations.validate_user_register.User.objects.filter')
    def test_duplicate_phone(self, mock_filter, mock_normalize):
        mock_normalize.return_value = '09929132029'
        mock_filter.return_value.first.return_value = MagicMock()
        with self.assertRaises(ValidationError):
            register_validate({
                'phone': '09929132029', 'name': 'Test',
                'password': 'mehrannn', 'confirm_password': 'mehrannn'
            })

    @patch('accounts.validations.validate_user_register.User.objects.normalize_phone_number')
    @patch('accounts.validations.validate_user_register.User.objects.filter')
    def test_valid_registration_data(self, mock_filter, mock_normalize):
        mock_normalize.return_value = '09929132029'
        mock_filter.return_value.first.return_value = None
        data = {'phone': '09929132029', 'name': 'Test', 'password': 'mehrannn', 'confirm_password': 'mehrannn'}
        result = register_validate(data.copy())
        self.assertEqual(result['phone'], '09929132029')
        self.assertEqual(result['name'], 'Test')



class LoginValidationTests(SimpleTestCase):

    def test_missing_phone(self):
        with self.assertRaises(ValidationError):
            login_validate({'password' : 'mehrannn'})

    def test_missing_password(self):
        with self.assertRaises(ValidationError):
            login_validate({'phone' : "09929132029"})

    @patch('accounts.validations.validate_user_login.User.objects.normalize_phone_number')
    def test_invalid_phone_format(self, mock_normalize):
        mock_normalize.side_effect = ValueError("Invalid Iranian phone number format")
        with self.assertRaises(ValidationError):
            login_validate({'phone' : "sdfaf", "password" : 'mehrannn'})

    # @patch('accounts.validations.validate_user_login.User.objects.normalize_phone_number')
    # @patch('accounts.validations.validate_user_register.User.objects.filter')
    # def test_user_not_found(self, mock_normalize):
    #     mock_normalize.return_value = '09929132029'
    #     mock_filter.return_value.first.return_value = None
    #     with self.assertRaises(AuthenticationFailed):
    #         login_validate({'phone' : '09929132029', 'password' : 'mehrannn'})
    #
    # @patch('accounts.validations.validate_user_login.objects.normalize_phone_number')
    # @patch('accounts.validations.validate_user_register.User.objects.filter')
    # def test_wrong_password(self, mock_normalize):
    #     mock_normalize.return_value = '09929132029'
    #     mock_user = MagicMock()
    #     mock_user.check_password.return_value = False
    #     mock_filter.return_value.first.return_value = mock_user
    #     with self.assertRaises(AuthenticationFailde):
    #         login_validate({'phone' : '09929132029', 'password' : 'wrongpassword'})

    @patch.object(User.objects, 'normalize_phone_number')
    @patch.object(User.objects, 'filter')
    def test_user_not_found(self, mock_filter, mock_normalize):
        mock_normalize.return_value = '09929132029'
        mock_filter.return_value.first.return_value = None
        with self.assertRaises(AuthenticationFailed):
            login_validate({'phone': '09929132029', 'password': 'mehrannn'})

    @patch.object(User.objects, 'normalize_phone_number')
    @patch.object(User.objects, 'filter')
    def test_wrong_password(self, mock_filter, mock_normalize):
        mock_normalize.return_value = '09929132029'
        mock_user = MagicMock()
        mock_user.check_password.return_value = False
        mock_filter.return_value.first.return_value = mock_user
        with self.assertRaises(AuthenticationFailed):
            login_validate({'phone': '09929132029', 'password': 'wrongpass'})

    @patch.object(User.objects, 'normalize_phone_number')
    @patch.object(User.objects, 'filter')
    def test_valid_login(self, mock_filter, mock_normalize):
        mock_normalize.return_value = '09929132029'
        mock_user = MagicMock()
        mock_user.check_password.return_value = True
        mock_filter.return_value.first.return_value = mock_user
        result = login_validate({'phone': '09929132029', 'password': 'mehrannn'})
        self.assertIn('user', result)
        self.assertIn('phone', result)
        self.assertEqual(result['phone'], '09929132029')










