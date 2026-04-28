import express from 'express';
const router = express.Router();
import pdfService from '../services/pdf.service';
import testmoService from '../services/testmo.service';
import { requireAuth } from '../middleware/auth.middleware';
import { safeErrorResponse } from '../utils/errorResponse';
import { auditAction } from '../middleware/audit.middleware';
import { exportRunsTotal } from '../middleware/metrics';

router.post('/generate', requireAuth, auditAction('export.pdf'), async (req, res) => {
  try {
    const { projectId, milestones, format = 'A4', darkMode = false } = req.body;
    if (!projectId) {
      return res.status(400).json({ success: false, error: 'projectId requis' });
    }

    const metrics = await testmoService.getProjectMetrics(
      parseInt(projectId),
      milestones?.preprod || null,
      milestones?.prod || null
    );

    const pdfBuffer = await pdfService.generateDashboardPDF(metrics, { format, darkMode });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="qa-dashboard-${projectId}-${Date.now()}.pdf"`);
    exportRunsTotal.inc({ format: 'pdf' });
    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json(safeErrorResponse(error, 'POST /api/pdf/generate'));
  }
});

export default router;
module.exports = exports.default;
