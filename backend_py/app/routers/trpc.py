"""tRPC bridge — translates tRPC batch requests into internal service calls.

Compatible with @trpc/react-query httpBatchLink (v10, no transformer).
"""

from __future__ import annotations

import traceback
from typing import Any

from fastapi import APIRouter, Depends, Request
from sqlalchemy import select

from app.database import get_main_db
from app.deps import require_auth
from app.models.integrations import Integration
from app.models.webhooks import WebhookSubscription
from app.schemas import (
    AnalyticsAnalyzePayload,
    AnalyticsMarkReadPayload,
    IntegrationCreate,
    IntegrationUpdate,
    JiraIssueCreate,
    RetentionPolicyUpdate,
    WebhookSubscriptionCreate,
    WebhookSubscriptionUpdate,
)
from app.services.analytics import analytics_service
from app.services.jira import integration_service
from app.services.retention import retention_service
from app.services.webhook_emitter import webhook_emitter
from app.utils.logger import get_logger

logger = get_logger(__name__)
router = APIRouter()


async def _db():
    async with get_main_db() as db:
        yield db


def _ok(data: Any) -> dict[str, Any]:
    return {"result": {"data": data}}


def _err(message: str, code: str = "INTERNAL_SERVER_ERROR") -> dict[str, Any]:
    return {"error": {"message": message, "code": code}}


# ── Procedure registry ──────────────────────────────────

async def _analytics_list(input_data: dict[str, Any], db) -> dict[str, Any]:
    insights = await analytics_service.get_insights(
        db,
        project_id=input_data.get("projectId"),
        unread_only=input_data.get("unreadOnly", False),
        limit=input_data.get("limit", 50),
    )
    return _ok({"insights": insights})


async def _analytics_mark_read(input_data: dict[str, Any], db) -> dict[str, Any]:
    ok = await analytics_service.mark_as_read(db, input_data["id"])
    return _ok({"success": ok})


async def _analytics_mark_all_read(input_data: dict[str, Any] | None, db) -> dict[str, Any]:
    count = await analytics_service.mark_all_as_read(
        db, project_id=(input_data or {}).get("projectId")
    )
    return _ok({"success": True, "count": count})


async def _analytics_analyze(input_data: dict[str, Any], db) -> dict[str, Any]:
    result = await analytics_service.analyze_project(db, input_data["projectId"])
    return _ok(result)


async def _retention_policies(_input_data: dict[str, Any] | None, db) -> dict[str, Any]:
    policies = await retention_service.get_policies(db)
    return _ok({"policies": policies})


async def _retention_update_policy(input_data: dict[str, Any], db) -> dict[str, Any]:
    policy = await retention_service.update_policy(
        db,
        input_data["entityType"],
        input_data.get("retentionDays"),
        input_data.get("autoArchive"),
        input_data.get("autoDelete"),
    )
    return _ok({"policy": policy})


async def _retention_archives(input_data: dict[str, Any] | None, db) -> dict[str, Any]:
    archives = await retention_service.get_archives(
        db,
        entity_type=(input_data or {}).get("entityType"),
        limit=(input_data or {}).get("limit", 100),
    )
    return _ok({"archives": archives})


async def _retention_run_cycle(_input_data: dict[str, Any] | None, db) -> dict[str, Any]:
    result = await retention_service.run_retention_cycle(db)
    return _ok(result)


async def _integrations_list(_input_data: dict[str, Any] | None, db) -> dict[str, Any]:
    result = await db.execute(select(Integration))
    rows = result.scalars().all()
    return _ok({"integrations": [{"id": r.id, "name": r.name, "type": r.type, "config": r.config_json, "enabled": r.enabled} for r in rows]})


async def _integrations_get(input_data: dict[str, Any], db) -> dict[str, Any]:
    result = await db.execute(select(Integration).where(Integration.id == input_data["id"]))
    row = result.scalar_one_or_none()
    if not row:
        return _err("Integration not found", "NOT_FOUND")
    return _ok({"integration": {"id": row.id, "name": row.name, "type": row.type, "config": row.config_json, "enabled": row.enabled}})


async def _integrations_create(input_data: dict[str, Any], db) -> dict[str, Any]:
    integration = Integration(name=input_data["name"], type=input_data["type"], config_json=input_data.get("config", {}), enabled=input_data.get("enabled", True))
    db.add(integration)
    await db.commit()
    await db.refresh(integration)
    return _ok({"integration": {"id": integration.id, "name": integration.name, "type": integration.type, "config": integration.config_json, "enabled": integration.enabled}})


async def _integrations_update(input_data: dict[str, Any], db) -> dict[str, Any]:
    result = await db.execute(select(Integration).where(Integration.id == input_data["id"]))
    row = result.scalar_one_or_none()
    if not row:
        return _err("Integration not found", "NOT_FOUND")
    if "name" in input_data:
        row.name = input_data["name"]
    if "type" in input_data:
        row.type = input_data["type"]
    if "config" in input_data:
        row.config_json = input_data["config"]
    if "enabled" in input_data:
        row.enabled = input_data["enabled"]
    await db.commit()
    await db.refresh(row)
    return _ok({"integration": {"id": row.id, "name": row.name, "type": row.type, "config": row.config_json, "enabled": row.enabled}})


async def _integrations_delete(input_data: dict[str, Any], db) -> dict[str, Any]:
    result = await db.execute(select(Integration).where(Integration.id == input_data["id"]))
    row = result.scalar_one_or_none()
    if not row:
        return _err("Integration not found", "NOT_FOUND")
    await db.delete(row)
    await db.commit()
    return _ok({"success": True})


