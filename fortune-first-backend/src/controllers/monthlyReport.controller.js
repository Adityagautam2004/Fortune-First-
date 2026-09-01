const monthlyReportService = require('../services/monthlyReportService');

// POST /admin/reports — super_admin only.
const createReport = async (req, res) => {
  try {
    const report = await monthlyReportService.createReport(req.body, req.user.userId, req.file || null);
    return res.status(201).json({ status: 'success', message: 'Report created', data: report });
  } catch (error) {
    console.error('Create Report Error:', error);
    return res.status(error.statusCode || 500).json({ status: 'error', message: error.message || 'Failed to create report' });
  }
};

// PATCH /admin/reports/:id — super_admin only.
const updateReport = async (req, res) => {
  try {
    const report = await monthlyReportService.updateReport(req.params.id, req.body, req.file || null);
    return res.status(200).json({ status: 'success', message: 'Report updated', data: report });
  } catch (error) {
    console.error('Update Report Error:', error);
    return res.status(error.statusCode || 500).json({ status: 'error', message: error.message || 'Failed to update report' });
  }
};

// DELETE /admin/reports/:id — super_admin only.
const deleteReport = async (req, res) => {
  try {
    await monthlyReportService.deleteReport(req.params.id);
    return res.status(200).json({ status: 'success', message: 'Report deleted' });
  } catch (error) {
    console.error('Delete Report Error:', error);
    return res.status(error.statusCode || 500).json({ status: 'error', message: error.message || 'Failed to delete report' });
  }
};

// GET /board/reports — every non-client role; optional ?month=&year= filters.
const getReports = async (req, res) => {
  try {
    const { month, year, page, limit } = req.query;
    const result = await monthlyReportService.getReports({
      month: month ? parseInt(month, 10) : undefined,
      year: year ? parseInt(year, 10) : undefined,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
    return res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    console.error('Get Reports Error:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch reports' });
  }
};

// GET /board/reports/:id — full detail, every non-client role.
const getReportById = async (req, res) => {
  try {
    const report = await monthlyReportService.getReportById(req.params.id);
    return res.status(200).json({ status: 'success', data: report });
  } catch (error) {
    console.error('Get Report Error:', error);
    return res.status(error.statusCode || 500).json({ status: 'error', message: error.message || 'Failed to fetch report' });
  }
};

// GET /admin/reports/prefill — super_admin only; seeds the Add Report form
// with last month's investment pattern/members and nav.
const getPrefill = async (req, res) => {
  try {
    const prefill = await monthlyReportService.getPrefill();
    return res.status(200).json({ status: 'success', data: prefill });
  } catch (error) {
    console.error('Get Report Prefill Error:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch prefill data' });
  }
};

module.exports = { createReport, updateReport, deleteReport, getReports, getReportById, getPrefill };
