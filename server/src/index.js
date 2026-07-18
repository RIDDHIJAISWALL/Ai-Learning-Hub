import "./polyfill.js";
import mongoose from "mongoose";
import dotenv from "dotenv";
import app from "./app.js";

dotenv.config();

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://riddhi9892jaiswal_db_user:Riddhi%409892@learninghubcluster.idxsneg.mongodb.net/ai-learning-hub?appName=learninghubcluster";

const startServer = async () => {
  try {
    // IP is now active, attempting connection...
    console.log("Attempting to connect to MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Error connecting to MongoDB:", error);
    process.exit(1);
  }
};

startServer();
