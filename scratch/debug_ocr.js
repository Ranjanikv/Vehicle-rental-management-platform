import fs from "fs";
import path from "path";
import { createWorker } from "tesseract.js";
import { processLicenceDocument, parseLicenceText, extractTextFromPdf } from "../lib/ocr.js";

async function debugFile(filename) {
  const filePath = path.join(process.cwd(), "public", "uploads", "licences", filename);
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }

  const startTotal = Date.now();
  console.log(`\n========================================`);
  console.log(`DEBUG FILE: ${filename}`);
  console.log(`FILE SIZE: ${fs.statSync(filePath).size} bytes`);

  const fileBuffer = fs.readFileSync(filePath);
  const ext = path.extname(filename).toLowerCase();
  const mimeType = ext === ".pdf" ? "application/pdf" : ext === ".png" ? "image/png" : "image/jpeg";

  if (ext !== ".pdf") {
    // 1. Raw Tesseract Test for Images
    console.log(`--- STAGE C/D: RAW OCR ENGINE TEST (IMAGE) ---`);
    const t0 = Date.now();
    let rawText = "";
    try {
      const worker = await createWorker("eng");
      const ocrRes = await worker.recognize(fileBuffer);
      await worker.terminate();
      rawText = ocrRes.data.text || "";
      console.log(`RAW OCR TIME: ${Date.now() - t0} ms`);
      console.log(`RAW OCR TEXT LENGTH: ${rawText.length} characters`);
      console.log(`RAW OCR SAMPLE LABELS/KEYWORDS DETECTED:`, 
        rawText.split(/\s+/).filter(w => ["LICENCE", "NAME", "DOB", "DL", "DRIVING", "INDIA", "UNION", "ISSUE", "VALID"].includes(w.toUpperCase()))
      );
    } catch (err) {
      console.error("RAW Tesseract OCR Error:", err);
    }
  } else {
    console.log(`--- STAGE C/D: PDF TEXT EXTRACTION TEST ---`);
    const t0 = Date.now();
    const pdfRes = await extractTextFromPdf(fileBuffer);
    console.log(`PDF EXTRACT TIME: ${Date.now() - t0} ms`);
    console.log(`PDF EXTRACT SUCCESS: ${pdfRes.success}`);
    console.log(`PDF TEXT LENGTH: ${pdfRes.text ? pdfRes.text.length : 0} characters`);
  }

  // 2. processLicenceDocument Test
  console.log(`--- STAGE E/F/G/H/I: FULL PIPELINE TEST ---`);
  const t1 = Date.now();
  try {
    const res = await processLicenceDocument(fileBuffer, mimeType, filename, "Test User");
    console.log(`PIPELINE TIME: ${Date.now() - t1} ms`);
    console.log(`PARSED RESULT:`, {
      readable: res.parsed.readable,
      readabilityStatus: res.parsed.readabilityStatus,
      licenseNo: res.parsed.licenseNo,
      dob: res.parsed.dob,
      validFrom: res.parsed.validFrom,
      validTo: res.parsed.validTo,
      extractedName: res.parsed.extractedName,
    });
  } catch (err) {
    console.error("Pipeline Error:", err);
  }

  console.log(`TOTAL REQUEST TIME: ${Date.now() - startTotal} ms`);
}

async function run() {
  const dir = path.join(process.cwd(), "public", "uploads", "licences");
  const files = fs.readdirSync(dir);
  console.log(`Found ${files.length} uploaded files in ${dir}`);
  for (const file of files) {
    await debugFile(file);
  }
}

run();
