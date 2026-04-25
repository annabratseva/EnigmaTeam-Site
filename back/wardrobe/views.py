from django.shortcuts import render, redirect
from .models import Character

# Create your views here.

def home(request):
    character = Character.objects.first()

    if request.method == "POST":
        new_outfit = request.POST.get("outfit")
        character.outfit = new_outfit
        character.save()
        return redirect("home")

    return render(request, "wardrobe/home.html", {"character": character})