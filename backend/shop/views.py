from rest_framework import serializers
from .models import Product


class ProductSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id',
            'title',
            'description',
            'price',
            'category',
            'image'
        ]

    def get_image(self, obj):
        if not obj.image:
            return None

        request = self.context.get('request')

        if request:
            return request.build_absolute_uri(obj.image.url)

        return obj.image.url