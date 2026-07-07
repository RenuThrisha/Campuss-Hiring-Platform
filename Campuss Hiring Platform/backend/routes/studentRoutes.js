const express = require("express");
const router = express.Router();
const studentController = require("../controllers/studentController");
const authMiddleware = require("../middleware/auth");
const roleMiddleware = require("../middleware/roleauth");

// DEPT - Create Student Details
router.post(
  "/dept/create-student",
  authMiddleware,
  roleMiddleware(["DEPT"]),
  studentController.deptCreateStudent
);

// DEPT - Get all students in their department
router.get(
  "/dept/students",
  authMiddleware,
  roleMiddleware(["DEPT"]),
  studentController.deptGetStudents
);

// Student - Get their own profile
router.get(
  "/profile",
  authMiddleware,
  studentController.getProfile
);

// Student - Update their profile (coding profiles, github, resume, cgpa)
router.put(
  "/profile",
  authMiddleware,
  studentController.updateProfile
);

// Student - Get eligible jobs
router.get(
  "/jobs/eligible",
  authMiddleware,
  roleMiddleware(["STUDENT"]),
  studentController.getEligibleJobs
);

// Student - Apply for a job
router.post(
  "/jobs/:jobId/apply",
  authMiddleware,
  roleMiddleware(["STUDENT"]),
  studentController.applyForJob
);

// Student - Get their applications
router.get(
  "/applications",
  authMiddleware,
  roleMiddleware(["STUDENT"]),
  studentController.getApplications
);

// Student - Submit offline placement
router.post(
  "/offline-placement",
  authMiddleware,
  roleMiddleware(["STUDENT"]),
  studentController.submitOfflinePlacement
);

// Student - Get their offline placements
router.get(
  "/offline-placements",
  authMiddleware,
  roleMiddleware(["STUDENT"]),
  studentController.getOfflinePlacements
);

// Student - Add experience for a placement
router.post(
  "/experience/:placementId",
  authMiddleware,
  roleMiddleware(["STUDENT"]),
  studentController.addPlacementExperience
);

// Student - Get all experiences (restricted to 4th years in controller)
router.get(
  "/experiences/all",
  authMiddleware,
  roleMiddleware(["STUDENT"]),
  studentController.getAllExperiences
);

// Student - Accept/Reject Offer
router.post(
  "/offers/:jobId/accept",
  authMiddleware,
  roleMiddleware(["STUDENT"]),
  studentController.acceptOffer
);

router.post(
  "/offers/:jobId/reject",
  authMiddleware,
  roleMiddleware(["STUDENT"]),
  studentController.rejectOffer
);

module.exports = router;
