from django.urls import path
from .views import (
    health,
    RegisterView,
    LoginView,
    RefreshView,
    VerifyView,
    MeView,
    ProfilePhotoView,
    NotifPrefsView,
    UserDetailView,
    UserListView,
    UserToggleActiveView,
    AdminCreateUserView,
)

urlpatterns = [
    path("health/", health, name="health"),
    path("api/auth/register/", RegisterView.as_view(), name="register"),
    path("api/auth/login/", LoginView.as_view(), name="login"),
    path("api/auth/refresh/", RefreshView.as_view(), name="refresh"),
    path("api/auth/verify/", VerifyView.as_view(), name="verify"),
    path("api/auth/me/", MeView.as_view(), name="me"),
    path("api/auth/me/photo/", ProfilePhotoView.as_view(), name="me-photo"),
    path("api/auth/me/notificaciones/", NotifPrefsView.as_view(), name="me-notifs"),
    path("api/auth/users/", UserListView.as_view(), name="user-list"),
    path("api/auth/users/create/", AdminCreateUserView.as_view(), name="user-create-admin"),
    path("api/auth/users/<int:pk>/", UserDetailView.as_view(), name="user-detail"),
    path("api/auth/users/<int:pk>/toggle-active/", UserToggleActiveView.as_view(), name="user-toggle-active"),
]
