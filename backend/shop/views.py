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
    Compare cart prices saved by the frontend with current database prices.
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

    requested_items = {}

    for item in items:
        if not isinstance(item, dict):
            return Response(
                {"valid": False, "error": "Invalid cart item format."},
                status=status.HTTP_400_BAD_REQUEST
            )

        product_id = item.get('product_id')
        quantity = item.get('quantity')
        old_price = item.get('price')

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

        if (
            isinstance(old_price, bool)
            or not isinstance(old_price, (int, float))
            or old_price < 0
            or old_price != int(old_price)
        ):
            return Response(
                {
                    "valid": False,
                    "error": "A valid saved price is required."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if product_id in requested_items:
            return Response(
                {
                    "valid": False,
                    "error": "Duplicate products are not allowed in the cart."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        requested_items[product_id] = {
            "quantity": quantity,
            "old_price": int(old_price)
        }

    products = Product.objects.filter(
        id__in=requested_items.keys(),
        is_active=True
    )

    products_by_id = {product.id: product for product in products}

    unavailable_ids = [
        product_id
        for product_id in requested_items
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
    price_changed = False

    for product_id, cart_item in requested_items.items():
        product = products_by_id[product_id]
        quantity = cart_item["quantity"]
        old_price = cart_item["old_price"]
        current_price = product.price
        subtotal = current_price * quantity

        item_price_changed = old_price != current_price

        if item_price_changed:
            price_changed = True

        verified_items.append({
            "product_id": product.id,
            "title": product.title,
            "old_price": old_price,
            "price": current_price,
            "price_changed": item_price_changed,
            "quantity": quantity,
            "subtotal": subtotal
        })

        total += subtotal

    return Response(
        {
            "valid": True,
            "price_changed": price_changed,
            "items": verified_items,
            "total": total,
            "confirmation_required": price_changed
        },
        status=status.HTTP_200_OK
    )
