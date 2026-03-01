const mongoose = require('mongoose');

const SystemSettingsSchema = new mongoose.Schema(
  {
    maintenanceMode: { type: Boolean, default: false },
    allowRegistration: { type: Boolean, default: true },
    conceptMapEnabled: { type: Boolean, default: true },
    analyticsEnabled: { type: Boolean, default: true },
    chemicalEquationsEnabled: { type: Boolean, default: true },
    aiThoughtPathRecorderEnabled: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Ensure there is only one settings document
SystemSettingsSchema.statics.getSingleton = async function () {
  let doc = await this.findOne();
  if (!doc) {
    doc = await this.create({});
  }
  return doc;
};

module.exports = mongoose.model('SystemSettings', SystemSettingsSchema);