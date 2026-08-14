"""
Custom JWT Authentication Middleware for Django Channels WebSocket.

This middleware allows WebSocket connections to authenticate using JWT tokens
passed as a URL query parameter (?token=xxx).

Usage:
    ws://localhost:8000/ws/chat/13/?token=YOUR_JWT_ACCESS_TOKEN
"""

import jwt
from urllib.parse import parse_qs
from django.conf import settings
from channels.db import database_sync_to_async


@database_sync_to_async
def get_user_from_jwt(token: str):
    """
    Decode JWT token and return the corresponding user.

    Returns:
        User instance if token is valid
        None if token is invalid or user not found
    """
    from django.contrib.auth import get_user_model
    User = get_user_model()

    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=["HS256"]
        )
        user_id = payload.get('user_id')
        if not user_id:
            return None

        user = User.objects.get(id=user_id)
        if not user.is_active:
            return None
        return user
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None
    except User.DoesNotExist:
        return None


class JWTAuthMiddlewareInstance:
    """
    JWT Authentication Middleware for Django Channels 4.x.

    Extracts JWT token from:
    1. WebSocket subprotocol header (recommended - more secure)
    2. URL query parameter (?token=xxx) - fallback for backwards compatibility
    """

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope['type'] == 'websocket':
            token = None
            subprotocols = scope.get('subprotocols', [])

            if 'jwt' in subprotocols:
                idx = subprotocols.index('jwt')
                if idx + 1 < len(subprotocols):
                    token = subprotocols[idx + 1]
            else:
                query_string = scope.get('query_string', b'').decode()
                query_params = parse_qs(query_string)
                token = query_params.get('token', [None])[0]

            if token:
                user = await get_user_from_jwt(token)
                if user:
                    scope['user'] = user
                    scope['auth'] = token
                else:
                    scope['user'] = None
                    scope['auth'] = None
            else:
                scope['user'] = None
                scope['auth'] = None

        return await self.app(scope, receive, send)
