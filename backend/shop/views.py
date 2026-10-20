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


@api_view(['POST'])
def validate_cart(request):
    """
    Validate cart product IDs and quantities against current database prices.
    Does not create an order or reserve stock.
    """
    items = request.data.get('items')

    if not isinstance(items, list) or not items:
        return Response(
            {
                "valid": False,
                "error": "Cart must contain at least one item."
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    requested_quantities = {}

    for item in items:
        if not isinstance(item, dict):
            return Response(
                {"valid": False, "error": "Invalid cart item format."},
                status=status.HTTP_400_BAD_REQUEST
            )

        product_id = item.get('product_id')
        quantity = item.get('quantity')

        # Reject booleans, strings, floats and invalid IDs/quantities.
        if (
            isinstance(product_id, bool)
            or not isinstance(product_id, int)
            or product_id <= 0
        ):
            return Response(
                {"valid": False, "error": "Invalid product ID."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if (
            isinstance(quantity, bool)
            or not isinstance(quantity, int)
            or quantity <= 0
        ):
            return Response(
                {
                    "valid": False,
                    "error": "Quantity must be a positive whole number."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if product_id in requested_quantities:
            return Response(
                {
                    "valid": False,
                    "error": "Duplicate products are not allowed in the cart."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        requested_quantities[product_id] = quantity

    products = Product.objects.filter(
        id__in=requested_quantities.keys(),
        is_active=True
    )

    products_by_id = {product.id: product for product in products}

    unavailable_ids = [
        product_id
        for product_id in requested_quantities
        if product_id not in products_by_id
    ]

    if unavailable_ids:
        return Response(
            {
                "valid": False,
                "error": "Some products are unavailable or no longer exist.",
                "unavailable_product_ids": unavailable_ids
            },
            status=status.HTTP_409_CONFLICT
        )

    verified_items = []
    total = 0

    for product_id, quantity in requested_quantities.items():
        product = products_by_id[product_id]
        subtotal = product.price * quantity
        total += subtotal

        verified_items.append({
            "product_id": product.id,
            "title": product.title,
            "price": product.price,
            "quantity": quantity,
            "subtotal": subtotal
        })

    return Response(
        {
            "valid": True,
            "items": verified_items,
            "total": total
        },
        status=status.HTTP_200_OK
    )
