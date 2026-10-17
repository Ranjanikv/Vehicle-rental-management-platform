import { writeFile, mkdir } from "fs/promises";
import path from "path";
import mongoose from "mongoose";
import connectToDatabase from "@/lib/mongodb";
import User from "@/lib/models/User";
import { getAuthUser } from "@/lib/auth";
import { processLicenceDocument } from "@/lib/ocr";

export async function POST(req) {
  const requestStartTime = Date.now();
  let fileSaveDuration = 0;
  let ocrDuration = 0;
  let dbDuration = 0;

  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return Response.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string") {
      return Response.json(
        { success: false, message: "Driving licence file is required" },
        { status: 400 }
      );
    }

    // 1. File Extension & MIME Type Validation
    const fileExt = path.extname(file.name).toLowerCase();
    const mimeType = file.type || "";

    const allowedExtensions = [".jpg", ".jpeg", ".png", ".webp", ".pdf"];
    const allowedMimeTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/jpg",
      "application/pdf"
    ];

    if (!allowedExtensions.includes(fileExt) && !allowedMimeTypes.includes(mimeType)) {
      return Response.json(
        {
          success: false,
          message: "Invalid file type. Supported formats: JPG, JPEG, PNG, WEBP, PDF."
        },
        { status: 400 }
      );
    }

    // 2. File Size Validation (Max 10MB)
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return Response.json(
        { success: false, message: "File size exceeds the 10MB limit." },
        { status: 400 }
      );
    }

    console.log(`\n========================================`);
    console.log(`[KYC UPLOAD START] User ID: ${authUser.id}`);
    console.log(`FILE TYPE: ${mimeType || fileExt} | FILE SIZE: ${file.size} bytes`);

    // Convert file to Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 3. Save File Locally
    const fileSaveStart = Date.now();
    const uploadsDir = path.join(process.cwd(), "public", "uploads", "licences");
    await mkdir(uploadsDir, { recursive: true });

    const filename = `${authUser.id}_${Date.now()}${fileExt}`;
    const filePath = path.join(uploadsDir, filename);

    await writeFile(filePath, buffer);
    const publicUrl = `/uploads/licences/${filename}`;
    fileSaveDuration = Date.now() - fileSaveStart;
    console.log(`FILE SAVE TIME: ${fileSaveDuration} ms -> Saved to ${publicUrl}`);

    // 4. Process Document (Image / PDF OCR Scanning)
    const ocrStart = Date.now();
    let ocrRes = null;
    try {
      ocrRes = await processLicenceDocument(buffer, mimeType, file.name, authUser.name);
    } catch (ocrError) {
      console.error("[KYC OCR EXCEPTION]", ocrError.message);
      ocrRes = {
        success: false,
        isPdf: fileExt === ".pdf",
        text: "",
        parsed: {
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
        }
      };
    }
    ocrDuration = Date.now() - ocrStart;

    const parsed = ocrRes.parsed || {};
    console.log(`OCR ENGINE TIME: ${ocrDuration} ms | TEXT LENGTH: ${ocrRes.rawTextLength || 0} chars`);
    console.log(`FIELD EXTRACTION RESULTS:`, {
      Name: parsed.extractedName ? "Extracted" : "Not detected",
      DL_Number: parsed.licenseNo ? "Extracted" : "Not detected",
      DOB: parsed.dob ? "Extracted" : "Not detected",
      Valid_From: parsed.validFrom ? "Extracted" : "Not detected",
      Valid_To: parsed.validTo ? "Extracted" : "Not detected",
      Readability: parsed.readabilityStatus || "UNREADABLE"
    });

    const finalLicenseNo = parsed.licenseNo || null;
    const finalDob = parsed.dob || null;
    const finalLicenseName = parsed.extractedName || authUser.name;
    let finalValidFrom = parsed.validFrom || null;
    let finalValidTo = parsed.validTo || null;

    if (finalValidFrom && finalValidTo && finalValidFrom === finalValidTo) {
      finalValidTo = null;
    }
    if (finalValidFrom && finalValidTo && new Date(finalValidTo) <= new Date(finalValidFrom)) {
      finalValidTo = null;
    }

    // 5. Update MongoDB User Record with status = 'PENDING' ALWAYS
    const dbStart = Date.now();
    await connectToDatabase();

    const updateData = {
      license_image: publicUrl,
      license_no: finalLicenseNo,
      license_name: finalLicenseName,
      license_dob: finalDob ? new Date(finalDob) : null,
      license_valid_from: finalValidFrom ? new Date(finalValidFrom) : null,
      license_valid_to: finalValidTo ? new Date(finalValidTo) : null,
      kyc_status: "PENDING",
      kyc_reason: null,
    };

    let updatedUser = null;
    if (authUser.id && mongoose.Types.ObjectId.isValid(authUser.id)) {
      updatedUser = await User.findByIdAndUpdate(authUser.id, updateData, { new: true });
    }
    if (!updatedUser && authUser.email) {
      updatedUser = await User.findOneAndUpdate(
        { email: authUser.email.toLowerCase() },
        updateData,
        { new: true }
      );
    }

    dbDuration = Date.now() - dbStart;
    const totalDuration = Date.now() - requestStartTime;

    console.log(`DATABASE TIME: ${dbDuration} ms | TOTAL REQUEST TIME: ${totalDuration} ms`);
    console.log(`========================================\n`);

    // Dynamic message based on extraction outcome
    let userMessage = "";
    if (parsed.readabilityStatus === "READABLE") {
      userMessage = "Driving licence uploaded and scanned. Status set to PENDING admin review.";
    } else if (parsed.readabilityStatus === "PARTIALLY_READABLE") {
      userMessage = "Licence uploaded successfully. Some details could not be extracted and require admin verification.";
    } else {
      userMessage = "Licence uploaded. Automatic text extraction was unsuccessful, so an admin will review the document manually.";
    }

    return Response.json({
      success: true,
      message: userMessage,
      kyc_status: "PENDING",
      image: publicUrl,
      isPdf: ocrRes.isPdf,
      timings: {
        fileSaveMs: fileSaveDuration,
        ocrMs: ocrDuration,
        dbMs: dbDuration,
        totalMs: totalDuration
      },
      ocr: {
        rawText: parsed.rawText || "",
        licenseNo: finalLicenseNo,
        dob: finalDob,
        validFrom: finalValidFrom,
        validTo: finalValidTo,
        extractedName: finalLicenseName,
        age: parsed.age,
        nameMatched: parsed.nameMatched,
        readable: parsed.readabilityStatus === "READABLE",
        readabilityStatus: parsed.readabilityStatus || "UNREADABLE",
        fieldDetection: {
          name: Boolean(finalLicenseName),
          licenseNo: Boolean(finalLicenseNo),
          dob: Boolean(finalDob),
          validFrom: Boolean(finalValidFrom),
          validTo: Boolean(finalValidTo)
        }
      }
    });
  } catch (error) {
    console.error("[KYC UPLOAD ERROR]", error);
    return Response.json(
      { success: false, message: "Failed to upload licence file. Please try again.", error: error.message },
      { status: 500 }
    );
  }
}
