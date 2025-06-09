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
  isWhatsAppInitializing,
  getWhatsAppStatus as getWhatsStatus,
  forceInitialize,
} from "../controllers/whatsapp/whatsapp.service";
import { app } from "electron";
const isDev = process.env.NODE_ENV !== "production";
const puppeteer = isDev ? require("puppeteer") : require("puppeteer-core");
const isElectron = !!process.versions.electron;

export const getLoginQRCode = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    console.log('🎯 QR Code requested...');
    
    // Force initialization if not started
    const status = getWhatsStatus();
    if (!status.isInitializing && !status.isReady && !status.hasQR) {
      console.log('🚀 Starting initialization on QR request...');
      forceInitialize(); // Don't await - let it run async
    }

    // Wait a moment for initialization to start
    await new Promise(resolve => setTimeout(resolve, 1000));

    const qr = getQRCode();
    const isReady = isWhatsAppReady();
    const isInit = isWhatsAppInitializing();
    const currentStatus = getWhatsStatus();

    console.log('📊 Current status:', {
      isReady,
      isInit,
      hasQR: !!qr,
      retryCount: currentStatus.retryCount,
      lastError: currentStatus.lastError
    });

    if (isReady) {
      res.json({
        qr: null,
        status: "logged_in",
        message: "WhatsApp is already logged in and ready",
      });
    } else if (qr) {
      const qrImage = await qrcode.toDataURL(qr, {
        width: 300,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      });

      console.log('✅ Returning QR code to client');
      res.json({
        qr: qrImage,
        status: "pending_login",
        message: "Scan QR code to login",
      });
    } else if (isInit) {
      res.json({
        qr: null,
        status: "initializing",
        message: `WhatsApp client is initializing... (Attempt ${currentStatus.retryCount + 1})`,
      });
    } else {
      // Not initializing, not ready, no QR - probably error state
      const errorMsg = currentStatus.lastError || "Unknown error - try restarting";
      res.json({
        qr: null,
        status: "error",
        message: errorMsg,
      });
    }
  } catch (err: any) {
    console.error("❌ Error in getLoginQRCode:", err);
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
    const status = getWhatsStatus();
    const qr = getQRCode();

    let currentStatus = "error";
    let message = "";

    // Enhanced status logic with error handling
    if (status.isReady) {
      currentStatus = "logged_in";
      message = "WhatsApp is logged in and ready";
    } else if (status.hasQR) {
      currentStatus = "pending_login";
      message = "QR code generated - please scan to login";
    } else if (status.isInitializing) {
      currentStatus = "initializing";
      message = "WhatsApp client is initializing...";
    } else if (status.lastError) {
      currentStatus = "error";
      message = `Error: ${status.lastError}`;
    } else {
      currentStatus = "error";
      message = "WhatsApp client is in an unknown state";
    }

    res.json({
      isLoggedIn: status.isReady,
      isInitializing: status.isInitializing,
      hasQR: status.hasQR,
      status: currentStatus,
      message: message,
      lastError: status.lastError,
      retryCount: status.retryCount,
      qr: qr,
    });
  } catch (err: any) {
    res.status(500).json({ 
      error: err.message, 
      status: "error",
      message: "Failed to get WhatsApp status"
    });
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



// POST /whatsapp/force-init - Force initialization
export const forceInitWhatsApp = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    console.log('🚀 Force initialization requested via API...');
    await forceInitialize();
    res.json({ message: "WhatsApp initialization started" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// POST /whatsapp/send-pdf - Accepts HTML, generates PDF, and sends it
export const sendPDFController = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { number, html, invoice } = req.body;

  // Validation
  if (!number || !html) {
    res.status(400).json({
      message: "Missing required fields",
      required: {
        number: !number ? "Phone number is required" : "✓",
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
      ? path.join(app.getPath("userData"), `${invoice?.partyName || 'invoice'}-${Date.now()}.pdf`)
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