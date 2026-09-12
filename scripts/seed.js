/* eslint-disable @typescript-eslint/no-require-imports */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Load environment variables if available
const { loadEnvConfig } = require('@next/env');
loadEnvConfig(process.cwd());

const MONGODB_URI = process.env.MONGODB_URI;
console.log(MONGODB_URI)
// Fallback schema if User model doesn't exist yet
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['SUPER_ADMIN', 'CONTENT_MANAGER', 'LEAD_MANAGER'], default: 'SUPER_ADMIN' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', userSchema);

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const adminEmail = 'admin@chayajewellery.com';
    const projectAdminEmail = 'project@chayajewellery.com';
    const existingAdmin = await User.findOne({ email: adminEmail });
    const existingProjectAdmin = await User.findOne({ email: projectAdminEmail });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);

    if (!existingAdmin) {
      const systemUser = new User({
        name: 'System Admin',
        email: adminEmail,
        password: hashedPassword,
        role: 'SUPER_ADMIN',
      });
      await systemUser.save();
      console.log('System Admin created successfully! (admin@chayajewellery.com / admin123)');
    } else {
      console.log('System Admin already exists.');
    }

    if (!existingProjectAdmin) {
      const projectUser = new User({
        name: 'Project Admin',
        email: projectAdminEmail,
        password: hashedPassword,
        role: 'CONTENT_MANAGER',
      });
      await projectUser.save();
      console.log('Project Admin created successfully! (project@chayajewellery.com / admin123)');
    } else {
      console.log('Project Admin already exists.');
    }

  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

seed();
