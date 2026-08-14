"""
Custom JWT Authentication Middleware for Django Channels WebSocket.

This middleware allows WebSocket connections to authenticate using JWT tokens
passed as a URL query parameter (?token=xxx) or via subprotocol header.

Security Features:
- Token is required for WebSocket connections (no anonymous access)
- Failed authentication attempts are logged
- Proper error responses help client distinguish auth failures
"""

import jwt
import logging
from urllib.parse import parse_qs
from django.conf import settings
from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer

logger = logging.getLogger('auto_market.auth')


@database_sync_to_async
def get_user_from_jwt(token: str):
    """
    Decode JWT token and return the corresponding user.

    Returns:
        User instance if token is valid
        None if token is invalid, expired, or user not found
    """
    from django.contrib.auth import get_user_model
    User = get_user_model()

    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=["HS256"],
            options={
                "verify_exp": True,
                "require": ["exp", "user_id"],
            }
        )
        user_id = payload.get('user_id')
        if not user_id:
            return None, "invalid_token"

        user = User.objects.get(id=user_id)
        if not user.is_active:
            return None, "user_inactive"

        return user, None
    except jwt.ExpiredSignatureError:
        return None, "token_expired"
    except jwt.InvalidTokenError as e:
        return None, f"invalid_token"
    except User.DoesNotExist:
        return None, "user_not_found"


class JWTAuthMiddlewareInstance:
    """
    JWT Authentication Middleware for Django Channels 4.x.

    Extracts JWT token from:
    1. WebSocket subprotocol header (recommended - more secure)
    2. URL query parameter (?token=xxx) - fallback for backwards compatibility

    WebSocket connections without a valid token will be rejected.
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

            if not token:
                await self._send_auth_error(send, "Authentication required. Provide JWT token via ?token=query_param or subprotocol header.")
                logger.warning(f"WebSocket auth rejected: No token provided from {scope.get('client')}")
                return

            user, error = await get_user_from_jwt(token)

            if user:
                scope['user'] = user
                scope['auth'] = token
                logger.debug(f"WebSocket auth success for user {user.id}")
            else:
                await self._send_auth_error(send, f"Authentication failed: {error}")
                logger.warning(f"WebSocket auth rejected: {error} from {scope.get('client')}")
                return

        return await self.app(scope, receive, send)

    async def _send_auth_error(self, send, message):
        await send({
            'type': 'websocket.accept',
        })
        await send({
            'type': 'websocket.send',
            'text': f'{{"type": "error", "code": "authentication_failed", "message": "{message}"}}',
        })
        await send({
            'type': 'websocket.close',
            'code': 4001,
        })
