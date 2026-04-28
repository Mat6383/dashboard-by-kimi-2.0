/**
 * ================================================
 * NOTIFICATIONS ROUTES — CRUD settings + test
 * ================================================
 */

const express = require('express');
const router = express.Router();
const notificationService = require('../services/notification.service');
const { requireAuth, requireRole } = require('../middleware/auth.middleware');
const { safeErrorResponse } = require('../utils/errorResponse');
const { auditAction } = require('../middleware/audit.middleware');

router.get('/settings', requireAuth, async (req, res) => {
  try {
    const settings = notificationService.getSettings(null);
    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json(safeErrorResponse(error, 'GET /api/notifications/settings'));
  }
});

router.get('/settings/:projectId', requireAuth, async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId);
    const settings = notificationService.getSettings(projectId);
    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json(safeErrorResponse(error, 'GET /api/notifications/settings/:projectId'));
  }
});

router.put(
  '/settings',
  requireAuth,
  requireRole('admin'),
  auditAction('notification.settings.update'),
  async (req, res) => {
    try {
      const settings = notificationService.upsertSettings(req.body);
      res.json({ success: true, data: settings });
    } catch (error) {
      res.status(500).json(safeErrorResponse(error, 'PUT /api/notifications/settings'));
    }
  }
);

router.post('/test', requireAuth, requireRole('admin'), auditAction('notification.test'), async (req, res) => {
  try {
    const { channel, url } = req.body;
    const result = await notificationService.testWebhook(channel, url);
    if (!result.ok) {
      return res.status(400).json({ success: false, error: result.error });
    }
    res.json({ success: true, message: `Test ${channel} envoyé` });
  } catch (error) {
    res.status(500).json(safeErrorResponse(error, 'POST /api/notifications/test'));
  }
});

module.exports = router;
