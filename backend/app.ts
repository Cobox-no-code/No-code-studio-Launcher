import express from "express";
import cors from "cors";
import router from "./route";


const app = express();


// Enable CORS
app.use(cors());

// JSON middleware
app.use(express.json());


// API routes
app.use("/api", router);

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
