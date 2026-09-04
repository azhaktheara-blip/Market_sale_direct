from django.db import migrations
from django.contrib.auth.hashers import make_password


def create_superadmin(apps, schema_editor):
    User = apps.get_model('accounts', 'User')
    email = 'kraitheara168@gmail.com'
    hashed_pwd = make_password('Theara@@@96')
    user = User.objects.filter(email=email).first()
    if user:
        user.password = hashed_pwd
        user.is_staff = True
        user.is_superuser = True
        user.role = 'ADMIN'
        user.email_verified = True
        user.save()
    else:
        User.objects.create(
            email=email,
            username='kraitheara168',
            password=hashed_pwd,
            is_staff=True,
            is_superuser=True,
            role='ADMIN',
            email_verified=True,
        )


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):
    dependencies = [
        ('accounts', '0004_customerprofile_profile_image'),
    ]

    operations = [
        migrations.RunPython(create_superadmin, reverse_code=noop),
    ]
