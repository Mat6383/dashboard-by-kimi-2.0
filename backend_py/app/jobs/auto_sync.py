"""Auto sync job : Testmo → GitLab status sync."""

from __future__ import annotations

from app.config import settings
from app.utils.logger import get_logger

logger = get_logger(__name__)


async def auto_sync_job() -> None:
    if not settings.sync_auto_enabled:
        return
    logger.info("Running auto sync job")
    # TODO: wire with status_sync service
