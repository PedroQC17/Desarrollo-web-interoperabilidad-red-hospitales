import traceback
from django.http import JsonResponse
from rest_framework.views import exception_handler as drf_exception_handler


def custom_exception_handler(exc, context):
    response = drf_exception_handler(exc, context)
    if response is not None:
        return response
    traceback.print_exc()
    return JsonResponse(
        {"error": "Error interno del servidor", "detail": str(exc)},
        status=500,
    )
