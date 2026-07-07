const express = require("express");
const router = express.Router();
const collegeController = require("../controllers/collegeController");
const authMiddleware = require("../middleware/auth");
const roleMiddleware = require("../middleware/roleauth");

// PRINCIPAL - Get all pending jobs for their college
router.get(
    "/jobs/pending",
    authMiddleware,
    roleMiddleware(["PRINCIPAL", "DEPT"]),
    collegeController.getPendingJobs
);

// PRINCIPAL/DEPT - Get all approved jobs for their college
router.get(
    "/jobs/approved",
    authMiddleware,
    roleMiddleware(["PRINCIPAL", "DEPT"]),
    collegeController.getApprovedJobs
);

// PRINCIPAL - Verify a job (mark as LIVE for college)
router.patch(
    "/jobs/:jobId/verify",
    authMiddleware,
    roleMiddleware(["PRINCIPAL"]),
    collegeController.verifyJob
);

// DEPT - Verify a job for their specific department
router.patch(
    "/jobs/:jobId/dept-verify",
    authMiddleware,
    roleMiddleware(["DEPT"]),
    collegeController.deptVerifyJob
);

// PRINCIPAL/DEPT - Verify a student's progress update
router.patch(
    "/jobs/:jobId/progress/verify",
    authMiddleware,
    roleMiddleware(["PRINCIPAL", "DEPT"]),
    collegeController.verifyStudentProgress
);

// PRINCIPAL/DEPT - View student progress for a job
router.get(
    "/jobs/:jobId/progress",
    authMiddleware,
    roleMiddleware(["PRINCIPAL", "DEPT"]),
    collegeController.getJobProgress
);

// PRINCIPAL/DEPT - Get placement statistics
router.get(
    "/stats/placement",
    authMiddleware,
    roleMiddleware(["PRINCIPAL", "DEPT"]),
    collegeController.getPlacementStats
);

// PRINCIPAL/DEPT - Get experiences shared by students in the college
router.get(
    "/experiences",
    authMiddleware,
    roleMiddleware(["PRINCIPAL", "DEPT"]),
    collegeController.getCollegeExperiences
);

// PRINCIPAL/DEPT - Get pending offline placements
router.get(
    "/offline-placements/pending",
    authMiddleware,
    roleMiddleware(["PRINCIPAL", "DEPT"]),
    collegeController.getPendingOfflinePlacements
);

// PRINCIPAL/DEPT - Verify offline placement
router.patch(
    "/offline-placements/:studentId/:placementId/verify",
    authMiddleware,
    roleMiddleware(["PRINCIPAL", "DEPT"]),
    collegeController.verifyOfflinePlacement
);

// PRINCIPAL/DEPT - Get pending student logins
router.get(
    "/students/pending",
    authMiddleware,
    roleMiddleware(["PRINCIPAL", "DEPT"]),
    collegeController.getPendingStudents
);

// PRINCIPAL/DEPT - Approve student login
router.patch(
    "/students/:studentId/approve",
    authMiddleware,
    roleMiddleware(["PRINCIPAL", "DEPT"]),
    collegeController.approveStudent
);

// PRINCIPAL/DEPT - Get all students (with optional year filter)
router.get(
    "/students",
    authMiddleware,
    roleMiddleware(["PRINCIPAL", "DEPT"]),
    collegeController.getAllStudents
);

module.exports = router;
