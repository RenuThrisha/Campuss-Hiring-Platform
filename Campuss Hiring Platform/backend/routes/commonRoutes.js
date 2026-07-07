const express = require("express");
const router = express.Router();
const commonController = require("../controllers/commonController");
const authMiddleware = require("../middleware/auth");

// Get Job Details (Common for all roles)
router.get(
    "/jobs/:jobId",
    authMiddleware,
    commonController.getJobDetails
);

module.exports = router;
