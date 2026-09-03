from django.db import migrations


def verify_all_existing_users(apps, schema_editor):
    User = apps.get_model('accounts', 'User')
    User.objects.filter(email_verified=False).update(email_verified=True)


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0002_user_auth_provider_user_email_verified_and_more'),
    ]

    operations = [
        migrations.RunPython(verify_all_existing_users, reverse_code=noop),
    ]

