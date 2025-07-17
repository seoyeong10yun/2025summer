import logging
from app.core.config import settings

logger = logging.getLogger("app_logger")
logger.setLevel(getattr(logging, settings.LOG_LEVEL))

formatter = logging.Formatter(settings.LOG_FORMAT)
handler = logging.StreamHandler()
handler.setFormatter(formatter)

logger.addHandler(handler)
