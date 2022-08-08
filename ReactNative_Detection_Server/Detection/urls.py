from django.urls import path
from . import views

urlpatterns = [
    path('', views.Detection),
    path('mesh', views.mesh),
    path('waitingmeshs', views.WaitingMeshs)
]