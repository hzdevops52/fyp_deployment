const Groq = require("groq-sdk");
const fs = require("fs");
const pdfParse = require("pdf-parse");
const { fromPath } = require("pdf2pic");
const Tesseract = require("tesseract.js");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const callGroq = async (prompt) => {
  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.1-8b-instant",
      temperature: 0.6,
      max_tokens: 1024,
    });
    return completion.choices[0]?.message?.content || "";
  } catch (err) {
    console.error("❌ Groq error:", err.message);
    throw new Error(`AI processing failed: ${err.message}`);
  }
};

const extractPDFText = async (pdfPath, maxPages = 5) => {
  try {
    const buffer = fs.readFileSync(pdfPath);
    const parsed = await pdfParse(buffer);
    if (parsed.text && parsed.text.trim().length > 100) {
      console.log(`✅ PDF text extracted (${parsed.text.length} chars)`);
      return parsed.text.slice(0, 15000);
    }
    console.log("⚠️ No text found — using OCR");
    const tempDir = `/tmp/pdf-ocr-${Date.now()}`;
    fs.mkdirSync(tempDir, { recursive: true });
    const convert = fromPath(pdfPath, {
      density: 150,
      saveFilename: "page",
      savePath: tempDir,
      format: "png",
      width: 1200,
      height: 1600,
    });
    let ocrText = "";
    const pages = Math.min(maxPages, 3);
    for (let i = 1; i <= pages; i++) {
      try {
        const page = await convert(i);
        const result = await Tesseract.recognize(page.path, "eng", { logger: () => {} });
        ocrText += result.data.text + "\n\n";
        await sleep(500);
      } catch { break; }
    }
    fs.rmSync(tempDir, { recursive: true, force: true });
    return ocrText.slice(0, 15000);
  } catch (err) {
    console.error("❌ PDF extraction error:", err);
    throw new Error("Failed to extract text from PDF");
  }
};

const generateSummary = async (text) => {
  const prompt = `Summarize the following text in exactly 5 sentences:\n\n${text.slice(0, 4000)}`;
  return callGroq(prompt);
};

const extractKeyPoints = async (text) => {
  const prompt = `List 5 key points from the following text as bullet points:\n\n${text.slice(0, 4000)}`;
  return callGroq(prompt);
};

const generateQuiz = async (text, numberOfQuestions = 5) => {
  const prompt = `Create ${numberOfQuestions} multiple choice questions from this text.
Return ONLY a JSON array, no extra text:
[{"question":"...","options":["A","B","C","D"],"correctAnswer":0,"explanation":"..."}]

Text:
${text.slice(0, 4000)}`;
  try {
    const response = await callGroq(prompt);
    const cleaned = response.replace(/\`\`\`json/g, "").replace(/\`\`\`/g, "").trim();
    const match = cleaned.match(/\[[\s\S]*\]/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      const valid = parsed.filter(q =>
        q.question && Array.isArray(q.options) &&
        q.options.length === 4 && typeof q.correctAnswer === "number"
      );
      if (valid.length > 0) return valid.slice(0, numberOfQuestions);
    }
    throw new Error("Invalid quiz format");
  } catch (error) {
    console.error("❌ Quiz error:", error.message);
    throw new Error("Quiz generation failed");
  }
};

const chatWithPDF = async (text, userQuestion) => {
  const prompt = `Answer the question using ONLY the text below.\n\nText:\n${text.slice(0, 4000)}\n\nQuestion:\n${userQuestion}\n\nAnswer:`;
  return callGroq(prompt);
};

const callGroqForTemplate = async (prompt) => {
  return callGroq(prompt);
};

module.exports = { extractPDFText, generateSummary, extractKeyPoints, generateQuiz, chatWithPDF, callGroqForTemplate };
