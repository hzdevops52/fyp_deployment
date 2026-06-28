const mongoose = require("mongoose");

const PDFSchema = new mongoose.Schema(
  {
    fileName: { type: String, required: true },
    originalFormat: { type: String, default: "pdf" },
    savedFileName: { type: String }, // ✅ Remove required
    title: { type: String, required: true },
    filePath: { type: String, required: true },
    fileSize: { type: Number },
    subject: { type: String, default: "General" },
    pages: { type: Number, default: 1 },
    summary: { type: String },
    keyPoints: { type: String },
    textLength: { type: Number },
    extractedText: { type: String, default: null },
    downloads: { type: Number, default: 0 },
    sourceId: { type: mongoose.Schema.Types.ObjectId, ref: "PDF", default: null },
    templateUsed: { type: String, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PDF", PDFSchema);