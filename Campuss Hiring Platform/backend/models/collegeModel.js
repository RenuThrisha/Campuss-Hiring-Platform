const mongoose = require("mongoose");
const bcrypt = require('bcrypt');
const SALT_ROUNDS = 10;

const collegeUserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },

  email: {
    type: String,
    required: true
  },

  password: {
    type: String,
    required: true
  },

  role: {
    type: String,
    enum: ["PRINCIPAL", "DEPT"],
    required: true
  },

  department: {
    type: String,
    default: null
  }
});

const collegeSchema = new mongoose.Schema({
  collegeName: {
    type: String,
    required: true
  },

  collegeCode: {
    type: String,
    required: true,
    unique: true
  },

  departments: [
    {
      type: String,
      required: true
    }
  ],

  users: [collegeUserSchema],

  verifiedJobs: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job"
    }
  ]

}, { timestamps: true });

collegeSchema.pre('save', async function () {
  try {
    if (this.users && this.users.length) {
      for (const user of this.users) {
        if (user.password && !user.password.startsWith('$2')) {
          user.password = await bcrypt.hash(user.password, SALT_ROUNDS);
        }
      }
    }
  } catch (err) {
    throw err;
  }
});

collegeUserSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("College", collegeSchema);
