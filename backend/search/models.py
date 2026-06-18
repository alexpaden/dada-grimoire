from django.db import models


class KV(models.Model):
    label = models.CharField(max_length=128)
    value = models.TextField()

    class Meta:
        db_table = 'kv'

    def __str__(self):
        return self.label
