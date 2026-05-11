const express = require("express");
const router = express.Router();
const PDF = require("../models/PDF");
const path = require("path");
const {
  extractPDFText,
  generateSummary,
  extractKeyPoints,
  generateQuiz,
  chatWithPDF,
} = require("../utils/gemini");

// Get existing analysis
router.get("/analysis/:id", async (req, res) => {
  try {
    const pdf = await PDF.findById(req.params.id);
    if (!pdf) return res.status(404).json({ message: "PDF not found" });

    if (!pdf.summary) {
      return res.status(404).json({ message: "No analysis found" });
    }

    res.json({
      summary: pdf.summary,
      keyPoints: pdf.keyPoints,
      textLength: pdf.textLength,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to get analysis" });
  }
});

// Analyze PDF
router.post("/analyze/:id", async (req, res) => {
  try {
    const pdf = await PDF.findById(req.params.id);
    if (!pdf) return res.status(404).json({ message: "PDF not found" });

    console.log("📄 Analyzing PDF:", pdf.fileName);

    const text = await extractPDFText(pdf.filePath);
    console.log(`✅ Extracted ${text.length} characters`);

    const summary = await generateSummary(text);
    const keyPoints = await extractKeyPoints(text);

    pdf.summary = summary;
    pdf.keyPoints = keyPoints;
    pdf.textLength = text.length;

    if (!pdf.savedFileName && pdf.filePath) {
      pdf.savedFileName = path.basename(pdf.filePath);
    }

    await pdf.save();

    res.json({ summary, keyPoints, textLength: text.length });
  } catch (error) {
    console.error("❌ Analysis error:", error);
    res.status(500).json({ message: error.message || "Analysis failed" });
  }
});

// ✅ Generate Quiz (FIXED)
router.post("/quiz/:id", async (req, res) => {
  try {
    let { numberOfQuestions = 5 } = req.body;

    numberOfQuestions = Math.min(
      Math.max(parseInt(numberOfQuestions) || 5, 1),
      10
    );

    const pdf = await PDF.findById(req.params.id);
    if (!pdf) {
      return res.status(404).json({ message: "PDF not found" });
    }

    console.log("🔄 Generating quiz for:", pdf.fileName);

    const text = await extractPDFText(pdf.filePath);

    if (!text || text.length < 300) {
      return res.status(400).json({
        message: "PDF does not contain enough readable text for quiz generation",
      });
    }

    const quiz = await generateQuiz(text, numberOfQuestions);

    if (!quiz || quiz.length === 0) {
      return res.status(500).json({
        message: "Quiz generation failed",
      });
    }

    console.log(`✅ Generated ${quiz.length} questions`);

    res.json({ quiz });
  } catch (error) {
    console.error("❌ Quiz error:", error);
    res.status(500).json({ message: error.message || "Quiz failed" });
  }
});

// Chat with PDF
router.post("/chat/:id", async (req, res) => {
  try {
    const { question, conversationHistory = [] } = req.body;
    const pdf = await PDF.findById(req.params.id);
    if (!pdf) return res.status(404).json({ message: "PDF not found" });

    if (!question || !question.trim()) {
      return res.status(400).json({ message: "Question is required" });
    }

    console.log("💬 Chat question for:", pdf.fileName);

    const text = await extractPDFText(pdf.filePath);
    const answer = await chatWithPDF(text, question, conversationHistory);

    res.json({ answer });
  } catch (error) {
    console.error("❌ Chat error:", error);
    res.status(500).json({ message: error.message || "Chat failed" });
  }
});

module.exports = router;
