/**
 * Tests unitaires des services SQLite
 * featureFlags, syncHistory, comments
 */

jest.mock('better-sqlite3', () => {
  const actual = jest.requireActual('better-sqlite3');
  return jest.fn((dbPath) => new actual(':memory:'));
});

describe('SQLite Services', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  describe('SyncHistoryService', () => {
    it('adds a run and retrieves it', () => {
      const syncHistoryService = require('../../services/syncHistory.service');
      syncHistoryService.initDb();
      const id = syncHistoryService.addRun('Alpha', 'R01', 'preview', {
        created: 2,
        updated: 1,
        skipped: 0,
        total: 3,
      });
      expect(id).toBe(1);
      const history = syncHistoryService.getHistory(10);
      expect(history).toHaveLength(1);
      expect(history[0].project_name).toBe('Alpha');
      expect(history[0].iteration_name).toBe('R01');
    });

    it('returns null when DB is unavailable during addRun', () => {
      const syncHistoryService = require('../../services/syncHistory.service');
      syncHistoryService.initDb();
      syncHistoryService.db = null;
      syncHistoryService._initialized = true;
      const id = syncHistoryService.addRun('Alpha', 'R01', 'preview', {});
      expect(id).toBeNull();
    });

    it('returns empty array when DB is unavailable during getHistory', () => {
      const syncHistoryService = require('../../services/syncHistory.service');
      syncHistoryService.db = null;
      syncHistoryService._initialized = true;
      expect(syncHistoryService.getHistory(10)).toEqual([]);
    });

    it('returns null when DB prepare throws during addRun', () => {
      const syncHistoryService = require('../../services/syncHistory.service');
      syncHistoryService.initDb();
      const originalPrepare = syncHistoryService.db.prepare.bind(syncHistoryService.db);
      syncHistoryService.db.prepare = jest.fn(() => {
        throw new Error('DB locked');
      });
      const id = syncHistoryService.addRun('Alpha', 'R01', 'preview', {});
      expect(id).toBeNull();
      syncHistoryService.db.prepare = originalPrepare;
    });

    it('returns empty array when DB prepare throws during getHistory', () => {
      const syncHistoryService = require('../../services/syncHistory.service');
      syncHistoryService.initDb();
      const originalPrepare = syncHistoryService.db.prepare.bind(syncHistoryService.db);
      syncHistoryService.db.prepare = jest.fn(() => {
        throw new Error('DB locked');
      });
      expect(syncHistoryService.getHistory(10)).toEqual([]);
      syncHistoryService.db.prepare = originalPrepare;
    });

    it('handles initDb failure gracefully', () => {
      const BetterSqlite3 = require('better-sqlite3');
      const originalImpl = BetterSqlite3.getMockImplementation();
      BetterSqlite3.mockImplementationOnce(() => {
        throw new Error('Cannot open DB');
      });
      const syncHistoryService = require('../../services/syncHistory.service');
      syncHistoryService._initialized = false;
      syncHistoryService.db = null;
      syncHistoryService.initDb();
      expect(syncHistoryService._initialized).toBe(false);
      expect(syncHistoryService.db).toBeNull();
      BetterSqlite3.mockImplementation(originalImpl);
    });
  });

  describe('CommentsService', () => {
    it('upserts and gets a comment', () => {
      const commentsService = require('../../services/comments.service');
      commentsService.init();
      const row = commentsService.upsert(1, 'Comment 1', 'R01');
      expect(row.comment).toBe('Comment 1');
      expect(row.milestone_context).toBe('R01');
      const all = commentsService.getAll();
      expect(all[1].comment).toBe('Comment 1');
    });

    it('deletes a comment', () => {
      const commentsService = require('../../services/comments.service');
      commentsService.init();
      commentsService.upsert(1, 'To delete', null);
      expect(commentsService.delete(1)).toBe(true);
      expect(commentsService.delete(1)).toBe(false);
    });

    it('throws when DB prepare throws during getAll', () => {
      const commentsService = require('../../services/comments.service');
      commentsService.init();
      const originalPrepare = commentsService.db.prepare.bind(commentsService.db);
      commentsService.db.prepare = jest.fn(() => {
        throw new Error('DB locked');
      });
      expect(() => commentsService.getAll()).toThrow('DB locked');
      commentsService.db.prepare = originalPrepare;
    });

    it('throws when DB prepare throws during upsert', () => {
      const commentsService = require('../../services/comments.service');
      commentsService.init();
      const originalPrepare = commentsService.db.prepare.bind(commentsService.db);
      commentsService.db.prepare = jest.fn(() => {
        throw new Error('DB locked');
      });
      expect(() => commentsService.upsert(1, 'Comment', 'R01')).toThrow('DB locked');
      commentsService.db.prepare = originalPrepare;
    });

    it('throws when DB prepare throws during delete', () => {
      const commentsService = require('../../services/comments.service');
      commentsService.init();
      const originalPrepare = commentsService.db.prepare.bind(commentsService.db);
      commentsService.db.prepare = jest.fn(() => {
        throw new Error('DB locked');
      });
      expect(() => commentsService.delete(1)).toThrow('DB locked');
      commentsService.db.prepare = originalPrepare;
    });

    it('throws when init fails', () => {
      const BetterSqlite3 = require('better-sqlite3');
      const originalImpl = BetterSqlite3.getMockImplementation();
      BetterSqlite3.mockImplementationOnce(() => {
        throw new Error('Cannot open DB');
      });
      const commentsService = require('../../services/comments.service');
      expect(() => commentsService.init()).toThrow('Cannot open DB');
      BetterSqlite3.mockImplementation(originalImpl);
    });
  });

  describe('FeatureFlagsService', () => {
    it('gets all flags', () => {
      const featureFlagsService = require('../../services/featureFlags.service');
      const syncHistoryService = require('../../services/syncHistory.service');
      syncHistoryService.initDb();
      featureFlagsService.set('flagA', true);
      const flags = featureFlagsService.getAll();
      expect(flags).toHaveProperty('flagA', true);
    });

    it('checks if a flag is enabled', () => {
      const featureFlagsService = require('../../services/featureFlags.service');
      const syncHistoryService = require('../../services/syncHistory.service');
      syncHistoryService.initDb();
      featureFlagsService.set('flagA', true);
      expect(featureFlagsService.isEnabled('flagA')).toBe(true);
      expect(featureFlagsService.isEnabled('unknown')).toBe(false);
      expect(featureFlagsService.isEnabled('unknown', true)).toBe(true);
    });

    it('sets a flag', () => {
      const featureFlagsService = require('../../services/featureFlags.service');
      const syncHistoryService = require('../../services/syncHistory.service');
      syncHistoryService.initDb();
      expect(featureFlagsService.set('flagB', true)).toBe(true);
      expect(featureFlagsService.isEnabled('flagB')).toBe(true);
    });

    it('returns false when DB is unavailable during set', () => {
      const featureFlagsService = require('../../services/featureFlags.service');
      const syncHistoryService = require('../../services/syncHistory.service');
      syncHistoryService.db = null;
      syncHistoryService._initialized = true;
      expect(featureFlagsService.set('flagX', true)).toBe(false);
    });

    it('returns default when DB prepare throws during isEnabled', () => {
      const featureFlagsService = require('../../services/featureFlags.service');
      const syncHistoryService = require('../../services/syncHistory.service');
      syncHistoryService.initDb();
      const originalPrepare = syncHistoryService.db.prepare.bind(syncHistoryService.db);
      syncHistoryService.db.prepare = jest.fn(() => {
        throw new Error('DB locked');
      });
      expect(featureFlagsService.isEnabled('flagY', false)).toBe(false);
      expect(featureFlagsService.isEnabled('flagY', true)).toBe(true);
      syncHistoryService.db.prepare = originalPrepare;
    });

    it('returns empty object when DB prepare throws during getAll', () => {
      const featureFlagsService = require('../../services/featureFlags.service');
      const syncHistoryService = require('../../services/syncHistory.service');
      syncHistoryService.initDb();
      const originalPrepare = syncHistoryService.db.prepare.bind(syncHistoryService.db);
      syncHistoryService.db.prepare = jest.fn(() => {
        throw new Error('DB locked');
      });
      expect(featureFlagsService.getAll()).toEqual({});
      syncHistoryService.db.prepare = originalPrepare;
    });

    it('returns false when DB prepare throws during set', () => {
      const featureFlagsService = require('../../services/featureFlags.service');
      const syncHistoryService = require('../../services/syncHistory.service');
      syncHistoryService.initDb();
      const originalPrepare = syncHistoryService.db.prepare.bind(syncHistoryService.db);
      syncHistoryService.db.prepare = jest.fn(() => {
        throw new Error('DB locked');
      });
      expect(featureFlagsService.set('flagZ', true)).toBe(false);
      syncHistoryService.db.prepare = originalPrepare;
    });
  });
});
