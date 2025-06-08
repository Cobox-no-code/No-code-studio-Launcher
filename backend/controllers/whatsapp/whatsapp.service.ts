// whatsapp.service.ts
import { Client, LocalAuth, MessageMedia } from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';
import fs from 'fs';

class WhatsAppService {
  private client: Client | null = null;
  private qrString: string | null = null;
  private isReady: boolean = false;
  private isInitializing: boolean = false;

  constructor() {
    this.initializeClient();
  }

  private initializeClient() {
    if (this.isInitializing) {
      console.log('Client is already initializing...');
      return;
    }

    this.isInitializing = true;
    console.log('Initializing WhatsApp client...');

    this.client = new Client({
      authStrategy: new LocalAuth({
        clientId: 'whatsapp-session'
      }),
      puppeteer: {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu'
        ]
      }
    });

    // QR Code event
    this.client.on('qr', (qr) => {
      console.log('QR Code received');
      this.qrString = qr;
      qrcode.generate(qr, { small: true });
    });

    // Ready event
    this.client.on('ready', () => {
      console.log('WhatsApp client is ready!');
      this.isReady = true;
      this.qrString = null; // Clear QR when logged in
      this.isInitializing = false;
    });

    // Authentication success
    this.client.on('authenticated', () => {
      console.log('WhatsApp authenticated successfully');
      this.qrString = null;
    });

    // Authentication failure
    this.client.on('auth_failure', (msg) => {
      console.error('Authentication failed:', msg);
      this.isReady = false;
      this.qrString = null;
      this.isInitializing = false;
      // Reinitialize after failure
      setTimeout(() => this.initializeClient(), 5000);
    });

    // Disconnected event
    this.client.on('disconnected', (reason) => {
      console.log('WhatsApp client disconnected:', reason);
      this.isReady = false;
      this.qrString = null;
      this.isInitializing = false;
      // Reinitialize after disconnect
      setTimeout(() => this.initializeClient(), 5000);
    });

    // Error handling
    this.client.on('error', (error) => {
      console.error('WhatsApp client error:', error);
    });

    // Initialize the client
    this.client.initialize().catch((error) => {
      console.error('Failed to initialize WhatsApp client:', error);
      this.isInitializing = false;
    });
  }

  public getQRCode(): string | null {
    return this.qrString;
  }

  public isClientReady(): boolean {
    return this.isReady && this.client !== null;
  }

  public async sendPDF(number: string, filePath: string): Promise<void> {
    if (!this.isClientReady()) {
      throw new Error('WhatsApp client is not ready. Please login first.');
    }

    if (!fs.existsSync(filePath)) {
      throw new Error('File not found: ' + filePath);
    }

    try {
      // Format the number (ensure it includes country code)
      const formattedNumber = this.formatPhoneNumber(number);
      
      // Create media from file
      const media = MessageMedia.fromFilePath(filePath);
      
      // Send the PDF
      await this.client!.sendMessage(formattedNumber, media, {
        caption: '📄 PaperBill | Invoice/Document - Thank you for your business!'
      });

      console.log(`PDF sent successfully to ${formattedNumber}`);
      
      // Clean up the temporary file if it exists in temp directory
      if (filePath.includes('/tmp/') || filePath.includes('\\temp\\')) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.error('Error sending PDF:', error);
      throw new Error(`Failed to send PDF: ${error.message}`);
    }
  }

  private formatPhoneNumber(number: string): string {
    // Remove all non-digits
    let cleaned = number.replace(/\D/g, '');
    
    // If it starts with 91, assume it's already formatted
    if (cleaned.startsWith('91')) {
      return cleaned + '@c.us';
    }
    
    // If it's a 10-digit number, add country code (91 for India)
    if (cleaned.length === 10) {
      return '91' + cleaned + '@c.us';
    }
    
    // If it's already 12 digits, assume country code is included
    if (cleaned.length === 12) {
      return cleaned + '@c.us';
    }
    
    throw new Error('Invalid phone number format');
  }

  public async restartClient(): Promise<void> {
    console.log('Restarting WhatsApp client...');
    
    if (this.client) {
      await this.client.destroy();
    }
    
    this.client = null;
    this.isReady = false;
    this.qrString = null;
    this.isInitializing = false;
    
    // Wait a bit before reinitializing
    setTimeout(() => this.initializeClient(), 2000);
  }
}

// Create singleton instance
const whatsappService = new WhatsAppService();

export const getQRCode = (): string | null => {
  return whatsappService.getQRCode();
};

export const sendPDF = async (number: string, filePath: string): Promise<void> => {
  return whatsappService.sendPDF(number, filePath);
};

export const isWhatsAppReady = (): boolean => {
  return whatsappService.isClientReady();
};

export const restartWhatsAppClient = async (): Promise<void> => {
  return whatsappService.restartClient();
};