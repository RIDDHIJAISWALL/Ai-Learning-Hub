import "./polyfill.js";
import mongoose from "mongoose";
import dotenv from "dotenv";
import app from "./app.js";

dotenv.config();

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://riddhi9892jaiswal_db_user:Riddhi%409892@ac-h65y6vi-shard-00-00.idxsneg.mongodb.net:27017,ac-h65y6vi-shard-00-01.idxsneg.mongodb.net:27017,ac-h65y6vi-shard-00-02.idxsneg.mongodb.net:27017/ai-learning-hub?ssl=true&replicaSet=atlas-zxmo15-shard-0&authSource=admin&retryWrites=true&w=majority";

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
