/**
 * Promotes a user to ADMIN so they can access the /admin dashboard.
 * Reads MONGODB_URI straight from .env.local (no extra deps needed).
 *
 * Usage:
 *   node scripts/make-admin.js someone@example.com
 */
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

function loadEnvLocal() {
  const envPath = path.join(__dirname, '..', '.env.local');
  const content = fs.readFileSync(envPath, 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error('Usage: node scripts/make-admin.js <email>');
    process.exit(1);
  }

  loadEnvLocal();
  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI not found in .env.local');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);

  const UserModel = mongoose.model(
    'User',
    new mongoose.Schema({ email: String, role: String }, { strict: false })
  );

  const user = await UserModel.findOneAndUpdate(
    { email: email.toLowerCase().trim() },
    { $set: { role: 'ADMIN' } },
    { new: true }
  );

  if (!user) {
    console.error(`No user found with email "${email}".`);
    process.exit(1);
  }

  console.log(`✅ ${user.email} is now ADMIN. They can now open /admin in the app.`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
