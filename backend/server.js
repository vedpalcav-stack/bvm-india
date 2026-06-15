require("dotenv").config();

const express = require("express");
const app = express();

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "BVM ERP API Running"
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
