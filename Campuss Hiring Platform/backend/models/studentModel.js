const mongoose = require("mongoose");
const bcrypt = require('bcrypt');
const SALT_ROUNDS = 10;

const jobRecordSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
    required: true
  },
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Job",
    required: true
  },
  roleType: {
    type: String,
    enum: ["INTERN", "FULLTIME"],
    required: true
  },
  salary: {
    type: String,
    required: true
  },

  at: {
    type: Date,
    default: Date.now
  },
  experience: {
    type: String,
    default: ""
  }
}, { _id: false });

const studentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  rollNo: {
    type: String,
    required: true,
    unique: true
  },
  isApproved: {
    type: Boolean,
    default: false
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

  college: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "College",
    required: true
  },

  department: {
    type: String,
    enum: ["CSE", "CSE-IOT", "CSE-AIML", "CSE-AIDS", "CSE-Cyber", "IT", "ECE", "EEE", "Civil", "Mech"],
    required: true
  },

  year: {
    type: String,
    enum: ["1st", "2nd", "3rd", "4th"],
    required: true
  },

  cgpa: {
    type: Number,
    min: 0,
    max: 10
  },

  resumeUrl: String,

  github: String,

  codingProfiles: {
    leetcode: { type: String, default: "" },
    codechef: { type: String, default: "" },
    codeforces: { type: String, default: "" }
  },

  appliedJobs: [jobRecordSchema],
  selectedJobs: [jobRecordSchema],

  offlinePlacements: [
    {
      companyName: { type: String, required: true },
      role: { type: String, required: true },
      jobTitle: { type: String, required: true },
      duration: { type: String, required: true },
      startDate: { type: Date, required: true },
      endDate: { type: Date, required: true },
      salary: { type: String, required: true },
      offerLetterUrl: { type: String, required: true },
      status: {
        type: String,
        enum: ["PENDING", "APPROVED", "REJECTED"],
        default: "PENDING"
      },
      verifiedBy: { type: String, enum: ["PRINCIPAL", "DEPT"], default: null },
      verifiedAt: { type: Date, default: null },
      submittedAt: { type: Date, default: Date.now },
      experience: { type: String, default: "" }
    }
  ]

}, { timestamps: true });

studentSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  try {
    const hash = await bcrypt.hash(this.password, SALT_ROUNDS);
    this.password = hash;
  } catch (err) {
    throw err;
  }
});

studentSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("Student", studentSchema);
