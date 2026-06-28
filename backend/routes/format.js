const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");
const PDF = require("../models/PDF");
const { extractPDFText, callGroqForTemplate } = require("../utils/gemini");

const TEMPLATES = {
  report: {
    title: "Restructure the following content into a formal REPORT with these sections: Title, Introduction, Main Body (with clear sub-headings), and Conclusion. Use professional academic language.",
  },
  resume: {
    title: "Restructure the following content into a RESUME/CV format with sections: Summary, Key Skills, Experience/Details, and Education (only include sections that make sense given the content). Use concise, action-oriented language.",
  },
  notes: {
    title: "Restructure the following content into clean STUDY NOTES with: a short overview, then organized bullet points grouped under clear sub-headings, highlighting key terms.",
  },
};

router.post("/:id", async (req, res) => {
  try {
    const { template } = req.body;
    if (!TEMPLATES[template]) {
      return res.status(400).json({ error: "Invalid template. Use: report, resume, or notes" });
    }

    const sourcePdf = await PDF.findById(req.params.id);
    if (!sourcePdf) return res.status(404).json({ error: "Source PDF not found" });

    const text = await extractPDFText(sourcePdf.filePath);
    if (!text || text.length < 100) {
      return res.status(400).json({ error: "Not enough readable text to format" });
    }

    const prompt = `${TEMPLATES[template].title}\n\nReturn ONLY the restructured content as plain text with clear section headers in CAPS. No markdown, no asterisks.\n\nContent:\n${text.slice(0, 6000)}`;

    const formattedText = await callGroqForTemplate(prompt);

    const outputDir = path.join(__dirname, "../uploads");
    const outputFileName = `${Date.now()}-formatted-${template}.pdf`;
    const outputPath = path.join(outputDir, outputFileName);

    await new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const stream = fs.createWriteStream(outputPath);
      doc.pipe(stream);

      doc.fontSize(20).font("Helvetica-Bold").text(
        `${sourcePdf.title} (${template.charAt(0).toUpperCase() + template.slice(1)})`,
        { align: "center" }
      );
      doc.moveDown(1.5);

      const lines = formattedText.split("\n");
      lines.forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed) {
          doc.moveDown(0.5);
          return;
        }
        const isHeading = trimmed === trimmed.toUpperCase() && trimmed.length < 60;
        if (isHeading) {
          doc.moveDown(0.5);
          doc.fontSize(14).font("Helvetica-Bold").text(trimmed);
          doc.moveDown(0.3);
        } else {
          doc.fontSize(11).font("Helvetica").text(trimmed, { align: "justify" });
        }
      });

      doc.end();
      stream.on("finish", resolve);
      stream.on("error", reject);
    });

    const fileSize = fs.statSync(outputPath).size;

    const formattedPdf = await PDF.create({
      fileName: `${sourcePdf.title}-${template}.pdf`,
      originalFormat: "pdf",
      savedFileName: outputFileName,
      title: `${sourcePdf.title} (${template})`,
      filePath: outputPath,
      fileSize,
      subject: sourcePdf.subject,
      pages: 1,
      sourceId: sourcePdf._id,
      templateUsed: template,
    });

    res.status(201).json({
      success: true,
      pdf: {
        _id: formattedPdf._id,
        title: formattedPdf.title,
        templateUsed: formattedPdf.templateUsed,
      },
    });
  } catch (err) {
    console.error("Format error:", err);
    res.status(500).json({ error: err.message || "Formatting failed" });
  }
});

module.exports = router;
