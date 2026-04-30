"""GitLab ↔ Testmo sync orchestration."""

from __future__ import annotations

import asyncio
from collections.abc import AsyncGenerator
from datetime import datetime, timezone
from typing import Any

from app.config import settings
from app.models.sync_history import SyncRun
from app.services.gitlab import gitlab_service
from app.services.testmo import testmo_service
from app.utils.logger import get_logger

logger = get_logger(__name__)


class SyncService:
    async def list_sync_projects(self) -> list[dict[str, Any]]:
        """Return configured sync projects (GitLab)."""
        projects = []
        if settings.gitlab_project_id:
            try:
                proj = await gitlab_service.get_project(settings.gitlab_project_id)
                projects.append({
                    "id": proj.get("id"),
                    "name": proj.get("name"),
                    "path_with_namespace": proj.get("path_with_namespace"),
                })
            except Exception as exc:
                logger.warning("Failed to fetch sync project", extra={"error": str(exc)})
        return projects

    async def list_iterations(self, project_id: str | int, search: str | None = None) -> list[dict[str, Any]]:
        iterations = await gitlab_service.get_project_iterations(project_id, search)
        return [
            {
                "id": it.get("id"),
                "title": it.get("title"),
                "start_date": it.get("start_date"),
                "due_date": it.get("due_date"),
                "state": it.get("state"),
            }
            for it in iterations
        ]

    async def preview_sync(
        self,
        project_id: str | int,
        iteration_name: str,
        run_id: int | None = None,
        version: str | None = None,
    ) -> dict[str, Any]:
        """Dry-run sync: show what would be updated."""
        iteration = await gitlab_service.find_iteration(project_id, iteration_name)
        if not iteration:
            return {"error": f"Iteration '{iteration_name}' not found"}

        issues = await gitlab_service.get_issues_by_label_and_iteration(
            project_id, "QA", iteration["id"]
        )

        run_results: list[dict[str, Any]] = []
        if run_id:
            run_results = await testmo_service.get_run_results(run_id)

        mapped = []
        for issue in issues:
            mapped.append({
                "issue_iid": issue.get("iid"),
                "title": issue.get("title"),
                "state": issue.get("state"),
                "action": "would_update_label",
                "matched_tests": len(run_results),
            })

        return {
            "iteration": iteration.get("title"),
            "issues_found": len(issues),
            "run_results_found": len(run_results),
            "mapped": mapped,
            "version": version,
        }

    async def execute_sync(
        self,
        project_id: str | int,
        iteration_name: str,
        run_id: int | None = None,
        version: str | None = None,
        dry_run: bool = False,
    ) -> AsyncGenerator[dict[str, Any], None]:
        """Execute sync and yield log events for SSE."""
        yield {"level": "info", "message": f"Starting sync for iteration '{iteration_name}'"}
        await asyncio.sleep(0.2)

        iteration = await gitlab_service.find_iteration(project_id, iteration_name)
        if not iteration:
            yield {"level": "error", "message": f"Iteration '{iteration_name}' not found"}
            return

        yield {"level": "info", "message": f"Found iteration: {iteration['title']}"}

        issues = await gitlab_service.get_issues_by_label_and_iteration(
            project_id, "QA", iteration["id"]
        )
        yield {"level": "info", "message": f"Found {len(issues)} issues with label QA"}

        run_results: list[dict[str, Any]] = []
        if run_id:
            run_results = await testmo_service.get_run_results(run_id)
            yield {"level": "info", "message": f"Fetched {len(run_results)} run results from Testmo"}

        created = updated = skipped = enriched = errors = 0

        for issue in issues:
            iid = issue.get("iid")
            title = issue.get("title", "")
            try:
                if not dry_run:
                    # Simple heuristic: update label based on issue state
                    if issue.get("state") == "opened":
                        await gitlab_service.update_issue_label(
                            project_id, iid, add_labels=["Sync-Updated"], remove_labels=[]
                        )
                        updated += 1
                    else:
                        skipped += 1
                else:
                    skipped += 1
                yield {"level": "debug", "message": f"Processed issue #{iid}: {title[:50]}"}
            except Exception as exc:
                errors += 1
                yield {"level": "error", "message": f"Failed issue #{iid}: {exc}"}
            await asyncio.sleep(0.05)

        total = len(issues)
        yield {"level": "info", "message": "Sync complete"}
        yield {
            "level": "summary",
            "created": created,
            "updated": updated,
            "skipped": skipped,
            "enriched": enriched,
            "errors": errors,
            "total_issues": total,
        }

    async def sync_status_to_gitlab(
        self,
        project_id: str | int,
        iteration_name: str,
        run_id: int | None = None,
    ) -> AsyncGenerator[dict[str, Any], None]:
        """Sync Testmo run status back to GitLab issues."""
        yield {"level": "info", "message": f"Starting status sync for iteration '{iteration_name}'"}
        await asyncio.sleep(0.2)

        iteration = await gitlab_service.find_iteration(project_id, iteration_name)
        if not iteration:
            yield {"level": "error", "message": f"Iteration '{iteration_name}' not found"}
            return

        issues = await gitlab_service.get_issues_by_label_and_iteration(
            project_id, "QA", iteration["id"]
        )
        yield {"level": "info", "message": f"Found {len(issues)} issues"}

        if run_id:
            run = await testmo_service.get_run_details(run_id)
            run_name = run.get("name", "Unknown")
            for issue in issues:
                iid = issue.get("iid")
                try:
                    body = f"Testmo run **{run_name}** status updated."
                    await gitlab_service.add_issue_comment(project_id, iid, body)
                    yield {"level": "debug", "message": f"Updated issue #{iid}"}
                except Exception as exc:
                    yield {"level": "error", "message": f"Failed issue #{iid}: {exc}"}
                await asyncio.sleep(0.05)

        yield {"level": "info", "message": "Status sync complete"}
        yield {"level": "summary", "updated": len(issues)}

    async def get_history(self, db_session: Any) -> list[dict[str, Any]]:
        from sqlalchemy import select
        result = await db_session.execute(select(SyncRun).order_by(SyncRun.executed_at.desc()).limit(50))
        rows = result.scalars().all()
        return [
            {
                "id": r.id,
                "project_name": r.project_name,
                "iteration_name": r.iteration_name,
                "mode": r.mode,
                "created": r.created,
                "updated": r.updated,
                "skipped": r.skipped,
                "enriched": r.enriched,
                "errors": r.errors,
                "total_issues": r.total_issues,
                "executed_at": r.executed_at.isoformat() if r.executed_at else None,
            }
            for r in rows
        ]

    async def persist_run(self, db_session: Any, project_name: str, iteration_name: str | None, stats: dict[str, int]) -> None:
        run = SyncRun(
            project_name=project_name,
            iteration_name=iteration_name,
            created=stats.get("created", 0),
            updated=stats.get("updated", 0),
            skipped=stats.get("skipped", 0),
            enriched=stats.get("enriched", 0),
            errors=stats.get("errors", 0),
            total_issues=stats.get("total_issues", 0),
        )
        db_session.add(run)
        await db_session.commit()

    def get_auto_config(self) -> dict[str, Any]:
        return {
            "enabled": settings.sync_auto_enabled,
            "timezone": settings.sync_timezone,
            "run_id": settings.sync_auto_run_id,
            "iteration_name": settings.sync_auto_iteration_name,
            "gitlab_project_id": settings.sync_auto_gitlab_project_id,
            "version": settings.sync_auto_version,
        }

    async def update_auto_config(self, payload: dict[str, Any]) -> dict[str, Any]:
        # In-memory update only (env vars would need restart)
        # We return the merged config; a real implementation might write to DB.
        return {
            "enabled": payload.get("enabled", settings.sync_auto_enabled),
            "timezone": payload.get("timezone", settings.sync_timezone),
            "run_id": payload.get("run_id", settings.sync_auto_run_id),
            "iteration_name": payload.get("iteration_name", settings.sync_auto_iteration_name),
            "gitlab_project_id": payload.get("gitlab_project_id", settings.sync_auto_gitlab_project_id),
            "version": payload.get("version", settings.sync_auto_version),
        }


sync_service = SyncService()
