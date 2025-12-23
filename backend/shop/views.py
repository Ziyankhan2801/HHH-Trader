from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Product

@api_view(['GET'])
def product_list(request):
    products = Product.objects.all().order_by('-id')

    data = []
    for p in products:
        data.append({
            "id": p.id,
            "title": p.title,
            "price": p.price,
            "category": p.category,
            "image": request.build_absolute_uri(p.image.url)
        })

    return Response(data)
