
import mongoose from "mongoose";
import { put, del } from "@vercel/blob";
import connectToDatabase from "@/lib/mongodb";
import User from "@/lib/models/User";
import { getAuthUser } from "@/lib/auth";
import { processLicenceDocument } from "@/lib/ocr";

export async function POST(req) {
  const requestStartTime = Date.now();
  let ocrDuration = 0;
  let dbDuration = 0;
  let blobUrl = null;

  try {
    const authUser = await getAuthUser(req);

    if (!authUser) {
      return Response.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error("[KYC UPLOAD ERROR] Blob token is missing.");

      return Response.json(
        {
          success: false,
          message: "Document storage is not configured."
        },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string") {
      return Response.json(
        {
          success: false,
          message: "Driving licence file is required."
        },
        { status: 400 }
      );
    }

    const filename = file.name || "";
    const fileExt = filename.includes(".")
      ? `.${filename.split(".").pop().toLowerCase()}`
      : "";

    const allowedTypes = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".webp": "image/webp",
      ".pdf": "application/pdf"
    };

    const mimeType = file.type || "";
    const expectedType = allowedTypes[fileExt];

    if (!expectedType || mimeType !== expectedType) {
      return Response.json(
        {
          success: false,
          message:
            "Invalid file type. Upload a JPG, JPEG, PNG, WEBP, or PDF file."
        },
        { status: 400 }
      );
    }

    const MAX_SIZE = 4 * 1024 * 1024;

    if (file.size === 0 || file.size > MAX_SIZE) {
      return Response.json(
        {
          success: false,
          message: "The file must be smaller than or equal to 4 MB."
        },
        { status: 400 }
      );
    }

    if (!authUser.id || !mongoose.Types.ObjectId.isValid(authUser.id)) {
      return Response.json(
        { success: false, message: "Invalid user account." },
        { status: 401 }
      );
    }

    console.log(
      `[KYC UPLOAD START] User: ${authUser.id}, size: ${file.size}`
    );

    const buffer = Buffer.from(await file.arrayBuffer());

    const blob = await put(
      `kyc/${authUser.id}/licence${fileExt}`,
      buffer,
      {
        access: "private",
        addRandomSuffix: true,
        contentType: mimeType,
        cacheControlMaxAge: 60
      }
    );

    blobUrl = blob.url;
    const blobPathname = blob.pathname;

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

    let finalValidFrom = parsed.validFrom || null;
    let finalValidTo = parsed.validTo || null;

    if (finalValidFrom && finalValidTo) {
      if (
        finalValidFrom === finalValidTo ||
        new Date(finalValidTo) <= new Date(finalValidFrom)
      ) {
        finalValidTo = null;
      }
    }

    const updateData = {
      license_image: blobPathname,
      license_no: parsed.licenseNo || null,
      license_name: parsed.extractedName || authUser.name,
      license_dob: parsed.dob ? new Date(parsed.dob) : null,
      license_valid_from: finalValidFrom
        ? new Date(finalValidFrom)
        : null,
      license_valid_to: finalValidTo
        ? new Date(finalValidTo)
        : null,
      kyc_status: "PENDING",
      kyc_reason: null
    };

    const dbStart = Date.now();

    await connectToDatabase();

    const updatedUser = await User.findByIdAndUpdate(
      authUser.id,
      updateData,
      { new: true }
    );

    if (!updatedUser) {
      await del(blobUrl).catch((error) =>
        console.error("[KYC BLOB CLEANUP ERROR]", error)
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

    const readability = parsed.readabilityStatus || "UNREADABLE";

    const userMessage =
      readability === "READABLE"
        ? "Driving licence uploaded successfully. Status set to PENDING admin review."
        : readability === "PARTIALLY_READABLE"
          ? "Licence saved, but some details could not be extracted. Admin verification is required."
          : "Licence saved successfully. Automatic text extraction was unsuccessful. Admin review is required.";

    console.log("[KYC UPLOAD SUCCESS]", {
      userId: authUser.id,
      storage: "private-blob",
      ocrMs: ocrDuration,
      dbMs: dbDuration,
      totalMs: Date.now() - requestStartTime
    });

    return Response.json({
      success: true,
      message: userMessage,
      kyc_status: "PENDING",
      image: `/api/kyc/document?userId=${authUser.id}`,
      isPdf: fileExt === ".pdf",
      timings: {
        fileSaveMs: 0,
        ocrMs: ocrDuration,
        dbMs: dbDuration,
        totalMs: Date.now() - requestStartTime
      },
      ocr: {
        licenseNo: parsed.licenseNo || null,
        dob: parsed.dob || null,
        validFrom: finalValidFrom,
        validTo: finalValidTo,
        extractedName: parsed.extractedName || null,
        age: parsed.age ?? null,
        nameMatched: parsed.nameMatched ?? false,
        readable: readability === "READABLE",
        readabilityStatus: readability,
        fieldDetection: {
          name: Boolean(parsed.extractedName),
          licenseNo: Boolean(parsed.licenseNo),
          dob: Boolean(parsed.dob),
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
        message: process.env.NODE_ENV === "development"
          ? error.message
          : "Failed to upload licence file. Please try again."
      },
      { status: 500 }
    );
  }
}