async def _integrations_test(input_data: dict[str, Any], db) -> dict[str, Any]:
    result = await db.execute(select(Integration).where(Integration.id == input_data["id"]))
    row = result.scalar_one_or_none()
    if not row:
        return _err("Integration not found", "NOT_FOUND")
    if row.type == "jira":
        resp = await integration_service.test_jira_connection(row.config_json)
    elif row.type == "gitlab":
        resp = await integration_service.test_gitlab_connection(row.config_json)
    elif row.type == "generic_webhook":
        from datetime import datetime, timezone
        resp = await integration_service.send_generic_webhook(row.config_json, {"event": "test", "timestamp": datetime.now(timezone.utc).isoformat()})
    else:
        return _err("Type not supported for test")
    return _ok(resp)


async def _integrations_create_jira_issue(input_data: dict[str, Any], db) -> dict[str, Any]:
    result = await db.execute(select(Integration).where(Integration.id == input_data["id"]))
    row = result.scalar_one_or_none()
    if not row:
        return _err("Integration not found", "NOT_FOUND")
    if row.type != "jira":
        return _err("Integration is not Jira", "BAD_REQUEST")
    resp = await integration_service.create_jira_issue(
        row.config_json,
        input_data["summary"],
        input_data["description"],
        input_data.get("issueType", "Bug"),
    )
    if resp.get("success"):
        from datetime import datetime, timezone
        row.last_sync_at = datetime.now(timezone.utc)
        await db.commit()
    return _ok(resp)


async def _webhooks_list(_input_data: dict[str, Any] | None, db) -> dict[str, Any]:
    result = await db.execute(select(WebhookSubscription))
    rows = result.scalars().all()
    return _ok({"webhooks": [{"id": r.id, "url": r.url, "events": r.events, "secret": r.secret, "enabled": r.enabled, "filters": r.filters} for r in rows]})


async def _webhooks_create(input_data: dict[str, Any], db) -> dict[str, Any]:
    sub = WebhookSubscription(**input_data)
    db.add(sub)
    await db.commit()
    await db.refresh(sub)
    return _ok({"webhook": {"id": sub.id, "url": sub.url, "events": sub.events, "secret": sub.secret, "enabled": sub.enabled}})


async def _webhooks_update(input_data: dict[str, Any], db) -> dict[str, Any]:
    result = await db.execute(select(WebhookSubscription).where(WebhookSubscription.id == input_data["id"]))
    sub = result.scalar_one_or_none()
    if not sub:
        return _err("Webhook not found", "NOT_FOUND")
    data = {k: v for k, v in input_data.items() if k != "id" and v is not None}
    for field, value in data.items():
        setattr(sub, field, value)
    await db.commit()
    await db.refresh(sub)
    return _ok({"webhook": {"id": sub.id, "url": sub.url, "events": sub.events, "secret": sub.secret, "enabled": sub.enabled}})


async def _webhooks_delete(input_data: dict[str, Any], db) -> dict[str, Any]:
    result = await db.execute(select(WebhookSubscription).where(WebhookSubscription.id == input_data["id"]))
    sub = result.scalar_one_or_none()
    if not sub:
        return _err("Webhook not found", "NOT_FOUND")
    await db.delete(sub)
    await db.commit()
    return _ok({"success": True})


# Map "router.procedure" → handler
PROCEDURES: dict[str, Any] = {
    "analytics.list": _analytics_list,
    "analytics.markRead": _analytics_mark_read,
    "analytics.markAllRead": _analytics_mark_all_read,
    "analytics.analyze": _analytics_analyze,
    "retention.policies": _retention_policies,
    "retention.updatePolicy": _retention_update_policy,
    "retention.archives": _retention_archives,
    "retention.runCycle": _retention_run_cycle,
    "integrations.list": _integrations_list,
    "integrations.get": _integrations_get,
    "integrations.create": _integrations_create,
    "integrations.update": _integrations_update,
    "integrations.delete": _integrations_delete,
    "integrations.testConnection": _integrations_test,
    "integrations.createJiraIssue": _integrations_create_jira_issue,
    "webhooks.list": _webhooks_list,
    "webhooks.create": _webhooks_create,
    "webhooks.update": _webhooks_update,
    "webhooks.delete": _webhooks_delete,
}


@router.post("/")
async def trpc_batch(request: Request, user=Depends(require_auth)):
    """Handle tRPC batch requests."""
    body = await request.json()
    calls = body if isinstance(body, list) else [body]

    async with get_main_db() as db:
        responses = []
        for call in calls:
            call_id = call.get("id")
            path = call.get("path") or call.get("params", {}).get("path")
            method = call.get("method") or call.get("params", {}).get("method")
            raw_input = call.get("input") or call.get("params", {}).get("input") or call.get("json", {})

            handler = PROCEDURES.get(path)
            if not handler:
                responses.append({"error": {"message": f"Unknown procedure: {path}", "code": "NOT_FOUND"}, "id": call_id})
                continue

            try:
                result = await handler(raw_input, db)
                result["id"] = call_id
                responses.append(result)
            except Exception as exc:
                logger.error("tRPC error in %s: %s", path, exc)
                responses.append({"error": {"message": str(exc), "code": "INTERNAL_SERVER_ERROR"}, "id": call_id})

    return responses
