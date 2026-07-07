const express = require("express");
const router = express.Router();
const companyController = require("../controllers/companyController");
const authMiddleware = require("../middleware/auth");
const roleMiddleware = require("../middleware/roleauth");

// Create a new job posting
router.post(
    "/jobs",
    authMiddleware,
    roleMiddleware(["COMPANY"]),
    companyController.postJob
);

// Get all jobs posted by the company
router.get(
    "/jobs",
    authMiddleware,
    roleMiddleware(["COMPANY"]),
    companyController.getCompanyJobs
);

// View applicants for a specific job
router.get(
    "/jobs/:jobId/applicants",
    authMiddleware,
    roleMiddleware(["COMPANY"]),
    companyController.getApplicants
);

// Select/Shortlist a student for a job
router.patch(
    "/jobs/:jobId/select",
    authMiddleware,
    roleMiddleware(["COMPANY"]),
    companyController.selectStudent
);

// Update progress for a student in a job
router.patch(
    "/jobs/:jobId/progress",
    authMiddleware,
    roleMiddleware(["COMPANY"]),
    companyController.updateStudentProgress
);

module.exports = router;
