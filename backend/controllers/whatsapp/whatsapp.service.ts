// import fs from "fs/promises";
// import path from "path";
// import { Client, LocalAuth, MessageMedia } from "whatsapp-web.js";
// import { app } from "electron";

// const isElectron = !!process.versions.electron;
// const authPath = isElectron? path.join(app.getPath("userData"), "whatsapp-auth"): path.join(process.cwd(), "whatsapp-auth");

// export let client: Client;
// let qrCodeString: string | null = null;
// let status:string="disconnected";

// export const initClient = () => {
//   if (client) return;

//   client = new Client({
//     authStrategy: new LocalAuth({ dataPath: authPath }),
//     puppeteer: {
//       headless: true,
//       args: ["--no-sandbox", "--disable-setuid-sandbox"],
//     },
//   });

//   client.on("qr", (qr) => {
//     qrCodeString = qr;
//     console.log("📱 QR Code received.");
//   });

//   client.on("authenticated", () => {
//     status = "authenticated";
//     console.log("✅ Authenticated.")});
//   client.on("ready", () => {
//     status = "ready";
//     console.log("🚀 WhatsApp Client is ready.")});
//   client.on("disconnected", (reason) => {
//     console.log("❌ Disconnected:", reason);
//     qrCodeString = null;
//   });

//   client.initialize();
// };

// export const getQRCode = (): string | null => qrCodeString;

// export const getStatus = (): string => status;
// export const sendPDF = async (number: string, filePath: string): Promise<boolean> => {
//   if (!client) throw new Error("WhatsApp client not initialized");

//   const formattedNumber = number.includes("@c.us") ? number : `${number}@c.us`;
//   const media = MessageMedia.fromFilePath(filePath);

//   try {
//     await client.sendMessage(formattedNumber, media, {
//       caption: "Here is your PDF file 📄",
//     });

//     // ✅ Delete the file after sending
//     await fs.unlink(filePath);
//     console.log("🗑️ File deleted:", filePath);
//     return true;
//   } catch (err) {
//     status = "disconnected";
//     console.error("❌ Failed to send or delete file:", err);
//     throw err;
//   }
// };
