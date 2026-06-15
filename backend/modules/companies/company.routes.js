const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  res.json({ message: "Companies API working" });
});

module.exports = router;
