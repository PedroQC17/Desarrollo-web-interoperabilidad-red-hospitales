from rest_framework.authentication import BaseAuthentication


class GatewayUser:
    is_authenticated = True
    is_anonymous = False

    def __init__(self, user_id, email, tipo_usuario):
        self.id = user_id
        self.pk = user_id
        self.email = email
        self.tipo_usuario = tipo_usuario


class GatewayUserAuth(BaseAuthentication):
    def authenticate(self, request):
        raw_id = request.META.get("HTTP_X_USER_ID")
        if not raw_id:
            return None
        return (GatewayUser(
            user_id=int(raw_id),
            email=request.META.get("HTTP_X_USER_EMAIL", ""),
            tipo_usuario=request.META.get("HTTP_X_USER_TIPO", ""),
        ), None)
