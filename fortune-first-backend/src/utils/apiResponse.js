/**
 * Standardised API Response wrapper.
 * Ensures every endpoint returns a consistent JSON structure.
 */
class ApiResponse {
  /**
   * @param {number} statusCode - HTTP status code
   * @param {*}      data       - Response payload
   * @param {string} message    - Human-readable message
   */
  constructor(statusCode, data, message = 'Success') {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.success = statusCode < 400;
  }

  /**
   * Sends the response through an Express `res` object.
   * @param {import('express').Response} res
   */
  send(res) {
    return res.status(this.statusCode).json({
      success: this.success,
      message: this.message,
      data: this.data,
    });
  }

  // ── Common factory helpers ───────────────────────────────────

  static ok(res, data, message = 'Success') {
    return new ApiResponse(200, data, message).send(res);
  }

  static created(res, data, message = 'Created successfully') {
    return new ApiResponse(201, data, message).send(res);
  }

  static noContent(res, message = 'Deleted successfully') {
    return res.status(204).json({ success: true, message });
  }
}

module.exports = ApiResponse;
