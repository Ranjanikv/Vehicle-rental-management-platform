
import fs from "fs";
import path from "path";
import { createWorker } from "tesseract.js";

/**
 * Normalizes string for name matching
 */
export function normalizeText(str) {
  if (!str || typeof str !== "string") return "";
  return str.toLowerCase().replace(/[^a-z0-9]/g, "").trim();
}

/**
 * Calculates age in years from a Date object or YYYY-MM-DD string
 */
export function calculateAge(dobStr) {
  if (!dobStr) return null;
  const dob = new Date(dobStr);
  if (isNaN(dob.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();

  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    age--;
  }

  return age;
}

/**
 * Converts month abbreviations to numeric month string
 */
function parseMonthText(monthStr) {
  const months = {
    jan: "01", feb: "02", mar: "03", apr: "04",
    may: "05", jun: "06", jul: "07", aug: "08",
    sep: "09", oct: "10", nov: "11", dec: "12"
  };

  const key = monthStr.toLowerCase().substring(0, 3);
  return months[key] || null;
}

/**
 * Normalizes raw date string into YYYY-MM-DD
 */
export function normalizeDateString(dateStr) {
  if (!dateStr) return null;
  const str = dateStr.trim();

  const monthTextMatch = str.match(
    /(\d{1,2})[\s\/\-.]([A-Za-z]{3,9})[\s\/\-.](\d{4})/
  );

  if (monthTextMatch) {
    const day = monthTextMatch[1].padStart(2, "0");
    const month = parseMonthText(monthTextMatch[2]);
    const year = monthTextMatch[3];

    if (month) return `${year}-${month}-${day}`;
  }

  if (/^\d{4}[\/\-.]\d{2}[\/\-.]\d{2}$/.test(str)) {
    const parts = str.split(/[\/\-.]/);
    return `${parts[0]}-${parts[1].padStart(2, "0")}-${parts[2].padStart(2, "0")}`;
  }

  if (/^\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{4}$/.test(str)) {
    const parts = str.split(/[\/\-.]/);
    return `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
  }

  return null;
}

/**
 * Fixes common OCR substitutions in licence numbers
 */
export function fixOcrDlNumber(rawDl) {
  if (!rawDl) return null;

  let str = rawDl.toUpperCase().trim().replace(/[^A-Z0-9\/-]/g, "");
  const stateCodeMatch = str.match(/^([A-Z]{2})([A-Z0-9\/-]+)$/);

  if (stateCodeMatch) {
    const state = stateCodeMatch[1];
    let rest = stateCodeMatch[2];

    rest = rest
      .replace(/O/g, "0")
      .replace(/I/g, "1")
      .replace(/L/g, "1")
      .replace(/S/g, "5")
      .replace(/B/g, "8")
      .replace(/Z/g, "2");

    str = state + rest;
  }

  return str;
}

/**
 * Parses raw text extracted from image or PDF
 */
export function parseLicenceText(text, userFullName = "") {
  if (!text || typeof text !== "string") {
    return {
      readable: false,
      readabilityStatus: "UNREADABLE",
      licenseNo: null,
      dob: null,
      validFrom: null,
      validTo: null,
      extractedName: null,
      nameMatched: false,
      age: null,
      isAdult: false,
      rawText: ""
    };
  }

  const rawText = text;
  let licenseNo = null;

  const dlRegexes = [
    /(?:LICENCE|LICENSE|DL)\s*(?:NO|NUMBER|\.|:)?\s*[:-]?\s*([A-Z0-9/-]{6,25})/i,
    /\b([A-Z]{2}[-\s]?[0-9OISBZ]{2}[-\s]?[0-9OISBZ]{4}[-\s]?[0-9OISBZ]{7})\b/i,
    /\b([A-Z]{2}[-\s]?[0-9OISBZ]{2}[-\s]?[0-9OISBZ]{11})\b/i,
    /\b([A-Z]{2}[-\s]?[0-9OISBZ]{2}[/-][0-9OISBZ]{4}[/-][0-9OISBZ]{7})\b/i,
    /\b([A-Z]{2}[0-9OISBZ]{12,16})\b/i,
    /\b([A-Z]{2}[/-]?[0-9OISBZ]{2,4}[/-]?[0-9OISBZ]{4,12})\b/i
  ];

  for (const regex of dlRegexes) {
    const match = rawText.match(regex);

    if (match && match[1]) {
      const fixed = fixOcrDlNumber(match[1]);

      if (fixed && fixed.length >= 6) {
        licenseNo = fixed;
        break;
      }
    }
  }

  const allDates = [];
  const numericDateRegex =
    /\b(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{4}|\d{4}[\/\-.]\d{1,2}[\/\-.]\d{1,2})\b/g;

  let dMatch;

  while ((dMatch = numericDateRegex.exec(rawText)) !== null) {
    const norm = normalizeDateString(dMatch[1]);

    if (norm && !isNaN(new Date(norm).getTime()) && !allDates.includes(norm)) {
      allDates.push(norm);
    }
  }

  const monthTextRegex =
    /\b(\d{1,2}[\s\/\-.][A-Za-z]{3,9}[\s\/\-.]\d{4})\b/g;

  while ((dMatch = monthTextRegex.exec(rawText)) !== null) {
    const norm = normalizeDateString(dMatch[1]);

    if (norm && !isNaN(new Date(norm).getTime()) && !allDates.includes(norm)) {
      allDates.push(norm);
    }
  }

  let dob = null;

  const dobPrefixMatch = rawText.match(
    /(?:DOB|BIRTH|DATE\s*OF\s*BIRTH|D\.?O\.?B\.?)\s*[:-]?\s*(\d{1,2}[\/\-.][A-Za-z0-9]{2,9}[\/\-.]\d{4})/i
  );

  if (dobPrefixMatch && dobPrefixMatch[1]) {
    dob = normalizeDateString(dobPrefixMatch[1]);
  }

  const uniqueDates = Array.from(new Set(allDates)).sort();

  if (!dob && uniqueDates.length > 0) {
    const candidateDob = uniqueDates.find((d) => {
      const age = calculateAge(d);
      return age !== null && age >= 18;
    });

    dob = candidateDob || uniqueDates[0];
  }

  let validFrom = null;
  let validTo = null;

  const validityRangeRegex =
    /(?:VALIDITY|VALID|VALID\s*PERIOD|PERIOD)\s*[:-]?\s*(\d{1,2}[\/\-.][A-Za-z0-9]{2,9}[\/\-.]\d{4})\s*(?:TO|-)\s*(\d{1,2}[\/\-.][A-Za-z0-9]{2,9}[\/\-.]\d{4})/i;

  const rangeMatch = rawText.match(validityRangeRegex);

  if (rangeMatch && rangeMatch[1] && rangeMatch[2]) {
    const fromNorm = normalizeDateString(rangeMatch[1]);
    const toNorm = normalizeDateString(rangeMatch[2]);

    if (fromNorm && toNorm && fromNorm !== toNorm) {
      validFrom = fromNorm;
      validTo = toNorm;
    }
  }

  if (!validFrom) {
    const validFromPatterns = [
      /(?:DATE\s*OF\s*ISSUE|ISSUE\s*DATE|ISSUED\s*ON|DATE\s*ISSUED|ISSUED|D\.?O\.?I\.?|VALID\s*FROM|EFFECTIVE\s*FROM|W\.?E\.?F\.?)\s*[:-]?\s*(\d{1,2}[\/\-.][A-Za-z0-9]{2,9}[\/\-.]\d{4})/i,
      /\bFROM\s*[:-]?\s*(\d{1,2}[\/\-.][A-Za-z0-9]{2,9}[\/\-.]\d{4})/i
    ];

    for (const pattern of validFromPatterns) {
      const match = rawText.match(pattern);

      if (match && match[1]) {
        const norm = normalizeDateString(match[1]);

        if (norm) {
          validFrom = norm;
          break;
        }
      }
    }
  }

  if (!validTo) {
    const validToPatterns = [
      /(?:DATE\s*OF\s*EXPIRY|EXPIRY\s*DATE|EXPIRY|EXPIRES|VALID\s*TILL|VALID\s*TO|VALID\s*UPTO|D\.?O\.?E\.?|VALIDITY(?:\s*\(?[A-Z]{1,3}\)?)?|NT|TR)\s*[:-]?\s*(\d{1,2}[\/\-.][A-Za-z0-9]{2,9}[\/\-.]\d{4})/i,
      /\bTO\s*[:-]?\s*(\d{1,2}[\/\-.][A-Za-z0-9]{2,9}[\/\-.]\d{4})/i
    ];

    for (const pattern of validToPatterns) {
      const match = rawText.match(pattern);

      if (match && match[1]) {
        const norm = normalizeDateString(match[1]);

        if (norm) {
          validTo = norm;
          break;
        }
      }
    }
  }

  const validityCandidates = uniqueDates.filter((date) => date !== dob);

  if (validFrom && validTo) {
    if (validFrom === validTo) {
      const todayIso = new Date().toISOString().split("T")[0];

      if (validTo > todayIso) {
        validFrom = null;
      } else {
        validTo = null;
      }
    } else if (new Date(validTo) < new Date(validFrom)) {
      const temp = validFrom;
      validFrom = validTo;
      validTo = temp;
    }
  }

  if (!validFrom) {
    if (validTo) {
      const candidates = validityCandidates.filter(
        (date) => date < validTo && (!dob || date > dob)
      );

      if (candidates.length > 0) {
        validFrom = candidates[candidates.length - 1];
      }
    } else if (validityCandidates.length >= 2) {
      validFrom = validityCandidates[0];
    } else if (validityCandidates.length === 1) {
      const todayIso = new Date().toISOString().split("T")[0];

      if (validityCandidates[0] <= todayIso) {
        validFrom = validityCandidates[0];
      }
    }
  }

  if (!validTo) {
    if (validFrom) {
      const candidates = validityCandidates.filter((date) => date > validFrom);

      if (candidates.length > 0) {
        validTo = candidates[candidates.length - 1];
      }
    } else if (validityCandidates.length >= 2) {
      validTo = validityCandidates[validityCandidates.length - 1];
    } else if (validityCandidates.length === 1) {
      const todayIso = new Date().toISOString().split("T")[0];

      if (validityCandidates[0] > todayIso) {
        validTo = validityCandidates[0];
      }
    }
  }

  if (validFrom && validTo && validFrom === validTo) {
    validTo = null;
  }

  if (validFrom && validTo && new Date(validTo) <= new Date(validFrom)) {
    validTo = null;
  }

  const age = calculateAge(dob);
  const isAdult = age !== null && age >= 18;

  let extractedName = null;

  const namePrefixMatch = rawText.match(
    /(?:NAME|HOLDER)\s*[:-]?\s*([A-Za-z\s]{3,35})/i
  );

  if (namePrefixMatch && namePrefixMatch[1]) {
    extractedName = namePrefixMatch[1].trim();
  }

  const normalizedUser = normalizeText(userFullName);
  const normalizedText = normalizeText(rawText);

  let nameMatched = false;

  if (normalizedUser && normalizedText) {
    const safeUserName = typeof userFullName === "string" ? userFullName : "";
    const nameWords = safeUserName.toLowerCase().split(/\s+/).filter((word) => word.length > 2);

    if (nameWords.length > 0) {
      const matches = nameWords.filter((word) => normalizedText.includes(word));
      nameMatched = matches.length / nameWords.length >= 0.5;
    }
  }

  const hasLicenceNo = Boolean(licenseNo);
  const hasDob = Boolean(dob);
  const hasValidFrom = Boolean(validFrom);
  const hasValidTo = Boolean(validTo);
  const hasName = Boolean(extractedName || (nameMatched && userFullName));

  const fieldsCount = [
    hasLicenceNo,
    hasDob,
    hasValidFrom,
    hasValidTo,
    hasName
  ].filter(Boolean).length;

  let readabilityStatus = "UNREADABLE";

  if (fieldsCount >= 3) {
    readabilityStatus = "READABLE";
  } else if (fieldsCount >= 1 || rawText.trim().length > 20) {
    readabilityStatus = "PARTIALLY_READABLE";
  }

  return {
    readable: readabilityStatus === "READABLE",
    readabilityStatus,
    licenseNo: licenseNo || null,
    dob: dob || null,
    validFrom: validFrom || null,
    validTo: validTo || null,
    extractedName: extractedName || null,
    nameMatched,
    age: age || null,
    isAdult,
    fieldsCount,
    rawText: rawText.substring(0, 500)
  };
}

/**
 * Extracts text from PDF files in serverless environments.
 */
export async function extractTextFromPdf(pdfBuffer) {
  let parser = null;

  try {
    const { CanvasFactory } = await import("pdf-parse/worker");
    const pdfParseMod = await import("pdf-parse");

    if (typeof pdfParseMod.PDFParse !== "function") {
      throw new Error(
        "The installed pdf-parse version does not expose the expected PDFParse interface."
      );
    }

    parser = new pdfParseMod.PDFParse({
      data: pdfBuffer,
      CanvasFactory
    });

    const result = await parser.getText();
    const text = result?.text?.trim() || "";

    return {
      success: text.length > 20,
      text,
      isScanned: text.length <= 20
    };
  } catch (error) {
    console.error("[PDF EXTRACTION ERROR]", error);

    return {
      success: false,
      text: "",
      isScanned: true,
      error: error.message
    };
  } finally {
    if (parser && typeof parser.destroy === "function") {
      try {
        await parser.destroy();
      } catch (error) {
        console.warn("[PDF PARSER CLEANUP WARNING]", error.message);
      }
    }
  }
}

/**
 * Main OCR and document processor for images and PDFs
 */
export async function processLicenceDocument(
  fileBuffer,
  fileMimeType = "",
  originalFilename = "",
  userFullName = ""
) {
  const isPdf =
    fileMimeType === "application/pdf" ||
    originalFilename.toLowerCase().endsWith(".pdf");

  let extractedRawText = "";
  let isPdfDocument = false;

  const ocrStartTime = Date.now();

  if (isPdf) {
    isPdfDocument = true;

    const pdfResult = await extractTextFromPdf(fileBuffer);
    extractedRawText = pdfResult.text || "";
  } else {
    let worker = null;

    try {
      const workerPath = path.join(
        process.cwd(),
        "node_modules",
        "tesseract.js",
        "src",
        "worker-script",
        "node",
        "index.js"
      );

      const ocrPromise = (async () => {
        worker = await createWorker("eng", 1, {
          workerPath: fs.existsSync(workerPath) ? workerPath : undefined
        });

        const ocrRes = await worker.recognize(fileBuffer);
        return ocrRes.data ? ocrRes.data.text || "" : "";
      })();

      const timeoutPromise = new Promise((resolve) =>
        setTimeout(() => resolve("TIMEOUT"), 10000)
      );

      const result = await Promise.race([ocrPromise, timeoutPromise]);

      if (result === "TIMEOUT") {
        console.warn(
          "[OCR WARNING] Tesseract OCR recognition timed out after 10000ms. Continuing gracefully."
        );
      } else {
        extractedRawText = result || "";
      }
    } catch (error) {
      console.error("[OCR ERROR] Tesseract engine error:", error.message);
    } finally {
      if (worker) {
        try {
          await worker.terminate();
        } catch (error) {
          console.warn("[OCR CLEANUP WARNING]", error.message);
        }
      }
    }
  }

  const ocrDuration = Date.now() - ocrStartTime;
  const parsed = parseLicenceText(extractedRawText, userFullName);

  return {
    success: true,
    isPdf: isPdfDocument,
    ocrDurationMs: ocrDuration,
    rawTextLength: extractedRawText.length,
    text: extractedRawText,
    parsed
  };
}
