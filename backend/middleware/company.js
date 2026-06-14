// backend/middleware/company.js

module.exports = (req, res, next) => {
  const companyId =
    req.headers["x-company-id"] ||
    req.query.companyId ||
    req.body.companyId;

  if (!companyId) {
    return res.status(400).json({
      success: false,
      message:
        "Please select a company (BVM INDIA or BVM WORLD PVT. LTD.)."
    });
  }

  req.companyId = Number(companyId);

  next();
};
