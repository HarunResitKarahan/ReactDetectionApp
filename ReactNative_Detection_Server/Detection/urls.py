from django.urls import path
from . import views

urlpatterns = [
    path('', views.Detection),
    path('deneme', views.deneme),
]