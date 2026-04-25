from django.db import models

# Create your models here.

class Character(models.Model):
    name = models.CharField(max_length=50)
    outfit = models.CharField(max_length=50, default="casual")

    def __str__(self):
        return self.name