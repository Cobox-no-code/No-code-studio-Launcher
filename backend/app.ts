import cors from "cors";
import express from "express";
import router from "./route";
import { initializeDatabase, initializFirm } from "./lib/db";
// import { initClient } from "./controllers/whatsapp/whatsapp.service";


const app = express();


// Enable CORS
app.use(cors());

// JSON middleware
app.use(express.json());

// initClient()

// API routes
app.use("/api", router);

(async () => {
  try {
     await  initializFirm();  
    await initializeDatabase();        // Create tables if not exists
      // Seed default data if not already present
  } catch (err) {
    console.error("❌ DB Initialization failed:", err);
    process.exit(1); // Exit on failure
  }
})();
// 404 handler
app.use((req, res) => {
  console.warn(`⚠️ 404 Not Found: ${req.method} ${req.url}`);
  res.status(404).json({ error: "Route not found" });
});

// Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`✅ Server is running at http://localhost:${PORT}`);
});

export default app;
