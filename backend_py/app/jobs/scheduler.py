"""APScheduler bridge for FastAPI lifespan."""

from __future__ import annotations

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

from app.config import settings
from app.jobs.auto_sync import auto_sync_job
from app.jobs.backup import backup_job
from app.jobs.metrics_snapshot import metrics_snapshot_job
from app.utils.logger import get_logger

logger = get_logger(__name__)
_scheduler: AsyncIOScheduler | None = None


def start_scheduler() -> None:
    global _scheduler
    _scheduler = AsyncIOScheduler(timezone=settings.sync_timezone)

    # Auto sync : Mon-Fri 8h-17h every 5 min
    _scheduler.add_job(
        auto_sync_job,
        CronTrigger(day_of_week="mon-fri", hour="8-17", minute="*/5"),
        id="auto_sync",
        replace_existing=True,
    )

    # Metrics snapshot : daily 02:00
    _scheduler.add_job(
        metrics_snapshot_job,
        CronTrigger(hour=2, minute=0),
        id="metrics_snapshot",
        replace_existing=True,
    )

    # Backup : daily 03:00
    _scheduler.add_job(
        backup_job,
        CronTrigger(hour=3, minute=0),
        id="backup",
        replace_existing=True,
    )

    # TODO: add audit_prune, analytics, retention

    _scheduler.start()
    logger.info("Scheduler started")


def stop_scheduler() -> None:
    global _scheduler
    if _scheduler:
        _scheduler.shutdown(wait=False)
        logger.info("Scheduler stopped")
