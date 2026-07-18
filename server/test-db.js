import mongoose from "mongoose";

const MONGO_URI = "mongodb+srv://riddhi9892jaiswal_db_user:Riddhi%409892@learninghubcluster.idxsneg.mongodb.net/ai-learning-hub?appName=learninghubcluster";

console.log("Connecting to:", MONGO_URI);

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log("Connected successfully");
    process.exit(0);
  })
  .catch(err => {
    console.error("Connection error:", err);
    process.exit(1);
  });
