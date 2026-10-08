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
            'image',
        ]

    def get_image(self, obj):
        """
        Return a complete image URL when possible.
        Return None when the product has no image.
        """

        if not obj.image:
            return None

        try:
            image_url = obj.image.url
        except (ValueError, AttributeError):
            return None

        request = self.context.get('request')

        if request:
            return request.build_absolute_uri(image_url)

        return image_url