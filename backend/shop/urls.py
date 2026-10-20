
from django.urls import path
from .views import product_list, validate_cart

urlpatterns = [
    path('products/', product_list, name='product-list'),
    path('cart/validate/', validate_cart, name='validate-cart'),
]
