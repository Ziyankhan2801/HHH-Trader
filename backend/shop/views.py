from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Product
from .serializers import ProductSerializer   # 👈 ADD THIS

@api_view(['GET'])
def product_list(request):
    products = Product.objects.all().order_by('-id')

    serializer = ProductSerializer(
        products,
        many=True,
        context={"request": request}
    )

    return Response(serializer.data)
