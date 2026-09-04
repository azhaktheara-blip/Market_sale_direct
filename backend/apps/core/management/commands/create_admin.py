from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()


class Command(BaseCommand):
    help = 'Creates or updates a platform superuser with admin privileges.'

    def add_arguments(self, parser):
        parser.add_argument('--email', type=str, default='kraitheara168@gmail.com', help='Admin email address')
        parser.add_argument('--password', type=str, default='Theara@@@96', help='Admin password')
        parser.add_argument('--username', type=str, default='kraitheara168', help='Admin username')

    def handle(self, *args, **options):
        email = options['email']
        password = options['password']
        username = options['username']

        user = User.objects.filter(email=email).first()
        if user:
            user.set_password(password)
            user.is_staff = True
            user.is_superuser = True
            user.role = User.Role.ADMIN
            user.email_verified = True
            user.save()
            self.stdout.write(self.style.SUCCESS(f"Successfully updated user {email} to SUPERUSER. (Account ID: {user.account_id})"))
        else:
            user = User.objects.create_superuser(
                email=email,
                password=password,
                username=username,
                email_verified=True,
            )
            self.stdout.write(self.style.SUCCESS(f"Successfully created SUPERUSER {email}. (Account ID: {user.account_id})"))

