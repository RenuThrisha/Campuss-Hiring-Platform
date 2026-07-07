const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },

  description: {
    type: String,
    required: true
  },

  roleType: {
    type: String,
    enum: ["INTERN", "FULLTIME"],
    required: true
  },

  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
    required: true
  },

  colleges: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "College",
      required: true
    }
  ],

  departments: [
    {
      type: String,
      required: true
    }
  ],

  eligibleYears: [
    {
      type: String,
      enum: ["1st", "2nd", "3rd", "4th"],
      required: true
    }
  ],

  salary: {
    type: String,
    required: true
  },

  eligibleCGPA: {
    type: Number,
    min: 0,
    max: 10,
    required: true
  },
  deadline: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ["PENDING", "LIVE"],
    default: "PENDING"
  },

  collegeApprovals: [
    {
      college: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "College"
      },
      principalApproved: {
        type: Boolean,
        default: false
      },
      approvedDepts: [
        {
          type: String
        }
      ]
    }
  ],

  rounds: [
    {
      type: String,
      required: true
    }
  ],

  applicantProgress: [
    {
      student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student"
      },
      currentRound: String, // e.g., "Aptitude Test"
      status: {
        type: String,
        enum: ["IN_PROGRESS", "QUALIFIED", "REJECTED", "ACCEPTED", "OFFER_REJECTED"],
        default: "IN_PROGRESS"
      },
      updatedAt: {
        type: Date,
        default: Date.now
      },
      isVerified: {
        type: Boolean,
        default: false
      },
      verifiedAt: Date,
      verifiedBy: {
        type: String,
        enum: ["PRINCIPAL", "DEPT", "COMPANY"]
      }
    }
  ],

  applicants: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student"
    }
  ],

  selectedStudents: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student"
    }
  ]

}, { timestamps: true });

module.exports = mongoose.model("Job", jobSchema);
