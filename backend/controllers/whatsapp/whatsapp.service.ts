// whatsapp.service.ts
import { Client, LocalAuth, MessageMedia } from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';
import fs from 'fs';
import path from 'path';

class WhatsAppService {
  private client: Client | null = null;
  private qrString: string | null = null;
  private isReady: boolean = false;
  private isInitializing: boolean = false;
  private initializationTimeout: NodeJS.Timeout | null = null;
  private lastError: string | null = null;
  private retryCount: number = 0;
  private maxRetries: number = 3;

  constructor() {
    // Don't initialize immediately, let the first request trigger it
    console.log('📱 WhatsApp Service created - ready for initialization');
  }

  private async forceCleanStart() {
    console.log('🧹 Starting force clean initialization...');
    
    // Kill any existing client
    if (this.client) {
      try {
        await this.client.destroy();
        console.log('🗑️ Existing client destroyed');
      } catch (error) {
        console.log('⚠️ Error destroying client (might be normal):', error.message);
      }
      this.client = null;
    }

    // Clear session directory
    const sessionPaths = [
      path.join(process.cwd(), '.wwebjs_auth'),
      path.join(process.cwd(), '.wwebjs_cache'),
      path.join(process.cwd(), 'node_modules/.wwebjs_auth')
    ];

    for (const sessionPath of sessionPaths) {
      if (fs.existsSync(sessionPath)) {
        try {
          fs.rmSync(sessionPath, { recursive: true, force: true });
          console.log(`🗑️ Cleared session: ${sessionPath}`);
        } catch (error) {
          console.log(`⚠️ Could not clear ${sessionPath}:`, error.message);
        }
      }
    }

    // Reset all state
    this.isReady = false;
    this.qrString = null;
    this.isInitializing = false;
    this.lastError = null;
    
    // Clear timeout
    if (this.initializationTimeout) {
      clearTimeout(this.initializationTimeout);
      this.initializationTimeout = null;
    }

    console.log('✅ Force clean completed');
  }

  public async initializeClient() {
    if (this.isInitializing) {
      console.log('⏳ Client is already initializing... Current retry:', this.retryCount);
      return;
    }

    this.isInitializing = true;
    console.log(`🚀 Starting WhatsApp initialization (Attempt ${this.retryCount + 1}/${this.maxRetries})`);

    // Force clean on first attempt or if retrying
    await this.forceCleanStart();

    // Set aggressive timeout (20 seconds)
    this.initializationTimeout = setTimeout(() => {
      console.log('⏰ TIMEOUT: Initialization taking too long, forcing restart...');
      this.handleInitializationFailure('Initialization timeout - client stuck');
    }, 20000);

    try {
      console.log('🔧 Creating WhatsApp client with minimal config...');
      
      // Use minimal configuration for better compatibility
      this.client = new Client({
        authStrategy: new LocalAuth({
          clientId: `wa-session-${Date.now()}` // Use timestamp for unique session
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
            '--disable-gpu',
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor',
            '--disable-extensions',
            '--disable-plugins',
            '--disable-images',
            '--memory-pressure-off',
            '--max_old_space_size=4096'
          ],
          timeout: 0, // No timeout for puppeteer
          handleSIGINT: false,
          handleSIGTERM: false,
          handleSIGHUP: false
        }
      });

      this.setupEventListeners();

      console.log('🎯 Calling client.initialize()...');
      
      // Initialize with promise timeout
      const initPromise = this.client.initialize();
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Client initialize timeout')), 15000);
      });

      await Promise.race([initPromise, timeoutPromise]);
      
