from django.urls import path
from .views import (
    health,
    RegisterView,
    LoginView,
    RefreshView,
    VerifyView,
    MeView,
    UserDetailView,
    UserListView,
)

urlpatterns = [
    path("health/", health, name="health"),
    path("api/auth/register/", RegisterView.as_view(), name="register"),
    path("api/auth/login/", LoginView.as_view(), name="login"),
    path("api/auth/refresh/", RefreshView.as_view(), name="refresh"),
    path("api/auth/verify/", VerifyView.as_view(), name="verify"),
    path("api/auth/me/", MeView.as_view(), name="me"),
    path("api/auth/users/", UserListView.as_view(), name="user-list"),
    path("api/auth/users/<int:pk>/", UserDetailView.as_view(), name="user-detail"),
]
