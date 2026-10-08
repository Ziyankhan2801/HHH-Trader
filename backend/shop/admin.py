from django.contrib import admin

from .models import Product, ProductImage


class ProductImageInline(admin.TabularInline):

    model = ProductImage

    extra = 1

    fields = (
        'image',
        'alt_text',
    )

    readonly_fields = (
        'created_at',
    )


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):

    list_display = (
        'title',
        'price',
        'category',
        'is_active',
        'created_at',
        'updated_at',
    )

    list_filter = (
        'category',
        'is_active',
    )

    search_fields = (
        'title',
        'description',
    )

    list_editable = (
        'price',
        'is_active',
    )

    ordering = (
        '-created_at',
    )

    inlines = (
        ProductImageInline,
    )

    fieldsets = (
        (
            'Basic Info',
            {
                'fields': (
                    'title',
                    'description',
                    'category',
                )
            }
        ),
        (
            'Pricing',
            {
                'fields': (
                    'price',
                )
            }
        ),
        (
            'Media',
            {
                'fields': (
                    'image',
                )
            }
        ),
        (
            'Status',
            {
                'fields': (
                    'is_active',
                )
            }
        ),
    )


@admin.register(ProductImage)
class ProductImageAdmin(admin.ModelAdmin):

    list_display = (
        'product',
        'image',
        'alt_text',
        'created_at',
    )

    list_filter = (
        'created_at',
    )

    search_fields = (
        'product__title',
        'alt_text',
    )

    ordering = (
        '-created_at',
    )