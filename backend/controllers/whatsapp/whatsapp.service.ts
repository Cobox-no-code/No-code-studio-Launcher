// whatsapp.service.ts - Fixed Version - Prevents Restart Loop
import { Client, LocalAuth, MessageMedia } from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';
import fs from 'fs';
import path from 'path';
import os from 'os';

class WhatsAppService {
  private client: Client | null = null;
  private qrString: string | null = null;
  private isReady: boolean = false;
  private isInitializing: boolean = false;
  private initializationTimeout: NodeJS.Timeout | null = null;
  private lastError: string | null = null;
  private retryCount: number = 0;
  private maxRetries: number = 3;
  private browserProcess: any = null;
  private qrExpiryTimeout: NodeJS.Timeout | null = null;
  private isDestroying: boolean = false;
  private processListenersSetup: boolean = false; // Prevent duplicate listeners

  constructor() {
    console.log('📱 WhatsApp Service created - ready for initialization');
    this.setupProcessListeners();
  }

  private setupProcessListeners() {
    if (this.processListenersSetup) return;
    
    // Set max listeners to prevent warnings
    process.setMaxListeners(15);
    
    process.on('SIGINT', this.cleanup.bind(this));
    process.on('SIGTERM', this.cleanup.bind(this));
    process.on('exit', this.cleanup.bind(this));
    
    this.processListenersSetup = true;
  }

  private async cleanup() {
    if (this.isDestroying) return;
    this.isDestroying = true;
    
    console.log('🧹 Cleaning up WhatsApp service...');
    
    // Clear all timeouts
    if (this.initializationTimeout) {
      clearTimeout(this.initializationTimeout);
      this.initializationTimeout = null;
    }
    if (this.qrExpiryTimeout) {
      clearTimeout(this.qrExpiryTimeout);
      this.qrExpiryTimeout = null;
    }
    
    if (this.client) {
      try {
        await this.client.destroy();
      } catch (error) {
        console.log('Cleanup error:', error.message);
      }
    }
  }

  private async forceCleanStart() {
    console.log('🧹 Starting force clean initialization...');
    
    // Clear timeouts first
    if (this.initializationTimeout) {
      clearTimeout(this.initializationTimeout);
      this.initializationTimeout = null;
    }
    if (this.qrExpiryTimeout) {
      clearTimeout(this.qrExpiryTimeout);
      this.qrExpiryTimeout = null;
    }
    
    // Kill existing client more aggressively
    if (this.client) {
      try {
        const browser = this.client.pupBrowser;
        if (browser) {
          await browser.close();
        }
        await this.client.destroy();
        console.log('🗑️ Existing client destroyed');
      } catch (error) {
        console.log('⚠️ Error destroying client:', error.message);
      }
      this.client = null;
    }

    // More aggressive session cleanup
    const sessionPaths = [
      path.resolve(process.cwd(), '.wwebjs_auth'),
      path.resolve(process.cwd(), '.wwebjs_cache'),
      path.resolve(process.cwd(), 'node_modules/.wwebjs_auth'),
      path.resolve(os.tmpdir(), '.wwebjs_auth')
    ];

    for (const sessionPath of sessionPaths) {
      if (fs.existsSync(sessionPath)) {
        try {
          // More aggressive deletion - kill any running processes first
          if (process.platform === 'darwin' || process.platform === 'linux') {
            try {
              const { execSync } = require('child_process');
              execSync(`pkill -f "chromium\\|chrome" || true`, { stdio: 'ignore' });
            } catch (e) {
              // Ignore errors
            }
          }
          
          await this.recursiveDelete(sessionPath);
          console.log(`🗑️ Cleared session: ${sessionPath}`);
        } catch (error) {
          console.log(`⚠️ Could not clear ${sessionPath}:`, error.message);
          // Try alternative deletion method
          try {
            if (process.platform === 'win32') {
              const { execSync } = require('child_process');
              execSync(`rmdir /s /q "${sessionPath}"`, { stdio: 'ignore' });
            } else {
              const { execSync } = require('child_process');
              execSync(`rm -rf "${sessionPath}"`, { stdio: 'ignore' });
            }
          } catch (e) {
            console.log(`⚠️ Alternative delete also failed for ${sessionPath}`);
          }
        }
      }
    }

    // Reset all state
    this.isReady = false;
    this.qrString = null;
    this.isInitializing = false;
    this.lastError = null;
    this.browserProcess = null;
    this.isDestroying = false;
    
    // Longer delay to ensure cleanup is complete
    await new Promise(resolve => setTimeout(resolve, 3000));
    console.log('✅ Force clean completed');
  }

  private async recursiveDelete(dirPath: string) {
    const stats = await fs.promises.stat(dirPath);
    if (stats.isDirectory()) {
      const entries = await fs.promises.readdir(dirPath);
      await Promise.all(entries.map(entry => 
        this.recursiveDelete(path.join(dirPath, entry))
      ));
      await fs.promises.rmdir(dirPath);
    } else {
      await fs.promises.unlink(dirPath);
    }
  }

