import collectReportData from './report/collectData';
import generateHTML from './report/generateHTML';
import generatePPTX from './report/generatePPTX';

class ReportService {
  testmoService: any;

  constructor(testmoService) {
    this.testmoService = testmoService;
  }

  async collectReportData(projectId, runIds) {
    return collectReportData(this.testmoService, projectId, runIds);
  }

  generateHTML(data, recommendations, complement) {
    return generateHTML(data, recommendations, complement);
  }

  async generatePPTX(data, recommendations, complement) {
    return generatePPTX(data, recommendations, complement);
  }
}

export default ReportService;
module.exports = exports.default;
