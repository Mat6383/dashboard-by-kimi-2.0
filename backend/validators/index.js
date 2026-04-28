const { z } = require('zod');

// ─── Params ────────────────────────────────────────────────────────────────
const projectIdParam = z.object({
  projectId: z.coerce.number().int().positive('Project ID invalide'),
});

const syncProjectIdParam = z.object({
  projectId: z.string().min(1, 'Project ID invalide'),
});

const runIdParam = z.object({
  runId: z.coerce.number().int().positive('Run ID invalide'),
});

const iterationIdParam = z.object({
  iterationId: z.coerce.number().int().positive('iterationId invalide'),
});

const iidParam = z.object({
  iid: z.coerce.number().int().positive('iid invalide'),
});

const featureFlagKeyParam = z.object({
  key: z.string().min(1, 'Clé du flag requise'),
});

// ─── Query ─────────────────────────────────────────────────────────────────
const milestonesQuery = z.object({
  preprodMilestones: z
    .string()
    .regex(/^\d+(,\d+)*$/, 'preprodMilestones doit être une liste de nombres séparés par des virgules')
    .optional(),
  prodMilestones: z
    .string()
    .regex(/^\d+(,\d+)*$/, 'prodMilestones doit être une liste de nombres séparés par des virgules')
    .optional(),
});

const runResultsQuery = z.object({
  status: z
    .string()
    .regex(/^\d+(,\d+)*$/, 'status doit être une liste de IDs séparés par des virgules')
    .optional(),
});

// ─── Body ──────────────────────────────────────────────────────────────────
const syncPreviewBody = z.object({
  projectId: z.string().min(1, '"projectId" requis'),
  iterationName: z.string().min(1, '"iterationName" requis'),
});

const syncExecuteBody = syncPreviewBody;

const syncIterationBody = z.object({
  iteration: z.string().min(1, 'Paramètre "iteration" requis'),
  isTest: z.boolean().optional(),
  dryRun: z.boolean().optional(),
});

const syncStatusToGitlabBody = z
  .object({
    runId: z.number().int().positive('"runId" requis'),
    iterationName: z.string().optional(),
    gitlabProjectId: z.union([z.string(), z.number()], '"gitlabProjectId" requis'),
    dryRun: z.boolean().optional(),
    version: z.string().optional(),
  })
  .refine((data) => data.iterationName || data.version, { error: 'iterationName ou version requis' });

const reportsGenerateBody = z
  .object({
    projectId: z.number().int().positive('"projectId" requis'),
    runIds: z.array(z.number().int().positive()).optional(),
    milestoneId: z.number().int().positive().optional(),
    formats: z
      .object({
        html: z.boolean().optional(),
        pptx: z.boolean().optional(),
      })
      .refine((v) => v.html || v.pptx, {
        error: 'Au moins un format (html/pptx) requis',
      }),
    recommendations: z.string().optional(),
    complement: z.string().optional(),
  })
  .refine((v) => v.runIds || v.milestoneId, {
    error: 'runIds (tableau) ou milestoneId requis',
  });

const crosstestCommentBody = z.object({
  issue_iid: z.number().int().positive('"issue_iid" requis'),
  comment: z.string().min(1, '"comment" requis'),
  milestone_context: z.string().nullable().optional(),
});

const crosstestCommentPutBody = z.object({
  comment: z.string().min(1, '"comment" requis'),
  milestone_context: z.string().nullable().optional(),
});

const autoConfigBody = z
  .object({
    enabled: z.boolean().optional(),
    runId: z.number().int().positive().optional(),
    iterationName: z.string().optional(),
    gitlabProjectId: z.string().optional(),
    version: z.string().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, {
    error: 'Aucun champ valide fourni (enabled, runId, iterationName, gitlabProjectId, version)',
  });

const featureFlagCreateBody = z.object({
  key: z.string().min(1, 'La clé du flag est requise'),
  enabled: z.boolean().optional(),
  description: z.string().optional(),
  rolloutPercentage: z.number().int().min(0).max(100).optional(),
});

const featureFlagUpdateBody = z.object({
  enabled: z.boolean().optional(),
  description: z.string().optional(),
  rolloutPercentage: z.number().int().min(0).max(100).optional(),
});

// ─── Middleware ────────────────────────────────────────────────────────────
function validate(schema) {
  return (req, res, next) => {
    try {
      schema.parse(req);
      next();
    } catch (err) {
      const message = err.errors?.[0]?.message || err.message;
      return res.status(400).json({
        success: false,
        error: message,
        timestamp: new Date().toISOString(),
      });
    }
  };
}

function validateParams(schema) {
  return (req, res, next) => {
    try {
      schema.parse(req.params);
      next();
    } catch (err) {
      const message = err.errors?.[0]?.message || err.message;
      return res.status(400).json({
        success: false,
        error: message,
        timestamp: new Date().toISOString(),
      });
    }
  };
}

function validateBody(schema) {
  return (req, res, next) => {
    try {
      schema.parse(req.body);
      next();
    } catch (err) {
      const message = err.errors?.[0]?.message || err.message;
      return res.status(400).json({
        success: false,
        error: message,
        timestamp: new Date().toISOString(),
      });
    }
  };
}

function validateQuery(schema) {
  return (req, res, next) => {
    try {
      schema.parse(req.query);
      next();
    } catch (err) {
      const message = err.errors?.[0]?.message || err.message;
      return res.status(400).json({
        success: false,
        error: message,
        timestamp: new Date().toISOString(),
      });
    }
  };
}

module.exports = {
  z,
  validate,
  validateParams,
  validateBody,
  validateQuery,
  projectIdParam,
  syncProjectIdParam,
  runIdParam,
  iterationIdParam,
  iidParam,
  featureFlagKeyParam,
  featureFlagCreateBody,
  featureFlagUpdateBody,
  syncPreviewBody,
  syncExecuteBody,
  syncIterationBody,
  syncStatusToGitlabBody,
  reportsGenerateBody,
  crosstestCommentBody,
  crosstestCommentPutBody,
  autoConfigBody,
  milestonesQuery,
  runResultsQuery,
};
