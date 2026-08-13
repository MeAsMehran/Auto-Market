import redis
import json
import logging
from django.conf import settings
from typing import Optional, Set

logger = logging.getLogger(__name__)

REDIS_PRESENCE_KEY = "presence:user:{user_id}"
REDIS_USER_PRESENCE_SET = "presence:online_users"
REDIS_CONNECTION_COUNT_KEY = "presence:connections:{user_id}"
PRESENCE_TTL = 300


class PresenceService:
    _instance = None
    _redis = None
    _redis_available = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._init_redis()
        return cls._instance

    def _init_redis(self):
        if self._redis_available is False:
            return

        redis_url = getattr(settings, 'REDIS_URL', 'redis://localhost:6379/1')
        try:
            self._redis = redis.from_url(redis_url, decode_responses=True)
            self._redis.ping()
            self._redis_available = True
            logger.info("Redis connection established for presence service")
        except Exception as e:
            logger.warning(f"Redis unavailable for presence service: {e}")
            self._redis = None
            self._redis_available = False

    @property
    def redis(self):
        if self._redis is None and self._redis_available is not False:
            self._init_redis()
        return self._redis

    def _get_user_key(self, user_id: int) -> str:
        return REDIS_PRESENCE_KEY.format(user_id=user_id)

    def _get_connection_count_key(self, user_id: int) -> str:
        return REDIS_CONNECTION_COUNT_KEY.format(user_id=user_id)

    def set_user_online(self, user_id: int) -> bool:
        if not self.redis:
            return False
        try:
            count_key = self._get_connection_count_key(user_id)
            new_count = self.redis.incr(count_key)

            if new_count == 1:
                key = self._get_user_key(user_id)
                self.redis.setex(key, PRESENCE_TTL, json.dumps({'status': 'online'}))
                self.redis.sadd(REDIS_USER_PRESENCE_SET, user_id)

            return True
        except Exception:
            return False

    def set_user_offline(self, user_id: int) -> bool:
        if not self.redis:
            return False
        try:
            count_key = self._get_connection_count_key(user_id)
            current_count = self.redis.get(count_key)
            current_count = int(current_count) if current_count else 0

            if current_count <= 1:
                self.redis.delete(count_key)
                key = self._get_user_key(user_id)
                self.redis.delete(key)
                self.redis.srem(REDIS_USER_PRESENCE_SET, user_id)
            else:
                self.redis.decr(count_key)

            return True
        except Exception:
            return False

    def refresh_user_presence(self, user_id: int) -> bool:
        if not self.redis:
            return False
        try:
            count_key = self._get_connection_count_key(user_id)
            current_count = self.redis.get(count_key)
            current_count = int(current_count) if current_count else 0

            if current_count > 0:
                key = self._get_user_key(user_id)
                self.redis.setex(key, PRESENCE_TTL, json.dumps({'status': 'online'}))
                return True
            else:
                count = self.redis.incr(count_key)
                if count == 1:
                    key = self._get_user_key(user_id)
                    self.redis.setex(key, PRESENCE_TTL, json.dumps({'status': 'online'}))
                    self.redis.sadd(REDIS_USER_PRESENCE_SET, user_id)
                return True
        except Exception:
            return False

    def is_user_online(self, user_id: int) -> bool:
        if not self.redis:
            return False
        try:
            key = self._get_user_key(user_id)
            return bool(self.redis.exists(key))
        except Exception:
            return False

    def get_online_users(self) -> Set[int]:
        if not self.redis:
            return set()
        try:
            user_ids = self.redis.smembers(REDIS_USER_PRESENCE_SET)
            online = set()
            for uid in user_ids:
                user_id = int(uid)
                if self.is_user_online(user_id):
                    online.add(user_id)
                else:
                    try:
                        self.redis.srem(REDIS_USER_PRESENCE_SET, uid)
                    except Exception:
                        pass
            return online
        except Exception:
            return set()

    def get_users_presence(self, user_ids: list[int]) -> dict[int, bool]:
        if not self.redis:
            return {uid: False for uid in user_ids}

        result = {uid: False for uid in user_ids}

        try:
            pipe = self.redis.pipeline()
            for uid in user_ids:
                pipe.exists(self._get_user_key(uid))
            exists_results = pipe.execute()

            for uid, exists in zip(user_ids, exists_results):
                result[uid] = bool(exists)
        except Exception:
            return {uid: False for uid in user_ids}

        return result


presence_service = PresenceService()
