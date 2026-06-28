const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const pdfParse = require("pdf-parse");
const PDF = require("../models/PDF");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + file.originalname.replace(/\s+/g, '-');
    cb(null, uniqueName);
  },
});

const ALLOWED_MIMETYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
];

const ALLOWED_EXTENSIONS = [".pdf", ".pptx", ".ppt", ".docx", ".doc"];

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ALLOWED_MIMETYPES.includes(file.mimetype) || ALLOWED_EXTENSIONS.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF, PPT/PPTX, and DOC/DOCX files allowed"));
    }
  },
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
});

const { execSync } = require("child_process");
const mammoth = require("mammoth");
const officeParser = require("officeparser");

const convertToPDF = (filePath, outputDir) => {
  execSync(`libreoffice --headless --convert-to pdf --outdir "${outputDir}" "${filePath}" `, {
    timeout: 60000,
  });
  const base = path.basename(filePath, path.extname(filePath));
  return path.join(outputDir, base + ".pdf");
};

const extractOfficeText = async (filePath, format) => {
  try {
    if (format === "docx") {
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value || "";
    }
    if (format === "pptx") {
      const result = await officeParser.parseOffice(filePath);
      return result.toText ? result.toText() : "";
    }
    return "";
  } catch (err) {
    console.error("Office text extraction error:", err.message);
    return "";
  }
};

const getFormatFromMimetype = (mimetype, originalName) => {
  const ext = path.extname(originalName || "").toLowerCase();
  if (mimetype === "application/pdf" || ext === ".pdf") return "pdf";
  if (mimetype.includes("presentation") || ext === ".pptx" || ext === ".ppt") return "pptx";
  if (mimetype.includes("wordprocessingml") || mimetype === "application/msword" || ext === ".docx" || ext === ".doc") return "docx";
  return "pdf";
};

// Get all PDFs
router.get("/", async (req, res) => {
  try {
    const pdfs = await PDF.find().sort({ createdAt: -1 });
    res.json(pdfs);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch PDFs" });
  }
});

// Get PDF by ID
router.get("/:id", async (req, res) => {
  try {
    const pdf = await PDF.findById(req.params.id);
    if (!pdf) return res.status(404).json({ error: "PDF not found" });
    res.json(pdf);
  } catch (error) {
    res.status(500).json({ error: "Failed to get PDF" });
  }
});

// Upload PDF
router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const { title, subject } = req.body;
    const originalFormat = getFormatFromMimetype(req.file.mimetype, req.file.originalname);

    let finalFilePath = req.file.path;
    let finalFileName = req.file.filename;
    let finalSize = req.file.size;

    let cleanExtractedText = null;

    // Convert PPT/Word to PDF using LibreOffice
    if (originalFormat !== "pdf") {
      try {
        // Extract clean text from the ORIGINAL office file first (before conversion/deletion)
        cleanExtractedText = await extractOfficeText(req.file.path, originalFormat);

        const uploadDir = path.dirname(req.file.path);
        const convertedPath = convertToPDF(req.file.path, uploadDir);

        if (fs.existsSync(convertedPath)) {
          fs.unlinkSync(req.file.path); // remove original office file
          finalFilePath = convertedPath;
          finalFileName = path.basename(convertedPath);
          finalSize = fs.statSync(convertedPath).size;
        } else {
          throw new Error("Conversion output not found");
        }
      } catch (convErr) {
        console.error("Conversion error:", convErr.message);
        return res.status(500).json({ error: "Failed to convert file to PDF: " + convErr.message });
      }
    }

    // Get page count
    let pageCount = 1;
    try {
      const buffer = fs.readFileSync(finalFilePath);
      const parsed = await pdfParse(buffer);
      pageCount = parsed.numpages || 1;
    } catch (err) {
      console.log("Could not get page count:", err.message);
    }

    const pdf = await PDF.create({
      fileName: req.file.originalname,
      originalFormat,
      savedFileName: finalFileName,
      title: title || req.file.originalname.replace(/\.(pdf|pptx?|docx?)$/i, ""),
      filePath: finalFilePath,
      fileSize: finalSize,
      subject: subject || "General",
      pages: pageCount,
      extractedText: cleanExtractedText,
    });

    res.status(201).json({
      success: true,
      pdf: {
        _id: pdf._id,
        fileName: pdf.fileName,
        originalFormat: pdf.originalFormat,
        savedFileName: pdf.savedFileName,
        title: pdf.title,
        fileSize: pdf.fileSize,
        pages: pdf.pages,
      },
    });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Download PDF
router.get("/download/:id", async (req, res) => {
  try {
    const pdf = await PDF.findById(req.params.id);
    if (!pdf) return res.status(404).json({ error: "PDF not found" });

    // Check if file exists
    if (!fs.existsSync(pdf.filePath)) {
      return res.status(404).json({ error: "File not found on server" });
    }

    // Update savedFileName if missing (for old PDFs)
    if (!pdf.savedFileName && pdf.filePath) {
      pdf.savedFileName = path.basename(pdf.filePath);
      await pdf.save();
    }

    // Increment download count
    pdf.downloads += 1;
    await pdf.save();

    // Send file with original name
    res.download(pdf.filePath, pdf.fileName, (err) => {
      if (err) {
        console.error("Download error:", err);
        if (!res.headersSent) {
          res.status(500).json({ error: "Download failed" });
        }
      }
    });
  } catch (error) {
    console.error("Download error:", error);
    res.status(500).json({ error: "Download failed" });
  }
});

// View PDF (serve file)
router.get("/view/:id", async (req, res) => {
  try {
    const pdf = await PDF.findById(req.params.id);
    if (!pdf) return res.status(404).json({ error: "PDF not found" });

    if (!fs.existsSync(pdf.filePath)) {
      return res.status(404).json({ error: "File not found" });
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${pdf.fileName}"`);
    
    const fileStream = fs.createReadStream(pdf.filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error("View error:", error);
    res.status(500).json({ error: "Failed to view PDF" });
  }
});

// Delete PDF
router.delete("/:id", async (req, res) => {
  try {
    const pdf = await PDF.findById(req.params.id);
    if (!pdf) return res.status(404).json({ error: "PDF not found" });

    if (fs.existsSync(pdf.filePath)) {
      fs.unlinkSync(pdf.filePath);
    }

    await pdf.deleteOne();
    res.json({ success: true, message: "PDF deleted" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete PDF" });
  }
});

module.exports = router;