      console.log('✅ Client.initialize() completed successfully');

    } catch (error) {
      console.error('❌ Error during initialization:', error);
      this.handleInitializationFailure(error.message);
    }
  }

  private setupEventListeners() {
    if (!this.client) {
      console.error('❌ Cannot setup listeners - client is null');
      return;
    }

    console.log('🔗 Setting up event listeners...');

    // Auth failure
    this.client.on('auth_failure', (msg) => {
      console.error('🚫 Authentication failed:', msg);
      this.handleInitializationFailure(`Auth failure: ${msg}`);
    });

    // Error event (setup first to catch early errors)
    this.client.on('error', (error) => {
      console.error('❌ Client error:', error);
      this.lastError = error.message;
      if (this.isInitializing) {
        this.handleInitializationFailure(`Client error: ${error.message}`);
      }
    });

    // Loading screen
    this.client.on('loading_screen', (percent, message) => {
      console.log(`📱 Loading: ${percent}% - ${message}`);
      // Clear timeout on first loading event (shows client is working)
      if (Number(percent) > 0 && this.initializationTimeout) {
        console.log('📱 First loading event received - client is working');
        clearTimeout(this.initializationTimeout);
        this.initializationTimeout = null;
      }
    });

    // State changes
    this.client.on('change_state', (state) => {
      console.log('🔄 State changed to:', state);
    });

    // QR Code event - THIS IS THE CRITICAL ONE
    this.client.on('qr', (qr) => {
      console.log('🎉 QR CODE RECEIVED! Length:', qr.length);
      this.qrString = qr;
      this.retryCount = 0; // Reset retry count on success
      
      // Clear timeout since we got QR
      if (this.initializationTimeout) {
        clearTimeout(this.initializationTimeout);
        this.initializationTimeout = null;
      }
      
      // Don't set isInitializing to false yet - wait for ready
      console.log('📱 Generating QR in terminal...');
      qrcode.generate(qr, { small: true });
      
      // Set QR expiry (90 seconds)
      setTimeout(() => {
        if (this.qrString === qr && !this.isReady) {
          console.log('⏰ QR expired, restarting...');
          this.restartClient();
        }
      }, 90000);
    });

    // Authenticated
    this.client.on('authenticated', () => {
      console.log('🔐 Authenticated successfully!');
      this.qrString = null;
    });

    // Ready event
    this.client.on('ready', () => {
      console.log('✅ CLIENT IS READY!');
      this.isReady = true;
      this.qrString = null;
      this.isInitializing = false;
      this.lastError = null;
      this.retryCount = 0;
      
      if (this.initializationTimeout) {
        clearTimeout(this.initializationTimeout);
        this.initializationTimeout = null;
      }
    });

    // Disconnected
    this.client.on('disconnected', (reason) => {
      console.log('🔌 Disconnected:', reason);
      this.isReady = false;
      this.qrString = null;
      this.isInitializing = false;
      this.lastError = `Disconnected: ${reason}`;
      
      // Auto reconnect after 5 seconds
      setTimeout(() => {
        console.log('🔄 Auto-reconnecting after disconnect...');
        this.retryCount = 0; // Reset retry count for reconnection
        this.initializeClient();
      }, 5000);
    });

    console.log('✅ Event listeners setup complete');
  }

  private async handleInitializationFailure(error: string) {
    console.error('💥 Initialization failure:', error);
    
    // Clear timeout
    if (this.initializationTimeout) {
      clearTimeout(this.initializationTimeout);
      this.initializationTimeout = null;
    }

    this.isReady = false;
    this.qrString = null;
    this.isInitializing = false;
    this.lastError = error;

    // Destroy client
    if (this.client) {
      try {
        await this.client.destroy();
      } catch (destroyError) {
        console.log('Error destroying failed client:', destroyError.message);
      }
      this.client = null;
    }

    // Retry logic
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      const delay = Math.min(5000 * this.retryCount, 15000); // Increasing delay
      console.log(`🔄 Retrying in ${delay/1000} seconds... (${this.retryCount}/${this.maxRetries})`);
      
      setTimeout(() => {
        this.initializeClient();
      }, delay);
    } else {
      console.error('💔 Max retries reached. Manual restart required.');
      this.lastError = `Max retries exceeded. Last error: ${error}`;
    }
  }

  // Public methods
  public getQRCode(): string | null {
    return this.qrString;
  }

  public isClientReady(): boolean {
    return this.isReady && this.client !== null;
  }

  public getInitializing(): boolean {
    return this.isInitializing;
  }

  public getStatus(): { 
    isReady: boolean; 
    isInitializing: boolean; 
    hasQR: boolean;
    lastError: string | null;
    retryCount: number;
  } {
    return {
      isReady: this.isReady,
      isInitializing: this.isInitializing,
      hasQR: !!this.qrString,
      lastError: this.lastError,
      retryCount: this.retryCount
    };
  }

  public async restartClient(): Promise<void> {
    console.log('🔄 Manual restart requested...');
    this.retryCount = 0; // Reset retry count for manual restart
    
    if (this.initializationTimeout) {
      clearTimeout(this.initializationTimeout);
      this.initializationTimeout = null;
    }

    if (this.client) {
      try {
        await this.client.destroy();
      } catch (error) {
        console.log('Error during manual restart:', error.message);
      }
    }
    
    this.client = null;
    this.isReady = false;
    this.qrString = null;
    this.isInitializing = false;
    this.lastError = null;
    
    // Start fresh
    setTimeout(() => this.initializeClient(), 2000);
  }

  public async sendPDF(number: string, filePath: string): Promise<void> {
    if (!this.isClientReady()) {
      throw new Error('WhatsApp client is not ready. Please login first.');
    }

    if (!fs.existsSync(filePath)) {
      throw new Error('File not found: ' + filePath);
    }

    try {
      const formattedNumber = this.formatPhoneNumber(number);
      const media = MessageMedia.fromFilePath(filePath);
      
      await this.client!.sendMessage(formattedNumber, media, {
        caption: '📄 PaperBill | Invoice/Document - Thank you for your business!'
      });

      console.log(`✅ PDF sent successfully to ${formattedNumber}`);
      
      if (filePath.includes('/tmp/') || filePath.includes('\\temp\\')) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.error('❌ Error sending PDF:', error);
      throw new Error(`Failed to send PDF: ${error.message}`);
    }
  }

  private formatPhoneNumber(number: string): string {
    let cleaned = number.replace(/\D/g, '');
    
    if (cleaned.startsWith('91')) {
      return cleaned + '@c.us';
    }
    
    if (cleaned.length === 10) {
      return '91' + cleaned + '@c.us';
    }
    
    if (cleaned.length === 12) {
      return cleaned + '@c.us';
    }
    
    throw new Error('Invalid phone number format');
  }
}

// Create singleton instance
const whatsappService = new WhatsAppService();

// Export functions
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

export const isWhatsAppInitializing = (): boolean => {
  return whatsappService.getInitializing();
};

export const getWhatsAppStatus = () => {
  return whatsappService.getStatus();
};

// Force start initialization (call this when first QR is requested)
export const forceInitialize = async (): Promise<void> => {
  console.log('🚀 Force initialize requested...');
  return whatsappService.initializeClient();
};