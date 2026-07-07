const mongoose = require("mongoose");
const bcrypt = require('bcrypt');
const SALT_ROUNDS = 10;

const companySchema = new mongoose.Schema({
  companyName: {
    type: String,
    required: true
  },

  email: {
    type: String,
    required: true,
    unique: true
  },

  password: {
    type: String,
    required: true,
    select: false
  },

  website: {
    type: String
  },

  description: {
    type: String
  },

  postedJobs: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job"
    }
  ]

}, { timestamps: true });

companySchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  try {
    if (this.password && !this.password.startsWith('$2')) {
      this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
    }
  } catch (err) {
    throw err;
  }
});

companySchema.methods.comparePassword = function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("Company", companySchema);
