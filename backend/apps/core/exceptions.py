import logging
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import IntegrityError

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    """
    Custom exception handler that ensures all error responses have a uniform JSON shape:
    {
        "status": "error",
        "message": "Human readable summary",
        "errors": { ... field specific details ... }
    }
    """
    # Call REST framework's default exception handler first to get standard response
    response = exception_handler(exc, context)

    if response is not None:
        custom_data = {
            "status": "error",
            "message": "An error occurred while processing your request.",
            "errors": {}
        }

        if isinstance(response.data, dict):
            if "code" in response.data:
                custom_data["code"] = str(response.data["code"])
            if "email" in response.data:
                custom_data["email"] = str(response.data["email"])
            if "detail" in response.data:
                custom_data["message"] = str(response.data["detail"])
            else:
                custom_data["errors"] = response.data
                custom_data["message"] = "Validation error."
        elif isinstance(response.data, list):
            custom_data["errors"] = {"non_field_errors": response.data}
            custom_data["message"] = "Validation error."
        else:
            custom_data["message"] = str(response.data)

        response.data = custom_data
        return response

    # Handle unhandled Django errors safely without leaking internal database tracebacks
    if isinstance(exc, DjangoValidationError):
        logger.warning(f"Django ValidationError: {exc}")
        return Response({
            "status": "error",
            "message": "Validation failed.",
            "errors": exc.message_dict if hasattr(exc, 'message_dict') else {'detail': exc.messages}
        }, status=status.HTTP_400_BAD_REQUEST)

    if isinstance(exc, IntegrityError):
        logger.error(f"Database IntegrityError: {exc}", exc_info=True)
        return Response({
            "status": "error",
            "message": "A database constraint was violated. Please check your data.",
            "errors": {"detail": "Resource conflict or duplicate entry."}
        }, status=status.HTTP_409_CONFLICT)

    logger.error(f"Unhandled Exception: {exc}", exc_info=True)
    return Response({
        "status": "error",
        "message": "An unexpected server error occurred. Please try again later.",
        "errors": {}
    }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

