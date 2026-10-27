import mongoose from "mongoose";
import connectToDatabase from "@/lib/mongodb";
import User from "@/lib/models/User";
import { getAuthUser } from "@/lib/auth";
import { processLicenceDocument } from "@/lib/ocr";

export async function POST(req) {
  const requestStartTime = Date.now();
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
        {
          success: false,
          message: "Driving licence file is required"
        },
        { status: 400 }
      );
    }

    const filename = file.name || "";
    const fileExt = filename.includes(".")
      ? `.${filename.split(".").pop().toLowerCase()}`
      : "";
    const mimeType = file.type || "";

    const allowedExtensions = [
      ".jpg",
      ".jpeg",
      ".png",
      ".webp",
      ".pdf"
    ];

    const allowedMimeTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf"
    ];

    if (
      !allowedExtensions.includes(fileExt) &&
      !allowedMimeTypes.includes(mimeType)
    ) {
      return Response.json(
        {
          success: false,
          message:
            "Invalid file type. Supported formats: JPG, JPEG, PNG, WEBP, PDF."
        },
        { status: 400 }
      );
    }

    const MAX_SIZE = 10 * 1024 * 1024;

    if (file.size > MAX_SIZE) {
      return Response.json(
        {
          success: false,
          message: "File size exceeds the 10MB limit."
        },
        { status: 400 }
      );
    }

    console.log("\n========================================");
    console.log(`[KYC UPLOAD START] User ID: ${authUser.id}`);
    console.log(
      `FILE TYPE: ${mimeType || fileExt} | FILE SIZE: ${file.size} bytes`
    );

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Process directly from memory; do not write to public/ on Vercel.
    // Persistent document storage must be configured separately.
    const publicUrl = null;

    const ocrStart = Date.now();
    let ocrRes;

    try {
      ocrRes = await processLicenceDocument(
        buffer,
        mimeType,
        filename,
        authUser.name
      );
    } catch (ocrError) {
      console.error("[KYC OCR EXCEPTION]", ocrError);

      ocrRes = {
        success: false,
        isPdf: fileExt === ".pdf",
        rawTextLength: 0,
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

    console.log(
      `OCR ENGINE TIME: ${ocrDuration} ms | TEXT LENGTH: ${
        ocrRes.rawTextLength || ocrRes.text?.length || 0
      } chars`
    );

    console.log("FIELD EXTRACTION RESULTS:", {
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

    if (finalValidFrom && finalValidTo) {
      if (finalValidFrom === finalValidTo) {
        finalValidTo = null;
      } else if (
        new Date(finalValidTo) <= new Date(finalValidFrom)
      ) {
        finalValidTo = null;
      }
    }

    const dbStart = Date.now();

    await connectToDatabase();

    const updateData = {
      license_image: publicUrl,
      license_no: finalLicenseNo,
      license_name: finalLicenseName,
      license_dob: finalDob ? new Date(finalDob) : null,
      license_valid_from: finalValidFrom
        ? new Date(finalValidFrom)
        : null,
      license_valid_to: finalValidTo
        ? new Date(finalValidTo)
        : null,
      kyc_status: "PENDING",
      kyc_reason: null
    };

    let updatedUser = null;

    if (
      authUser.id &&
      mongoose.Types.ObjectId.isValid(authUser.id)
    ) {
      updatedUser = await User.findByIdAndUpdate(
        authUser.id,
        updateData,
        { new: true }
      );
    }

    if (!updatedUser && authUser.email) {
      updatedUser = await User.findOneAndUpdate(
        { email: authUser.email.toLowerCase() },
        updateData,
        { new: true }
      );
    }

    if (!updatedUser) {
      console.error(
        "[KYC UPLOAD ERROR] User record was not found for update."
      );

      return Response.json(
        {
          success: false,
          message: "Could not update your user record. Please try again."
        },
        { status: 404 }
      );
    }

    dbDuration = Date.now() - dbStart;
    const totalDuration = Date.now() - requestStartTime;

    console.log(
      `DATABASE TIME: ${dbDuration} ms | TOTAL REQUEST TIME: ${totalDuration} ms`
    );
    console.log("========================================\n");

    let userMessage;

    if (parsed.readabilityStatus === "READABLE") {
      userMessage =
        "Driving licence scanned. Status set to PENDING admin review. Document storage is not configured.";
    } else if (parsed.readabilityStatus === "PARTIALLY_READABLE") {
      userMessage =
        "Some licence details could not be extracted. Admin verification is required. Document storage is not configured.";
    } else {
      userMessage =
        "Automatic text extraction was unsuccessful. Admin review is required. Document storage is not configured.";
    }

    return Response.json({
      success: true,
      message: userMessage,
      kyc_status: "PENDING",
      image: publicUrl,
      isPdf: Boolean(ocrRes.isPdf),
      timings: {
        fileSaveMs: 0,
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
        readabilityStatus:
          parsed.readabilityStatus || "UNREADABLE",
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
      {
        success: false,
        message: "Failed to upload licence file. Please try again.",
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : undefined
      },
      { status: 500 }
    );
  }
}
