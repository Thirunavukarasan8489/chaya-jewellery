const { loadEnvConfig } = require("@next/env");
loadEnvConfig(process.cwd());
const mongoose = require("mongoose");

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("Missing MONGODB_URI in .env.local");
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log("Connected to MongoDB");

  const collections = await mongoose.connection.db.listCollections().toArray();
  const collectionNames = collections.map(c => c.name);
  console.log("Found collections:", collectionNames);

  for (const collectionName of collectionNames) {
    if (collectionName === "users") {
      console.log("Skipping 'users' collection");
      continue;
    }

    console.log(`Truncating collection: ${collectionName}`);
    await mongoose.connection.db.collection(collectionName).deleteMany({});
  }

  console.log("Database cleanup completed successfully.");
  process.exit(0);
}

main().catch(err => {
  console.error("Error during cleanup:", err);
  process.exit(1);
});
