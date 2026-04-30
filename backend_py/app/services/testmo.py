"""Testmo API client with cache, dedup & circuit breaker."""

from __future__ import annotations

import asyncio
from collections import defaultdict
from typing import Any

import httpx
from cachetools import TTLCache

from app.config import settings
from app.core.circuit_breaker import CircuitBreaker
from app.core.resilience import with_resilience
from app.utils.logger import get_logger

logger = get_logger(__name__)


class TestmoService:
    __test__ = False  # Not a pytest test class
    def __init__(self) -> None:
        self.client = httpx.AsyncClient(
            base_url=f"{settings.testmo_url.rstrip('/')}/api/v1",
            headers={"Authorization": f"Bearer {settings.testmo_token}"},
            timeout=settings.api_timeout,
        )
        self.cache: TTLCache = TTLCache(maxsize=500, ttl=settings.cache_duration)
        self._in_flight: dict[str, asyncio.Future[Any]] = {}
        self.cb = CircuitBreaker(name="testmo", failure_threshold=5, recovery_timeout=30.0)

    def _cache_key(self, method: str, *parts: Any) -> str:
        return f"{method}:{':'.join(str(p) for p in parts)}"

    async def _cached_request(self, key: str, fetch: Callable[[], Any]) -> Any:
        """Request deduplication + TTL cache."""
        if key in self.cache:
            return self.cache[key]
        if key in self._in_flight:
            return await self._in_flight[key]
        loop = asyncio.get_event_loop()
        fut: asyncio.Future[Any] = loop.create_future()
        self._in_flight[key] = fut
        try:
            data = await fetch()
            self.cache[key] = data
            fut.set_result(data)
            return data
        except Exception as exc:
            fut.set_exception(exc)
            raise
        finally:
            self._in_flight.pop(key, None)

    @with_resilience(breaker=None, max_attempts=3, base_delay_ms=500)
    async def _get(self, path: str, params: dict[str, Any] | None = None) -> Any:
        async with self.cb:
            resp = await self.client.get(path, params=params)
            resp.raise_for_status()
            return resp.json()

    async def get_projects(self) -> list[dict[str, Any]]:
        key = self._cache_key("projects")

        async def _fetch() -> Any:
            data = await self._get("/projects", {"per_page": 100})
            return data if isinstance(data, list) else data.get("projects", [])

        return await self._cached_request(key, _fetch)

    async def get_project_runs(self, project_id: int, active_only: bool = False) -> list[dict[str, Any]]:
        key = self._cache_key("runs", project_id, "active" if active_only else "all")

        async def _fetch() -> Any:
            params: dict[str, Any] = {"per_page": 100}
            if active_only:
                params["is_closed"] = "0"
            data = await self._get(f"/projects/{project_id}/runs", params)
            return data if isinstance(data, list) else data.get("runs", [])

        return await self._cached_request(key, _fetch)

    async def get_project_milestones(self, project_id: int) -> list[dict[str, Any]]:
        key = self._cache_key("milestones", project_id)

        async def _fetch() -> Any:
            data = await self._get(f"/projects/{project_id}/milestones", {"per_page": 100})
            return data if isinstance(data, list) else data.get("milestones", [])

        return await self._cached_request(key, _fetch)

    async def get_automation_runs(self, project_id: int) -> list[dict[str, Any]]:
        key = self._cache_key("automation", project_id)

        async def _fetch() -> Any:
            data = await self._get(f"/projects/{project_id}/automation/runs", {"per_page": 100})
            return data if isinstance(data, list) else data.get("runs", [])

        return await self._cached_request(key, _fetch)

    async def get_run_details(self, run_id: int) -> dict[str, Any]:
        key = self._cache_key("run", run_id)
        return await self._cached_request(key, lambda: self._get(f"/runs/{run_id}"))

    async def get_run_results(self, run_id: int, status_filter: str | None = None) -> list[dict[str, Any]]:
        key = self._cache_key("results", run_id, status_filter or "all")
        params = {}
        if status_filter:
            params["status"] = status_filter

        async def _fetch() -> Any:
            data = await self._get(f"/runs/{run_id}/results", params)
            return data if isinstance(data, list) else data.get("results", [])

        return await self._cached_request(key, _fetch)

    async def get_project_metrics(self, project_id: int) -> dict[str, Any]:
        """Aggregate ISTQB/ITIL/LEAN KPIs from runs + sessions."""
        runs = await self.get_project_runs(project_id, active_only=True)
        if not runs:
            return {
                "project_id": project_id,
                "pass_rate": 0.0,
                "completion_rate": 0.0,
                "escape_rate": 0.0,
                "detection_rate": 0.0,
                "blocked_rate": 0.0,
                "total_tests": 0,
                "mttr_hours": 0.0,
                "lead_time_days": 0.0,
            }

        total_tests = sum(r.get("cases_count", 0) for r in runs)
        passed = sum(r.get("passed_count", 0) for r in runs)
        failed = sum(r.get("failed_count", 0) for r in runs)
        blocked = sum(r.get("blocked_count", 0) for r in runs)
        completed = passed + failed

        pass_rate = (passed / completed * 100) if completed else 0.0
        completion_rate = (completed / total_tests * 100) if total_tests else 0.0
        blocked_rate = (blocked / total_tests * 100) if total_tests else 0.0

        return {
            "project_id": project_id,
            "pass_rate": round(pass_rate, 2),
            "completion_rate": round(completion_rate, 2),
            "escape_rate": 0.0,
            "detection_rate": 0.0,
            "blocked_rate": round(blocked_rate, 2),
            "total_tests": total_tests,
            "mttr_hours": 0.0,
            "lead_time_days": 0.0,
        }

    async def get_escape_and_detection_rates(
        self, project_id: int, preprod_milestones: list[int] | None = None, prod_milestones: list[int] | None = None
    ) -> dict[str, Any]:
        """Compare bugs found in preprod vs prod using milestone filters."""
        runs = await self.get_project_runs(project_id)
        if not runs:
            return {"escape_rate": 0.0, "detection_rate": 0.0, "project_id": project_id}

        # If milestone IDs provided, filter runs by milestone_id
        preprod_ids = set(preprod_milestones or [])
        prod_ids = set(prod_milestones or [])

        preprod_runs = [r for r in runs if r.get("milestone_id") in preprod_ids] if preprod_ids else runs
        prod_runs = [r for r in runs if r.get("milestone_id") in prod_ids] if prod_ids else []

        def _bug_count(run_list: list[dict[str, Any]]) -> int:
            return sum(r.get("failed_count", 0) + r.get("blocked_count", 0) for r in run_list)

        preprod_bugs = _bug_count(preprod_runs)
        prod_bugs = _bug_count(prod_runs)
        total_bugs = preprod_bugs + prod_bugs

        detection_rate = (preprod_bugs / total_bugs * 100) if total_bugs else 0.0
        escape_rate = (prod_bugs / total_bugs * 100) if total_bugs else 0.0

        return {
            "escape_rate": round(escape_rate, 2),
            "detection_rate": round(detection_rate, 2),
            "project_id": project_id,
            "preprod_bugs": preprod_bugs,
            "prod_bugs": prod_bugs,
        }

    async def get_annual_quality_trends(self, project_id: int) -> list[dict[str, Any]]:
        """Aggregate metrics per year from runs."""
        runs = await self.get_project_runs(project_id)
        years: dict[str, dict[str, Any]] = defaultdict(lambda: {"passed": 0, "failed": 0, "blocked": 0, "total": 0})
        for r in runs:
            started = r.get("started_at") or r.get("created_at")
            if not started:
                continue
            year = str(started)[:4] if isinstance(started, str) else started.year
            years[year]["passed"] += r.get("passed_count", 0)
            years[year]["failed"] += r.get("failed_count", 0)
            years[year]["blocked"] += r.get("blocked_count", 0)
            years[year]["total"] += r.get("cases_count", 0)

        trends = []
        for year in sorted(years.keys()):
            y = years[year]
            completed = y["passed"] + y["failed"]
            trends.append({
                "year": year,
                "pass_rate": round(y["passed"] / completed * 100, 2) if completed else 0.0,
                "completion_rate": round(completed / y["total"] * 100, 2) if y["total"] else 0.0,
                "blocked_rate": round(y["blocked"] / y["total"] * 100, 2) if y["total"] else 0.0,
                "total_tests": y["total"],
            })
        return trends

    async def compare_projects(self, project_ids: list[int]) -> list[dict[str, Any]]:
        """Metrics comparison across multiple projects."""
        results = []
        for pid in project_ids:
            metrics = await self.get_project_metrics(pid)
            results.append({"project_id": pid, **metrics})
        return results

    async def health_check(self) -> bool:
        try:
            await self._get("/projects", {"limit": 1})
            return True
        except Exception:
            return False

    def clear_cache(self) -> None:
        self.cache.clear()
        logger.info("Testmo cache cleared")


# Avoid typing issues with lambda in _cached_request
from typing import Callable

testmo_service = TestmoService()
