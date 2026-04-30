import integrationService from '../services/integration.service';

describe('IntegrationService', () => {
  beforeAll(() => {
    integrationService.init();
  });

  beforeEach(() => {
    integrationService.db.prepare('DELETE FROM integrations').run();
  });

  test('create et getById', () => {
    const created = integrationService.create({
      name: 'Jira Prod',
      type: 'jira',
      config: { baseUrl: 'https://jira.example.com', apiToken: 'tok' },
      enabled: true,
    });
    expect(created.id).toBeDefined();
    expect(created.name).toBe('Jira Prod');

    const fetched = integrationService.getById(created.id);
    expect(fetched).not.toBeNull();
    expect(fetched!.config.baseUrl).toBe('https://jira.example.com');
  });

  test('list retourne toutes les intégrations', () => {
    integrationService.create({ name: 'A', type: 'generic_webhook', config: { url: 'http://a' } });
    integrationService.create({ name: 'B', type: 'jira', config: {} });
    const list = integrationService.list();
    expect(list.length).toBe(2);
  });

  test('update modifie une intégration', () => {
    const created = integrationService.create({ name: 'Old', type: 'jira', config: {} });
    const updated = integrationService.update(created.id, { name: 'New', enabled: false });
    expect(updated!.name).toBe('New');
    expect(updated!.enabled).toBe(false);
  });

  test('delete supprime une intégration', () => {
    const created = integrationService.create({ name: 'X', type: 'jira', config: {} });
    integrationService.delete(created.id);
    expect(integrationService.getById(created.id)).toBeNull();
  });

  test('testJiraConnection échoue sans credentials', async () => {
    const result = await integrationService.testJiraConnection({});
    expect(result.success).toBe(false);
  });

  test('sendWebhook échoue sans URL', async () => {
    const result = await integrationService.sendWebhook({}, { event: 'test' });
    expect(result.success).toBe(false);
  });
});
