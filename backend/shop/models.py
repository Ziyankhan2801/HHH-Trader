from django.db import models


class Product(models.Model):

    CATEGORY_CHOICES = (
        ('dresses', 'Dresses'),
        ('sarees', 'Sarees'),
        ('mens', 'Mens'),
        ('kids', 'Kids'),
        ('blouse', 'Blouse Pieces'),
    )

    title = models.CharField(
        max_length=200
    )

    description = models.TextField(
        blank=True
    )

    price = models.PositiveIntegerField()

    category = models.CharField(
        max_length=50,
        choices=CATEGORY_CHOICES,
        db_index=True
    )

    image = models.ImageField(
        upload_to='products/'
    )

    is_active = models.BooleanField(
        default=True,
        db_index=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
        db_index=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title