import os
import secrets
from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth import get_user_model

User = get_user_model()

SEEDED_EMAILS = [
    'admin@farmerdirect.com',
    'kraitheara168@gmail.com',
    'sokha.farm@farmerdirect.com',
    'battambang.rice@farmerdirect.com',
    'battambang.valley@farmerdirect.com',
    'kampot.pepper@farmerdirect.com',
    'kandal.greens@farmerdirect.com',
    'kohkong.orchard@farmerdirect.com',
    'pursat.citrus@farmerdirect.com',
    'mondulkiri.coffee@farmerdirect.com',
    'takeo.aquafarm@farmerdirect.com',
    'kampongcham.banana@farmerdirect.com',
    'kratie.pomelo@farmerdirect.com',
    'customer@example.com',
    'chef.chan@haven-restaurant.com',
    'sothea.hotel@angkorpalace.com',
    'bopha.grocery@phnompenh.com',
    'ratha.buyer@gmail.com',
]


class Command(BaseCommand):
    help = (
        'Rotates passwords of all known seed/demo accounts with strong random passwords. '
        'Refuses to run unless ALLOW_SEED_RESET=1 is explicitly set in the environment.'
    )

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='List the accounts that would be reset without changing passwords.',
        )

    def handle(self, *args, **options):
        # Fail closed: Refuse to execute unless ALLOW_SEED_RESET=1
        if os.getenv('ALLOW_SEED_RESET') != '1':
            raise CommandError(
                "Execution refused: 'ALLOW_SEED_RESET=1' is required in the environment to run reset_seed_passwords."
            )

        dry_run = options.get('dry_run', False)
        reset_count = 0

        users = User.objects.filter(email__in=SEEDED_EMAILS)
        if not users.exists():
            self.stdout.write(self.style.WARNING("No matching seeded accounts found in database."))
            return

        for user in users:
            if dry_run:
                self.stdout.write(f"[DRY RUN] Would rotate password for: {user.email}")
            else:
                new_password = secrets.token_urlsafe(24)
                user.set_password(new_password)
                user.save(update_fields=['password'])
                self.stdout.write(self.style.SUCCESS(f"Rotated password for: {user.email}"))
                reset_count += 1

        if not dry_run:
            self.stdout.write(
                self.style.SUCCESS(
                    f"\n[OK] Successfully randomized passwords for {reset_count} seeded account(s). "
                    "Public demo credentials are now invalid."
                )
            )
