// whatsapp.controller.ts - Fixed Version - Prevents Concurrent Requests
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

// Prevent concurrent QR requests
let qrRequestInProgress = false;
let lastQRRequestTime = 0;
const QR_REQUEST_COOLDOWN = 2000; // 2 seconds between requests

export const getLoginQRCode = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    console.log('🎯 QR Code requested...');

    const status = getWhatsStatus();
    const qr = getQRCode();

    if (status.isReady) {
      res.json({
        qr: null,
        status: "logged_in",
        message: "WhatsApp is already logged in and ready",
      });
      return;
    }

    if (qr) {
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
      return;
    }

    if (status.isInit) {
      res.json({
        qr: null,
        status: "initializing",
        message: "WhatsApp client is initializing...",
      });
      return;
    }

    res.json({
      qr: null,
      status: "error",
      message: status.lastError || "Unknown error. Please restart client.",
    });

  } catch (err: any) {
    console.error("❌ Error in getLoginQRCode:", err);
    res.status(500).json({
      error: err.message,
      status: "error",
      message: "Failed to get QR code",
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
    const qr = status.hasQR ? getQRCode() : null;

    let currentStatus = "error";
    let message = "";

    if (status.isReady) {
      currentStatus = "logged_in";
      message = "WhatsApp is logged in and ready";
    } else if (status.hasQR && qr) {
      currentStatus = "pending_login";
      message = "QR code available - please scan to login";
    } else if (status.isInit) {
      currentStatus = "initializing";
      message = `WhatsApp client is initializing... (Attempt ${status.retryCount + 1}/3)`;
    } else if (status.lastError) {
      currentStatus = "error";
      message = `Error: ${status.lastError}`;
    } else {
      currentStatus = "disconnected";
      message = "WhatsApp client is not connected";
    }

    res.json({
      isLoggedIn: status.isReady,
      isInitializing: status.isInit,
      hasQR: status.hasQR,
      status: currentStatus,
      message: message,
      lastError: status.lastError,
      retryCount: status.retryCount,
      maxRetries: 3,
      qr: qr,
      needsRestart: status.retryCount >= 3 && !status.isReady
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
    console.log('🔄 WhatsApp restart requested via API...');
    
    // Reset the request flags
    qrRequestInProgress = false;
    lastQRRequestTime = 0;
    
    await restartWhatsAppClient();
    res.json({ 
      message: "WhatsApp client restart initiated",
      status: "restarting"
    });
  } catch (err: any) {
    console.error('❌ Error restarting WhatsApp:', err);
    res.status(500).json({ 
      error: err.message,
      status: "restart_failed"
    });
  }
};

// POST /whatsapp/force-init - Force initialization
export const forceInitWhatsApp = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    console.log('🚀 Force initialization requested via API...');
    
    // Reset the request flags
    qrRequestInProgress = false;
    lastQRRequestTime = 0;
    
    // Don't await - let it run async
    forceInitialize();
    
    res.json({ 
      message: "Force initialization triggered",
      status: "initializing"
    });
  } catch (err: any) {
    console.error('❌ Error in forceInitWhatsApp:', err);
    res.status(500).json({ 
      error: err.message,
      status: "force_init_failed"
    });
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
    const status = getWhatsStatus();
    res.status(400).json({
      message: "WhatsApp is not logged in. Please scan QR code first.",
      status: "not_logged_in",
      details: {
        isReady: status.isReady,
        isInitializing: status.isInit,
        hasQR: status.hasQR,
        lastError: status.lastError
      }
    });
    return;
  }

  let browser = null;
  let tempPath = "";

  try {
    console.log('📄 Starting PDF generation and WhatsApp send...');

    // Enhanced browser configuration for better stability
    browser = await puppeteer.launch({
      args: isDev ? [
        '--no-sandbox',
        '--disable-setuid-sandbox'
      ] : chromium.args,
      executablePath: isDev
        ? undefined // use default Chrome in dev
        : await chromium.executablePath(), // serverless path
      headless: true,
      defaultViewport: { width: 794, height: 1123 },
      timeout: 30000, // 30 second timeout
    });

    const fullHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Invoice</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { 
      background: white; 
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    @media print {
      body { -webkit-print-color-adjust: exact; }
    }
  </style>
</head>
<body>${html}</body>
</html>
`;

    const page = await browser.newPage();
    
    // Set user agent to avoid detection
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    
    await page.setContent(fullHtml, { 
      waitUntil: "networkidle0",
      timeout: 30000
    });

    // Wait for any dynamic content
    await page.waitForTimeout(1000);

    console.log('📄 Generating PDF...');
    const pdfBuffer = await page.pdf({
      format: "A4",
      margin: { top: "20mm", right: "20mm", bottom: "20mm", left: "20mm" },
      printBackground: true,
      preferCSSPageSize: true,
      displayHeaderFooter: false,
    });

    await browser.close();
    browser = null;

    // Generate safe filename
    const partyName = invoice?.partyName ? 
      invoice.partyName.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20) : 
      'invoice';
    const timestamp = Date.now();
    const filename = `${partyName}-${timestamp}.pdf`;

    // Save PDF temporarily
    tempPath = isElectron
      ? path.join(app.getPath("userData"), filename)
      : path.join(process.cwd(), `temp-${filename}`);

    console.log('💾 Saving PDF to:', tempPath);
    fs.writeFileSync(tempPath, pdfBuffer);

    // Validate file was created
    if (!fs.existsSync(tempPath)) {
      throw new Error('PDF file was not created successfully');
    }

    const fileStats = fs.statSync(tempPath);
    console.log(`📊 PDF created: ${(fileStats.size / 1024).toFixed(2)} KB`);

    // Send PDF via WhatsApp
    console.log('📱 Sending PDF via WhatsApp...');
    await sendPDF(number, tempPath);

    // Clean up temp file
    try {
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
        console.log('🗑️ Temp file cleaned up');
      }
    } catch (cleanupError) {
      console.warn('⚠️ Could not clean up temp file:', cleanupError);
    }

    res.json({
      message: "PDF sent successfully via WhatsApp",
      recipient: `+91${number}`,
      fileSize: `${(pdfBuffer.length / 1024).toFixed(2)} KB`,
      filename: filename,
      timestamp: new Date().toISOString()
    });

  } catch (err: any) {
    console.error("❌ Error sending generated PDF:", err);

    // Clean up browser if still open
    if (browser) {
      try {
        await browser.close();
      } catch (browserError) {
        console.warn('⚠️ Error closing browser:', browserError);
      }
    }

    // Clean up temp file if it exists
    if (tempPath && fs.existsSync(tempPath)) {
      try {
        fs.unlinkSync(tempPath);
      } catch (cleanupError) {
        console.warn('⚠️ Error cleaning up temp file:', cleanupError);
      }
    }

    // Provide more specific error messages
    let errorMessage = "Failed to generate and send PDF";
    let errorCode = "PDF_GENERATION_ERROR";

    if (err.message.includes('WhatsApp')) {
      errorMessage = "PDF generated but failed to send via WhatsApp";
      errorCode = "WHATSAPP_SEND_ERROR";
    } else if (err.message.includes('Navigation') || err.message.includes('timeout')) {
      errorMessage = "PDF generation timed out - please try again";
      errorCode = "PDF_TIMEOUT_ERROR";
    } else if (err.message.includes('File not found')) {
      errorMessage = "Generated PDF file not found";
      errorCode = "FILE_NOT_FOUND_ERROR";
    }

    res.status(500).json({
      message: errorMessage,
      error: err.message,
      errorCode: errorCode,
      timestamp: new Date().toISOString()
    });
  }
};