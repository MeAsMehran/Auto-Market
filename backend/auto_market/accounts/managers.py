
from django.contrib.auth.base_user import BaseUserManager
from django.utils.translation import gettext_lazy as _


class CustomUserManager(BaseUserManager):
    """
    Custom user model manager where email is the unique identifiers
    for authentication instead of usernames.
    """
    
    def create_user(self, phone, password, email=None, **extra_fields):
        """
        Create and save a user with the given email and password.
        """
        
        if not phone:
            raise ValueError(_("Enter a valid phone number"))
        phone = self.normalize_phone_number(phone)
        if email:
            email = self.normalize_email(email)
        user = self.model(phone=phone, email=email, **extra_fields)
        user.set_password(password)
        user.save()
        return user

    def create_superuser(self, phone, password, email=None, **extra_fields):
        """
        Create and save a SuperUser with the given email and password.
        """
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)

        if extra_fields.get("is_staff") is not True:
            raise ValueError(_("Superuser must have is_staff=True."))
        if extra_fields.get("is_superuser") is not True:
            raise ValueError(_("Superuser must have is_superuser=True."))
        phone = self.normalize_phone_number(phone)
        return self.create_user(phone=phone, email=email, password=password, **extra_fields)
    
    def normalize_phone_number(self, phone):
        """
            Normalize Iranian phone numbers to local 0XXXXXXXXX format.
            Accepts:
            - +989XXXXXXXXX
            - 091XXXXXXXX
            - 9XXXXXXXXX
            Returns: 0XXXXXXXXX
        """
        # Remove all non-digit characters
        digits = ''.join(filter(str.isdigit, str(phone)))
        
        # Add leading 0 if missing
        if digits.startswith("98"):       # +98XXXXXXXXX
            digits = "0" + digits[2:]
        elif digits.startswith("9") and len(digits) == 10:  # 9XXXXXXXXX
            digits = "0" + digits
        elif digits.startswith("0") and len(digits) == 11:  # 091XXXXXXXX
            pass
        else:
            raise ValueError(_("Invalid Iranian phone number format"))

        return digits
