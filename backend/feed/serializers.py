from rest_framework import serializers

from .models import Post, Comment


class CommentSerializer(serializers.ModelSerializer):
    author = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = ['id', 'author', 'body', 'created_at']

    def get_author(self, obj):
        return {'id': obj.author_id, 'handle': obj.author.handle}


class PostSerializer(serializers.ModelSerializer):
    author = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = ['id', 'author', 'body_html', 'created_at', 'report_count']

    def get_author(self, obj):
        return {
            'id': obj.author_id,
            'handle': obj.author.handle,
        }