  public async initializeClient() {
    // Prevent concurrent initializations
    if (this.isInitializing) {
      console.log('⏳ Client is already initializing... Skipping duplicate request');
      return;
    }
    if (this.isReady && this.client) {
    console.log('✅ Client already initialized and ready. Skipping initialization.');
    return;
  }

 

    // Check if we've exceeded retries
    if (this.retryCount >= this.maxRetries) {
      console.log('💔 Max retries reached. Use restartClient() to try again.');
      return;
    }

    this.isInitializing = true;
    console.log(`🚀 Starting WhatsApp initialization (Attempt ${this.retryCount + 1}/${this.maxRetries})`);

    try {
      // Force clean start
      await this.forceCleanStart();

      // Set timeout with proper cleanup
      this.initializationTimeout = setTimeout(() => {
        console.log('⏰ TIMEOUT: Initialization taking too long...');
        this.handleInitializationFailure('Initialization timeout - browser stuck');
      }, 60000); // Increased to 60 seconds

      console.log('🔧 Creating WhatsApp client with enhanced config...');
      
      // Create client with better configuration
      this.client = new Client({
        authStrategy: new LocalAuth({
          clientId: `wa-session-${Date.now()}`,
          dataPath: path.resolve(process.cwd(), '.wwebjs_auth')
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
            '--disable-gpu',
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor',
            '--disable-extensions',
            '--disable-plugins',
            '--disable-images',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding',
            '--memory-pressure-off',
            '--max_old_space_size=4096',
            '--disable-crash-reporter',
            '--disable-dev-tools',
            '--disable-default-apps',
            '--disable-popup-blocking',
            '--disable-prompt-on-repost',
            '--disable-hang-monitor',
            '--disable-sync',
            '--disable-translate',
            '--safebrowsing-disable-auto-update',
            '--disable-client-side-phishing-detection',
            // Additional stability flags
            '--disable-blink-features=AutomationControlled',
            '--disable-infobars',
            '--disable-notifications',
            '--disable-save-password-bubble'
          ],
          timeout: 60000,
          handleSIGINT: false,
          handleSIGTERM: false,
          handleSIGHUP: false,
          defaultViewport: { width: 1366, height: 768 }
        },
        takeoverOnConflict: true,
        takeoverTimeoutMs: 60000
      });

      this.setupEventListeners();

      console.log('🎯 Calling client.initialize()...');
      await this.client.initialize();
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

    // QR Code event - MOST IMPORTANT - Handle QR without restarting
    this.client.on('qr', (qr) => {
      console.log('🎉 QR CODE RECEIVED! Length:', qr.length);
      this.qrString = qr;
      this.retryCount = 0; // Reset retry count on QR success
      
      // Clear initialization timeout since we got QR
      if (this.initializationTimeout) {
        clearTimeout(this.initializationTimeout);
        this.initializationTimeout = null;
      }
      
      console.log('📱 Generating QR in terminal...');
      qrcode.generate(qr, { small: true });
      
      // Set QR expiry timeout - but DON'T restart automatically
      if (this.qrExpiryTimeout) {
        clearTimeout(this.qrExpiryTimeout);
      }
      
      this.qrExpiryTimeout = setTimeout(() => {
        if (this.qrString === qr && !this.isReady) {
          console.log('⚠️ QR expired, but NOT restarting automatically');
          console.log('💡 Frontend should handle QR refresh by calling getQRCode() again');
          this.qrString = null; // Clear expired QR
          // Don't restart - let frontend handle it
        }
      }, 90000);
    });

    // Ready event - Enhanced
    this.client.on('ready', () => {
      console.log('✅ CLIENT IS READY!');
      this.isReady = true;
      this.qrString = null;
      this.isInitializing = false;
      this.lastError = null;
      this.retryCount = 0;
      
      // Clear all timeouts
      if (this.initializationTimeout) {
        clearTimeout(this.initializationTimeout);
        this.initializationTimeout = null;
      }
      if (this.qrExpiryTimeout) {
        clearTimeout(this.qrExpiryTimeout);
        this.qrExpiryTimeout = null;
      }

      const info = this.client?.info;
      if (info) {
        console.log('📱 WhatsApp Info:', {
          name: info.pushname,
          number: info.wid.user,
          platform: info.platform
        });
      }
    });

    // Authenticated
    this.client.on('authenticated', () => {
      console.log('🔐 Authenticated successfully!');
      this.qrString = null;
      if (this.qrExpiryTimeout) {
        clearTimeout(this.qrExpiryTimeout);
        this.qrExpiryTimeout = null;
      }
    });

    // Loading screen
    this.client.on('loading_screen', (percent, message) => {
      console.log(`📱 Loading: ${percent}% - ${message}`);
    });

    // State changes
    this.client.on('change_state', (state) => {
      console.log('🔄 State changed to:', state);
    });

    // Disconnected - Handle without auto-restart
    this.client.on('disconnected', (reason) => {
      console.log('🔌 Client disconnected:', reason);
      this.isReady = false;
      this.qrString = null;
      
      if (!this.isInitializing) {
        this.isInitializing = false;
        this.lastError = `Disconnected: ${reason}`;
        console.log('💡 Client disconnected - manual restart required');
        // Don't auto-reconnect - let user manually restart
      }
    });

    // Error event
    this.client.on('error', (error) => {
      console.error('❌ Client error:', error);
      this.lastError = error.message;
      
      // Only restart for critical errors, not navigation failures
      if (error.message.includes('Target closed') && !this.isInitializing) {
        console.log('🔄 Browser target closed - manual restart may be needed');
      }
    });

    // Auth failure
    this.client.on('auth_failure', (msg) => {
      console.error('🚫 Authentication failed:', msg);
      this.handleInitializationFailure(`Auth failure: ${msg}`);
    });

    console.log('✅ Event listeners setup complete');
  }

  private async handleInitializationFailure(error: string) {
    console.error('💥 Initialization failure:', error);
    
    // Clear timeouts
    if (this.initializationTimeout) {
      clearTimeout(this.initializationTimeout);
      this.initializationTimeout = null;
    }
    if (this.qrExpiryTimeout) {
      clearTimeout(this.qrExpiryTimeout);
      this.qrExpiryTimeout = null;
    }

    this.isReady = false;
    this.qrString = null;
    this.isInitializing = false;
    this.lastError = error;

    // Cleanup client
    if (this.client) {
      try {
        const browser = this.client.pupBrowser;
        if (browser) {
          await browser.close();
        }
        await this.client.destroy();
      } catch (destroyError) {
        console.log('Error destroying failed client:', destroyError.message);
      }
      this.client = null;
    }

    // Only retry for specific errors, not all errors
    const shouldRetry = error.includes('timeout') || 
                       error.includes('Navigation failed') ||
                       error.includes('browser has disconnected');

    if (shouldRetry && this.retryCount < this.maxRetries) {
      this.retryCount++;
      const delay = Math.min(5000 * Math.pow(2, this.retryCount - 1), 30000);
      console.log(`🔄 Retrying in ${delay/1000} seconds... (${this.retryCount}/${this.maxRetries})`);
      
      setTimeout(() => {
        this.initializeClient();
      }, delay);
    } else {
      console.error('💔 Max retries reached or non-retryable error. Use restartClient() to try again manually.');
      this.lastError = `Max retries exceeded or critical error. Last error: ${error}`;
    }
  }

  // Public methods
  public getQRCode(): string | null {
    console.log('🎯 QR Code requested...');
    
    // Don't auto-start if we're in error state with max retries
    if (this.retryCount >= this.maxRetries && this.lastError) {
      console.log('💔 Cannot generate QR - max retries exceeded');
      return null;
    }
    
    // If not initializing and no QR and not ready, start initialization
    if (!this.isInitializing && !this.qrString && !this.isReady) {
      console.log('🚀 Starting initialization on QR request...');
      this.initializeClient();
    }
    
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
    isInit: boolean;
    hasQR: boolean;
    retryCount: number;
    lastError: string | null;
  } {
    const status = {
      isReady: this.isReady,
      isInit: this.isInitializing,
      hasQR: !!this.qrString,
      retryCount: this.retryCount,
      lastError: this.lastError
    };
    
    console.log('📊 Current status:', status);
    return status;
  }

  public async restartClient(): Promise<void> {
    console.log('🔄 Manual restart requested...');
    
    // Reset everything for manual restart
    this.retryCount = 0;
    this.lastError = null;
    
    // Clear timeouts
    if (this.initializationTimeout) {
      clearTimeout(this.initializationTimeout);
      this.initializationTimeout = null;
    }
    if (this.qrExpiryTimeout) {
      clearTimeout(this.qrExpiryTimeout);
      this.qrExpiryTimeout = null;
    }

    // Force stop current state
    this.isInitializing = false;
    this.isReady = false;
    this.qrString = null;

    if (this.client) {
      try {
        const browser = this.client.pupBrowser;
        if (browser) {
          await browser.close();
        }
        await this.client.destroy();
      } catch (error) {
        console.log('Error during manual restart:', error.message);
      }
    }
    
    this.client = null;
    
    // Start fresh after delay
    setTimeout(() => this.initializeClient(), 3000);
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
      
      // Clean up temp files
      if (filePath.includes('/tmp/') || filePath.includes('\\temp\\')) {
        try {
          fs.unlinkSync(filePath);
        } catch (error) {
          console.log('Could not delete temp file:', error.message);
        }
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
  try {
    return whatsappService.getQRCode();
  } catch (error) {
    console.error('Error getting QR code:', error);
    return null;
  }
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

export const forceInitialize = async (): Promise<void> => {
  console.log('🚀 Force initialize requested...');
  return whatsappService.initializeClient();
};