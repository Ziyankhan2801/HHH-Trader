import os

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model


class Command(BaseCommand):
    help = "Create or update the Django admin superuser from environment variables."

    def handle(self, *args, **options):
        User = get_user_model()

        username = os.getenv("DJANGO_ADMIN_USERNAME")
        email = os.getenv("DJANGO_ADMIN_EMAIL", "")
        password = os.getenv("DJANGO_ADMIN_PASSWORD")

        if not username or not password:
            self.stdout.write(
                self.style.WARNING(
                    "Admin environment variables are not configured. Skipping admin setup."
                )
            )
            return

        user, created = User.objects.get_or_create(
            username=username,
            defaults={
                "email": email,
                "is_staff": True,
                "is_superuser": True,
                "is_active": True,
            },
        )

        if created:
            user.set_password(password)
            user.save()

            self.stdout.write(
                self.style.SUCCESS(
                    f"Superuser '{username}' created successfully."
                )
            )
        else:
            changed = False

            if email and user.email != email:
                user.email = email
                changed = True

            if not user.is_staff:
                user.is_staff = True
                changed = True

            if not user.is_superuser:
                user.is_superuser = True
                changed = True

            if not user.is_active:
                user.is_active = True
                changed = True

            # Keep the password synchronized with the Render environment.
            user.set_password(password)
            changed = True

            if changed:
                user.save()

            self.stdout.write(
                self.style.SUCCESS(
                    f"Superuser '{username}' is ready."
                )
            )