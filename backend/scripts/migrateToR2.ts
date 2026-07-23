import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { Song } from "../src/models";
import { isR2Configured, uploadToR2 } from "../src/services/r2Service";

dotenv.config({ path: path.join(__dirname, "../../.env") });

async function connectDB() {
  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/spotify-clone";
  await mongoose.connect(uri);
  console.log("📦 Connected to MongoDB");
}

async function migrateToR2() {
  await connectDB();

  console.log("\n==================================================");
  console.log("☁️  Cloudflare R2 Library Migration Script");
  console.log("==================================================\n");

  if (!isR2Configured()) {
    console.log("⚠️ Cloudflare R2 credentials are not set in .env.");
    console.log("   Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME to migrate.");
    console.log("\n✨ Dry run complete (0 songs uploaded).");
    await mongoose.disconnect();
    return;
  }

  const readySongs = await Song.find({ status: "ready" });
  console.log(`Found ${readySongs.length} songs with status 'ready' in database.\n`);

  let successCount = 0;
  let skippedCount = 0;
  let failCount = 0;

  for (const song of readySongs) {
    const filename = path.basename(song.filePath || "");

    if (!song.filePath || !fs.existsSync(song.filePath)) {
      console.log(`⚠️ Skipping "${song.title}": local file not found at ${song.filePath}`);
      skippedCount++;
      continue;
    }

    if (song.streamUrl && song.streamUrl.startsWith("http") && !song.streamUrl.includes("localhost")) {
      console.log(`⚡ Skipping "${song.title}": already migrated to remote URL (${song.streamUrl})`);
      skippedCount++;
      continue;
    }

    console.log(`⬆️  Uploading "${song.title}" (${filename})...`);
    try {
      const destinationKey = `tracks/${filename}`;
      const r2Url = await uploadToR2(song.filePath, destinationKey);

      await Song.updateOne(
        { _id: song._id },
        {
          streamUrl: r2Url,
        }
      );

      console.log(`   ✅ Migrated to R2 URL: ${r2Url}`);
      successCount++;
    } catch (err) {
      console.error(`   ❌ Failed to migrate "${song.title}":`, err instanceof Error ? err.message : String(err));
      failCount++;
    }
  }

  console.log(`\n🎉 Migration Complete! Success: ${successCount}, Skipped: ${skippedCount}, Failed: ${failCount}`);
  await mongoose.disconnect();
}

migrateToR2();
