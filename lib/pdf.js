import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

/**
 * Generates an official Vehicle Rental Agreement PDF
 * @param {Object} data - Contains booking, customer, and vehicle records
 * @returns {Promise<Uint8Array>}
 */
export async function generateAgreementPdf({ booking, customer, vehicle }) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // Standard A4 (Points: 595.28 x 841.89)
  const { width, height } = page.getSize();

  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  const primaryColor = rgb(0.12, 0.23, 0.44); // Dark Navy Blue
  const textColor = rgb(0.15, 0.15, 0.15); // Dark Slate
  const lightGray = rgb(0.5, 0.5, 0.5);
  const greenColor = rgb(0.05, 0.55, 0.25);
  const borderColor = rgb(0.85, 0.88, 0.92);

  let y = height - 50;

  // Header Banner
  page.drawText("VEHICLE RENTAL AGREEMENT", {
    x: 50,
    y,
    size: 20,
    font: fontBold,
    color: primaryColor,
  });

  y -= 20;
  page.drawText(`Booking Reference: BOOKING-#${booking.id}   |   Issued: ${new Date().toLocaleDateString("en-IN")}`, {
    x: 50,
    y,
    size: 10,
    font: fontRegular,
    color: lightGray,
  });

  y -= 15;
  // Divider line
  page.drawLine({
    start: { x: 50, y },
    end: { x: width - 50, y },
    thickness: 1.5,
    color: borderColor,
  });

  y -= 25;

  // Helper for drawing section header
  const drawSectionHeader = (title) => {
    page.drawText(title, {
      x: 50,
      y,
      size: 12,
      font: fontBold,
      color: primaryColor,
    });
    y -= 16;
  };

  // Helper for drawing key-value row
  const drawRow = (label, value) => {
    page.drawText(label, {
      x: 60,
      y,
      size: 10,
      font: fontBold,
      color: textColor,
    });
    page.drawText(String(value || "N/A"), {
      x: 220,
      y,
      size: 10,
      font: fontRegular,
      color: textColor,
    });
    y -= 16;
  };

  // 1. Customer Information
  drawSectionHeader("1. CUSTOMER INFORMATION");
  drawRow("Full Name:", customer.name);
  drawRow("Email Address:", customer.email);
  drawRow("Driving Licence No:", customer.license_no || "VERIFIED");

  y -= 10;

  // 2. Vehicle Details
  drawSectionHeader("2. VEHICLE DETAILS");
  drawRow("Vehicle Model:", vehicle.name);
  drawRow("Vehicle Category:", vehicle.type);
  drawRow("Registration / Plate No:", vehicle.plate_no);
  drawRow("Daily Rate:", `Rs. ${parseFloat(vehicle.price_per_day).toLocaleString("en-IN")}`);

  y -= 10;

  // 3. Rental Period & Pricing
  const start = new Date(booking.start_date);
  const end = new Date(booking.end_date);
  const diffTime = Math.abs(end - start);
  const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;

  drawSectionHeader("3. RENTAL PERIOD & CHARGES");
  drawRow("Pickup Date:", start.toLocaleDateString("en-IN"));
  drawRow("Return Date:", end.toLocaleDateString("en-IN"));
  drawRow("Rental Duration:", `${days} Day(s)`);
  drawRow("Total Rental Amount:", `Rs. ${parseFloat(booking.total_amount).toLocaleString("en-IN")}`);

  y -= 10;

  // 4. Terms and Conditions
  drawSectionHeader("4. TERMS & CONDITIONS");
  const terms = [
    "1. The Customer certifies all information provided, including driving licence details, is authentic.",
    "2. The Customer agrees to return the vehicle in the same condition as received on or before the Return Date.",
    "3. The Customer accepts full financial and legal responsibility for any traffic violations or damages during rental.",
    "4. Subleasing, unauthorized driver operation, or commercial re-renting of the vehicle is strictly prohibited.",
    "5. Fuel policy: Return with the same fuel level as recorded at pickup. Late return fees may apply."
  ];

  for (const term of terms) {
    page.drawText(term, {
      x: 60,
      y,
      size: 8.5,
      font: fontRegular,
      color: textColor,
    });
    y -= 14;
  }

  y -= 15;

  // 5. Digital Signature & Confirmation Box
  page.drawRectangle({
    x: 50,
    y: y - 55,
    width: width - 100,
    height: 65,
    borderColor,
    borderWidth: 1,
    color: rgb(0.97, 0.98, 1.0),
  });

  page.drawText("CONFIRMATION & DIGITAL SIGNATURE", {
    x: 65,
    y: y - 10,
    size: 10,
    font: fontBold,
    color: primaryColor,
  });

  const isSigned = Boolean(booking.agreement_signed);
  const signedText = isSigned
    ? `Status: AGREEMENT SIGNED & ACCEPTED (Confirmed online by ${customer.name})`
    : "Status: PENDING SIGNATURE";

  page.drawText(signedText, {
    x: 65,
    y: y - 26,
    size: 9.5,
    font: fontBold,
    color: isSigned ? greenColor : rgb(0.8, 0.4, 0.1),
  });

  page.drawText(
    `Timestamp: ${new Date(booking.created_at || Date.now()).toLocaleString("en-IN")}   |   System Verified`,
    {
      x: 65,
      y: y - 42,
      size: 8.5,
      font: fontOblique,
      color: lightGray,
    }
  );

  // Footer
  page.drawText(
    "Rent-Ease Vehicle Rental System  *  Official Digital Agreement  *  Academic Project",
    {
      x: 50,
      y: 30,
      size: 8,
      font: fontRegular,
      color: lightGray,
    }
  );

  return await pdfDoc.save();
}
