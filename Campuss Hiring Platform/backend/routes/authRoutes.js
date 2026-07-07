const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

// Create College (for initial setup)
router.post("/create-college", authController.createCollege);

// Student Login
router.post("/student/login", authController.studentLogin);

// DEPT/College Login
router.post("/college/login", authController.collegeLogin);

// Student Registration
router.post("/student/register", authController.studentRegister);

// Company Registration
router.post("/company/register", authController.companyRegister);

// College Registration
router.post("/college/register", authController.collegeRegister);

// Company Login
router.post("/company/login", authController.companyLogin);

// Get all colleges
router.get("/colleges", authController.getColleges);

module.exports = router;
