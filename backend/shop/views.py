from django.db.models import Q

from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from .models import Product
from .serializers import ProductSerializer


@api_view(['GET'])
def product_list(request):
    try:
        # ==========================================
        # BASE QUERY
        # Only active products are publicly visible
        # ==========================================
        products = Product.objects.filter(
            is_active=True
        )


        # ==========================================
        # SEARCH
        # ?search=shirt
        # ==========================================
        search = request.GET.get('search', '').strip()

        if search:
            products = products.filter(
                Q(title__icontains=search) |
                Q(description__icontains=search) |
                Q(category__icontains=search)
            )


        # ==========================================
        # CATEGORY
        # ?category=dresses
        # ==========================================
        category = request.GET.get('category', '').strip()

        if category:
            products = products.filter(
                category__iexact=category
            )


        # ==========================================
        # SORT
        # ==========================================
        sort = request.GET.get('sort', 'latest')

        if sort == 'price-low':
            products = products.order_by('price')

        elif sort == 'price-high':
            products = products.order_by('-price')

        elif sort == 'name-az':
            products = products.order_by('title')

        elif sort == 'name-za':
            products = products.order_by('-title')

        else:
            # latest
            products = products.order_by('-id')


        # ==========================================
        # SERIALIZE
        # ==========================================
        serializer = ProductSerializer(
            products,
            many=True,
            context={'request': request}
        )


        return Response(
            serializer.data,
            status=status.HTTP_200_OK
        )


    except Exception as e:

        print("Product API Error:", str(e))

        return Response(
            {
                "error": "Unable to load products.",
                "detail": "Something went wrong while fetching products."
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )