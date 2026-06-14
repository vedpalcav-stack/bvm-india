const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

exports.generatePdf = (
  title,
  data,
  fileName
) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        margin: 50,
      });

      const filePath = path.join(
        __dirname,
        "..",
        "uploads",
        fileName
      );

      const stream =
        fs.createWriteStream(filePath);

      doc.pipe(stream);

      doc
        .fontSize(22)
        .text(title, {
          align: "center",
        });

      doc.moveDown();

      Object.entries(data).forEach(
        ([key, value]) => {
          doc
            .fontSize(12)
            .text(
              `${key}: ${value ?? ""}`
            );
        }
      );

      doc.end();

      stream.on("finish", () => {
        resolve(filePath);
      });

      stream.on("error", reject);
    } catch (err) {
      reject(err);
    }
  });
};
