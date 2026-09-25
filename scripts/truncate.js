/* eslint-disable @typescript-eslint/no-require-imports */
const mongoose = require("mongoose");
const { loadEnvConfig } = require("@next/env");
loadEnvConfig(process.cwd());

const MONGODB_URI = process.env.MONGODB_URI;

async function truncate() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB for truncation.");

    const collections = await mongoose.connection.db.collections();
    for (let collection of collections) {
      if (collection.collectionName === "users") {
        console.log("Skipping users collection");
        continue;
      }
      
      console.log(`Truncating ${collection.collectionName}...`);
      await collection.deleteMany({});
    }

    console.log("All collections (except User) have been truncated successfully.");
  } catch (error) {
    console.error("Error truncating collections:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
    process.exit(0);
  }
}

truncate();
