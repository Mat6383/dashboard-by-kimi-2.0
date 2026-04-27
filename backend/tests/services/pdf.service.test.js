/**
 * Tests unitaires du PdfService
 */

jest.mock('../../services/logger.service', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
}));

const mockPage = {
  setContent: jest.fn().mockResolvedValue(),
  pdf: jest.fn().mockResolvedValue(Buffer.from('%PDF-1.4')),
  close: jest.fn().mockResolvedValue(),
};

const mockBrowser = {
  newPage: jest.fn().mockResolvedValue(mockPage),
  close: jest.fn().mockResolvedValue(),
};

jest.mock('puppeteer', () => ({
  launch: jest.fn().mockResolvedValue(mockBrowser),
}));

// On réinitialise le singleton avant chaque test
delete require.cache[require.resolve('../../services/pdf.service')];
const pdfService = require('../../services/pdf.service');

beforeEach(() => {
  jest.clearAllMocks();
});

afterEach(async () => {
  await pdfService.close();
});

describe('PdfService', () => {
  it('lance un browser à la première génération', async () => {
    const puppeteer = require('puppeteer');
    await pdfService.generateFromHTML('<h1>Test</h1>');
    expect(puppeteer.launch).toHaveBeenCalledTimes(1);
    expect(pdfService.generationCount).toBe(1);
  });

  it('réutilise le browser existant', async () => {
    const puppeteer = require('puppeteer');
    await pdfService.generateFromHTML('<h1>A</h1>');
    await pdfService.generateFromHTML('<h1>B</h1>');
    expect(puppeteer.launch).toHaveBeenCalledTimes(1);
    expect(pdfService.generationCount).toBe(2);
  });

  it('recycle le browser après MAX_GENERATIONS', async () => {
    const puppeteer = require('puppeteer');
    const originalMax = process.env.PDF_MAX_GENERATIONS;
    process.env.PDF_MAX_GENERATIONS = '3';
    try {
      for (let i = 0; i < 4; i++) {
        await pdfService.generateFromHTML(`<h1>${i}</h1>`);
      }
      expect(puppeteer.launch).toHaveBeenCalledTimes(2);
      expect(pdfService.generationCount).toBe(1);
    } finally {
      process.env.PDF_MAX_GENERATIONS = originalMax;
    }
  });

  it('passe les bonnes options à puppeteer.launch', async () => {
    const puppeteer = require('puppeteer');
    await pdfService.generateFromHTML('<h1>Test</h1>');
    expect(puppeteer.launch).toHaveBeenCalledWith(
      expect.objectContaining({
        headless: true,
        args: expect.arrayContaining([
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
        ]),
      })
    );
  });

  it('ferme proprement le browser et le timer', async () => {
    await pdfService.generateFromHTML('<h1>Test</h1>');
    await pdfService.close();
    expect(mockBrowser.close).toHaveBeenCalledTimes(1);
    expect(pdfService.browser).toBeNull();
    expect(pdfService.generationCount).toBe(0);
  });

  it('appelle page.pdf avec les bonnes options', async () => {
    await pdfService.generateFromHTML('<h1>Test</h1>', { format: 'A4-Landscape' });
    expect(mockPage.pdf).toHaveBeenCalledWith(
      expect.objectContaining({
        landscape: true,
        printBackground: true,
        displayHeaderFooter: true,
      })
    );
  });

  it('ferme la page même en cas d erreur', async () => {
    mockPage.setContent.mockRejectedValueOnce(new Error('Timeout'));
    await expect(pdfService.generateFromHTML('<h1>Fail</h1>')).rejects.toThrow('Timeout');
    expect(mockPage.close).toHaveBeenCalledTimes(1);
  });

  it('generateDashboardPDF appelle generateFromHTML', async () => {
    const spy = jest.spyOn(pdfService, 'generateFromHTML').mockResolvedValue(Buffer.from('pdf'));
    await pdfService.generateDashboardPDF({ passRate: 50 }, { darkMode: true });
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('Rapport de qualité'), { darkMode: true });
    spy.mockRestore();
  });
});
