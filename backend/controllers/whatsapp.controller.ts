// whatsapp.controller.ts
import { Request, Response } from "express";
import qrcode from "qrcode";
import path from "path";
import fs from "fs";
import chromium from "@sparticuz/chromium";
import {
  getQRCode,
  sendPDF,
  isWhatsAppReady,
  restartWhatsAppClient,
} from "../controllers/whatsapp/whatsapp.service";
import { app } from "electron";
const isDev = process.env.NODE_ENV !== "production";
const puppeteer = isDev ? require("puppeteer") : require("puppeteer-core");
const isElectron = !!process.versions.electron;

// Safe upload directory

// GET /whatsapp/qr - Returns QR code as base64 image
export const getLoginQRCode = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const qr = getQRCode();

    if (qr) {
      // Generate QR code as base64 image
      const qrImage = await qrcode.toDataURL(qr, {
        width: 300,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      });

      res.json({
        qr: qrImage,
        status: "pending_login",
        message: "Scan QR code to login",
      });
    } else if (isWhatsAppReady()) {
      // Already logged in
      res.json({
        qr: null,
        status: "logged_in",
        message: "WhatsApp is already logged in",
      });
    } else {
      // Still initializing
      res.json({
        qr: null,
        status: "initializing",
        message: "WhatsApp client is initializing...",
      });
    }
  } catch (err: any) {
    console.error("Error getting QR code:", err);
    res.status(500).json({
      error: err.message,
      status: "error",
    });
  }
};

// GET /whatsapp/status - Check login status
export const getWhatsAppStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const isReady = isWhatsAppReady();
    const qr = getQRCode();

    res.json({
      isLoggedIn: isReady,
      hasQR: !!qr,
      status: isReady ? "logged_in" : qr ? "pending_login" : "initializing",
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// POST /whatsapp/restart - Restart WhatsApp client
export const restartWhatsApp = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    await restartWhatsAppClient();
    res.json({ message: "WhatsApp client restart initiated" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// POST /whatsapp/send-pdf - Accepts HTML, generates PDF, and sends it
export const sendPDFController = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { number, html ,invoice} = req.body;

  // Validation
  if (!number || !html) {
    res.status(400).json({
      message: "Missing required fields",
      required: {
        number: !number
         ? "Phone number is required" : "✓",
        html: !html ? "HTML content is required" : "✓",
      },
    });
    return;
  }

  // Check WhatsApp status
  if (!isWhatsAppReady()) {
    res.status(400).json({
      message: "WhatsApp is not logged in. Please scan QR code first.",
      status: "not_logged_in",
    });
    return;
  }

  try {
    const browser = await puppeteer.launch({
      args: isDev ? [] : chromium.args,
      executablePath: isDev
        ? undefined // use default Chrome in dev
        : await chromium.executablePath(), // serverless path
      headless: true,
      defaultViewport: { width: 794, height: 1123 },
    });

    const fullHtml = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8" />
    <title>Invoice</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
      body { background: white; }
    </style>
  </head>
  <body>${html}</body>
  </html>
`;

    const page = await browser.newPage();
    await page.setContent(fullHtml, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      margin: { top: "20mm", right: "20mm", bottom: "20mm", left: "20mm" },
      printBackground: true,
    });

    await browser.close();

    // Save PDF temporarily
    const tempPath = isElectron
      ? path.join(app.getPath("userData"), `${invoice.partyName}-${Date.now()}.pdf`)
      : path.join(process.cwd(), `temp-${Date.now()}.pdf`);

    fs.writeFileSync(tempPath, pdfBuffer);

    // Send PDF via WhatsApp
    await sendPDF(number, tempPath);

    // Clean up
    fs.unlinkSync(tempPath);

    res.json({
      message: "PDF sent successfully",
      recipient: `+91${number}`,
      fileSize: `${(pdfBuffer.length / 1024).toFixed(2)} KB`,
    });
  } catch (err: any) {
    console.error("Error sending generated PDF:", err);
    res.status(500).json({
      message: "Failed to generate and send PDF",
      error: err.message,
    });
  }
};
