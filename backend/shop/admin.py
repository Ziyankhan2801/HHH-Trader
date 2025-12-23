from django.contrib import admin
from .models import Product

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = (
        'title',
        'price',
        'category',
        'is_active',
        'created_at'
    )

    list_filter = ('category', 'is_active')
    search_fields = ('title',)
    list_editable = ('price', 'is_active')
    ordering = ('-created_at',)

    fieldsets = (
        ('Basic Info', {
            'fields': ('title', 'description', 'category')
        }),
        ('Pricing', {
            'fields': ('price',)
        }),
        ('Media', {
            'fields': ('image',)
        }),
        ('Status', {
            'fields': ('is_active',)
        }),
    )


from django.contrib import admin
from .models import Product
