const Student = require("../models/studentModel");
const College = require("../models/collegeModel");
const Job = require("../models/jobModel");
const { parseSalary } = require("../utils/salaryParser");

exports.getProfile = async (req, res) => {
    try {
        const student = await Student.findById(req.user.id)
            .populate("college", "collegeName")
            .populate({ path: "selectedJobs.job", populate: { path: "company", select: "companyName" } })
            .select("-password");

        if (!student) return res.status(404).json({ message: "Student not found" });

        res.status(200).json({ message: "Profile retrieved successfully", student });
    } catch (err) {
        console.error("Error fetching profile:", err);
        res.status(500).json({ message: "Error fetching profile", error: err.message });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const body = req.body || {};
        const { github, resumeUrl, codingProfiles } = body;

        const student = await Student.findById(req.user.id);
        if (!student) return res.status(404).json({ message: "Student not found" });

        if (github) student.github = github;
        if (resumeUrl) student.resumeUrl = resumeUrl;
        if (codingProfiles && typeof codingProfiles === 'object') {
            student.codingProfiles = Object.assign({}, student.codingProfiles || {}, {
                leetcode: codingProfiles.leetcode ?? student.codingProfiles?.leetcode ?? "",
                codechef: codingProfiles.codechef ?? student.codingProfiles?.codechef ?? "",
                codeforces: codingProfiles.codeforces ?? student.codingProfiles?.codeforces ?? "",
            });
        }

        await student.save();
        const updatedStudent = await Student.findById(req.user.id).select("-password");
        res.status(200).json({ message: "Profile updated successfully", student: updatedStudent });
    } catch (err) {
        console.error("Error updating profile:", err);
        res.status(500).json({ message: "Error updating profile", error: err.message });
    }
};

const isJobApprovedForStudent = (job, student) => {
    const approval = job.collegeApprovals.find(a => {
        const isCollegeMatch = a.college.toString() === student.college.toString();
        const isPrincipalApproved = a.principalApproved === true;

        if (student.year === "4th") {
            // Allow visibility immediately after principal approval for 4th-years.
            // This makes jobs visible right after the college/principal marks them LIVE.
            return isCollegeMatch && isPrincipalApproved;
        }

        return isCollegeMatch && isPrincipalApproved;
    });

    return Boolean(approval);
};

const isDeptMatch = (jobDepts, studentDept) => {
    if (!Array.isArray(jobDepts) || !studentDept) return false;
    const sd = studentDept.toLowerCase();
    return jobDepts.some(d => {
        if (!d) return false;
        const jd = d.toLowerCase();
        return jd === sd || sd.startsWith(jd) || jd.startsWith(sd);
    });
};

exports.getEligibleJobs = async (req, res) => {
    try {
        const student = await Student.findById(req.user.id);
        if (!student) return res.status(404).json({ message: "Student not found" });

        // Get student's current placements (APPROVED only)
        const activePlacements = [
            ...student.selectedJobs,
            ...student.offlinePlacements.filter(p => p.status === "APPROVED").map(p => ({
                roleType: p.duration === "Full-time" ? "FULLTIME" : "INTERN",
                salary: p.salary
            }))
        ];

        const hasInternship = activePlacements.some(p => p.roleType === "INTERN");
        const fullTimePlacements = activePlacements.filter(p => p.roleType === "FULLTIME");
        const maxFTSalary = fullTimePlacements.length > 0
            ? Math.max(...fullTimePlacements.map(p => parseSalary(p.salary)))
            : 0;

        const jobs = await Job.find({
            status: "LIVE",
            colleges: student.college,
            eligibleYears: student.year,
            eligibleCGPA: { $lte: student.cgpa || 0 }
        }).populate("company", "companyName description website");

        const filteredJobs = jobs.filter(job => {
            if (!isJobApprovedForStudent(job, student)) {
                return false;
            }

            if (!isDeptMatch(job.departments, student.department)) {
                return false;
            }

            if (job.roleType === "INTERN") {
                return !hasInternship; // Ineligible if already has an internship
            }
            if (job.roleType === "FULLTIME") {
                if (maxFTSalary === 0) return true; // No FT job, eligible for any FT
                const newSalary = parseSalary(job.salary);
                return newSalary >= 2 * maxFTSalary; // Eligible if salary is 2x or more
            }
            return true;
        });

        res.status(200).json({ jobs: filteredJobs });
    } catch (err) {
        console.error("Error fetching eligible jobs:", err);
        res.status(500).json({ message: "Error fetching eligible jobs", error: err.message });
    }
};

exports.applyForJob = async (req, res) => {
    try {
        const { jobId } = req.params;
        const student = await Student.findById(req.user.id);
        if (!student) return res.status(404).json({ message: "Student not found" });

        const job = await Job.findById(jobId);
        if (!job || job.status !== "LIVE") return res.status(404).json({ message: "Job not found or not active" });
        if (job.deadline && new Date() > job.deadline) {
            return res.status(403).json({ message: "Application deadline has passed for this job" });
        }
        const isCollegeEligible = Array.isArray(job.colleges) && job.colleges.some(c => c.toString() === student.college.toString());
        const isYearEligible = Array.isArray(job.eligibleYears) && job.eligibleYears.includes(student.year);
        const isCGPAEligible = (student.cgpa || 0) >= job.eligibleCGPA;
        const approval = isJobApprovedForStudent(job, student);

        // Department matching: be flexible for 4th years if principal already approved
        const deptMatched = isDeptMatch(job.departments, student.department);
        let isDeptEligible = false;
        if (student.year === '4th') {
            // allow if principal approved (approval already checks college+principal)
            isDeptEligible = approval || deptMatched;
        } else {
            isDeptEligible = deptMatched;
        }

        const failures = [];
        if (!isCollegeEligible) failures.push('College mismatch');
        if (!isDeptEligible) failures.push('Department not eligible');
        if (!isYearEligible) failures.push('Year not eligible');
        if (!isCGPAEligible) failures.push('CGPA below required');
        if (!approval) failures.push('Pending college/principal approval');

        if (failures.length > 0) {
            return res.status(403).json({ message: 'You are not eligible for this job', reasons: failures });
        }

        // Apply Salary/Internship Rules
        const activePlacements = [
            ...student.selectedJobs,
            ...student.offlinePlacements.filter(p => p.status === "APPROVED").map(p => ({
                roleType: p.duration === "Full-time" ? "FULLTIME" : "INTERN",
                salary: p.salary
            }))
        ];

        if (job.roleType === "INTERN" && activePlacements.some(p => p.roleType === "INTERN")) {
            return res.status(403).json({ message: "You already have an active internship and cannot apply for another." });
        }

        if (job.roleType === "FULLTIME") {
            const fullTimePlacements = activePlacements.filter(p => p.roleType === "FULLTIME");
            if (fullTimePlacements.length > 0) {
                const maxFTSalary = Math.max(...fullTimePlacements.map(p => parseSalary(p.salary)));
                const newSalary = parseSalary(job.salary);
                if (newSalary < 2 * maxFTSalary) {
                    return res.status(403).json({ message: `Your current placement salary is ${maxFTSalary}. You can only apply for jobs offering at least ${2 * maxFTSalary} (2x your current CTC).` });
                }
            }
        }

        if (student.appliedJobs.some(app => app.job.toString() === jobId)) return res.status(400).json({ message: "Already applied for this job" });

        job.applicants.push(student._id);
        const initialRound = job.rounds && job.rounds.length > 0 ? job.rounds[0] : "Application Submitted";
        job.applicantProgress.push({
            student: student._id,
            currentRound: initialRound,
            status: "IN_PROGRESS",
            isVerified: true,
            verifiedAt: new Date()
        });
        // Some older job documents may not have the new required `deadline` field.
        // Skip schema validation when saving here to avoid failing applies on legacy docs.
        await job.save({ validateBeforeSave: false });

        student.appliedJobs.push({
            company: job.company,
            job: jobId,
            roleType: job.roleType,
            salary: job.salary,
            at: new Date()
        });
        await student.save();

        res.status(200).json({ message: "Applied successfully" });
    } catch (err) {
        console.error("Error applying for job:", err);
        res.status(500).json({ message: "Error applying for job", error: err.message });
    }
};

exports.getApplications = async (req, res) => {
    try {
        const student = await Student.findById(req.user.id)
            .populate({ path: "appliedJobs.job", populate: { path: "company", select: "companyName" } })
            .populate({ path: "selectedJobs.job", populate: { path: "company", select: "companyName" } });

        const enrichedApplied = student.appliedJobs.map(appRecord => {
            const job = appRecord.job;
            if (!job) return appRecord;
            const progress = job.applicantProgress?.find(p => p.student.toString() === req.user.id);
            return {
                ...appRecord.toObject(),
                progress: progress ? {
                    currentRound: progress.isVerified ? progress.currentRound : "Verification Pending",
                    status: progress.isVerified ? progress.status : "Pending College Review",
                    updatedAt: progress.updatedAt,
                    isVerified: progress.isVerified
                } : null
            };
        });

        res.status(200).json({ applied: enrichedApplied, selected: student.selectedJobs });
    } catch (err) {
        console.error("Error fetching applications:", err);
        res.status(500).json({ message: "Error fetching applications", error: err.message });
    }
};

exports.submitOfflinePlacement = async (req, res) => {
    try {
        const { companyName, role, jobTitle, duration, startDate, endDate, salary, offerLetterUrl } = req.body;
        if (!companyName || !role || !jobTitle || !duration || !startDate || !endDate || !salary || !offerLetterUrl) {
            return res.status(400).json({ message: "All fields including offer letter are required" });
        }

        const student = await Student.findById(req.user.id);
        if (!student) return res.status(404).json({ message: "Student not found" });

        student.offlinePlacements.push({
            companyName, role, jobTitle, duration,
            startDate, endDate, salary, offerLetterUrl,
            status: "PENDING"
        });

        await student.save();
        res.status(201).json({ message: "Offline placement submitted successfully", offlinePlacements: student.offlinePlacements });
    } catch (err) {
        console.error("Error submitting offline placement:", err);
        res.status(500).json({ message: "Error submitting offline placement", error: err.message });
    }
};

exports.getOfflinePlacements = async (req, res) => {
    try {
        const student = await Student.findById(req.user.id).select("offlinePlacements");
        if (!student) return res.status(404).json({ message: "Student not found" });
        res.status(200).json({ offlinePlacements: student.offlinePlacements });
    } catch (err) {
        console.error("Error fetching offline placements:", err);
        res.status(500).json({ message: "Error fetching offline placements", error: err.message });
    }
};

exports.deptCreateStudent = async (req, res) => {
    try {
        const { name, email, password, department, year, cgpa } = req.body;
        if (!name || !email || !password || !department || !year) {
            return res.status(400).json({ message: "Name, email, password, department, and year are required" });
        }

        const existingStudent = await Student.findOne({ email });
        if (existingStudent) return res.status(409).json({ message: "Student with this email already exists" });

        const college = await College.findOne({ "users._id": req.user.id });
        if (!college) return res.status(404).json({ message: "College not found for this DEPT user" });

        const newStudent = new Student({
            name, email, password, college: college._id,
            department, year, cgpa: cgpa || null
        });

        await newStudent.save();
        res.status(201).json({
            message: "Student created successfully",
            student: {
                id: newStudent._id,
                name: newStudent.name,
                email: newStudent.email,
                department: newStudent.department,
                year: newStudent.year,
                cgpa: newStudent.cgpa
            }
        });
    } catch (err) {
        console.error("Error creating student:", err);
        res.status(500).json({ message: "Error creating student", error: err.message });
    }
};

exports.deptGetStudents = async (req, res) => {
    try {
        const college = await College.findOne({ "users._id": req.user.id });
        if (!college) return res.status(404).json({ message: "College not found for this DEPT user" });

        const deptDepartment = req.user.department;
        const students = await Student.find({ college: college._id, department: deptDepartment }).select("-password");
        res.status(200).json({ message: "Students retrieved successfully", count: students.length, students });
    } catch (err) {
        console.error("Error fetching students:", err);
        res.status(500).json({ message: "Error fetching students", error: err.message });
    }
};

exports.addPlacementExperience = async (req, res) => {
    try {
        const { placementId } = req.params;
        const { type, experience } = req.body;

        if (!type || !experience) {
            return res.status(400).json({ message: "Placement type (ON_CAMPUS/OFF_CAMPUS) and experience text are required" });
        }

        const student = await Student.findById(req.user.id);
        if (!student) return res.status(404).json({ message: "Student not found" });

        if (type === "ON_CAMPUS") {
            const placementIndex = student.selectedJobs.findIndex(j => j.job.toString() === placementId);
            if (placementIndex === -1) return res.status(404).json({ message: "On-campus placement not found in your selected jobs" });
            student.selectedJobs[placementIndex].experience = experience;
        } else if (type === "OFF_CAMPUS") {
            const placementIndex = student.offlinePlacements.findIndex(p => p._id.toString() === placementId);
            if (placementIndex === -1) return res.status(404).json({ message: "Off-campus placement not found" });
            if (student.offlinePlacements[placementIndex].status !== 'APPROVED') {
                return res.status(403).json({ message: "You can only add experience for approved off-campus placements" });
            }
            student.offlinePlacements[placementIndex].experience = experience;
        } else {
            return res.status(400).json({ message: "Invalid placement type. Use ON_CAMPUS or OFF_CAMPUS" });
        }

        await student.save();
        res.status(200).json({ message: "Experience added successfully" });
    } catch (err) {
        console.error("Error adding experience:", err);
        res.status(500).json({ message: "Error adding experience", error: err.message });
    }
};

exports.getAllExperiences = async (req, res) => {
    try {
        // Check if the requesting user is a 4th-year student
        const currentUser = await Student.findById(req.user.id);
        if (!currentUser) return res.status(404).json({ message: "Student not found" });

        // Fetch students from the same college and department who have shared experiences
        const students = await Student.find({
            college: currentUser.college,
            department: currentUser.department,
            $or: [
                { "selectedJobs.experience": { $ne: "" } },
                { "offlinePlacements.experience": { $ne: "" } }
            ]
        }).populate({
            path: "selectedJobs.job",
            select: "title",
            populate: { path: "company", select: "companyName" }
        });

        const allExperiences = [];

        students.forEach(s => {
            // Aggregate from on-campus placements
            s.selectedJobs.forEach(j => {
                if (j.experience) {
                    allExperiences.push({
                        studentName: s.name,
                        companyName: j.job?.company?.companyName || "Unknown Company",
                        jobTitle: j.job?.title || "Unknown Role",
                        experience: j.experience,
                        type: "ON_CAMPUS",
                        date: j.at
                    });
                }
            });

            // Aggregate from off-campus placements
            s.offlinePlacements.forEach(p => {
                if (p.experience) {
                    allExperiences.push({
                        studentName: s.name,
                        companyName: p.companyName,
                        jobTitle: p.jobTitle,
                        experience: p.experience,
                        type: "OFF_CAMPUS",
                        date: p.verifiedAt || p.submittedAt
                    });
                }
            });
        });

        // Sort by date descending
        allExperiences.sort((a, b) => new Date(b.date) - new Date(a.date));

        res.status(200).json({ experiences: allExperiences });
    } catch (err) {
        console.error("Error fetching all experiences:", err);
        res.status(500).json({ message: "Error fetching all experiences", error: err.message });
    }
};
exports.acceptOffer = async (req, res) => {
    try {
        const { jobId } = req.params;
        const student = await Student.findById(req.user.id);
        if (!student) return res.status(404).json({ message: "Student not found" });

        const job = await Job.findById(jobId);
        if (!job) return res.status(404).json({ message: "Job not found" });

        const progressIndex = job.applicantProgress.findIndex(p =>
            p.student && p.student.toString() === student._id.toString()
        );

        if (progressIndex === -1) {
            return res.status(400).json({ message: "You are not an applicant for this job" });
        }

        if (job.applicantProgress[progressIndex].status !== 'QUALIFIED') {
            return res.status(400).json({
                message: `Current status is ${job.applicantProgress[progressIndex].status}. You can only accept offers when status is QUALIFIED.`
            });
        }

        job.applicantProgress[progressIndex].status = "ACCEPTED";
        job.applicantProgress[progressIndex].updatedAt = new Date();
        await job.save();

        student.selectedJobs.push({
            company: job.company,
            job: jobId,
            roleType: job.roleType,
            salary: job.salary,
            at: new Date()
        });
        await student.save();

        res.status(200).json({ message: "Offer accepted successfully! You are now marked as placed." });
    } catch (err) {
        console.error("Error accepting offer:", err);
        res.status(500).json({ message: `Server error: ${err.message}` });
    }
};

exports.rejectOffer = async (req, res) => {
    try {
        const { jobId } = req.params;
        const job = await Job.findById(jobId);

        if (!job) return res.status(404).json({ message: "Job not found" });

        const progressIndex = job.applicantProgress.findIndex(p => p.student.toString() === req.user.id);
        if (progressIndex === -1 || job.applicantProgress[progressIndex].status !== 'QUALIFIED') {
            return res.status(400).json({ message: "No valid offer found to reject" });
        }

        job.applicantProgress[progressIndex].status = "OFFER_REJECTED";
        job.applicantProgress[progressIndex].updatedAt = new Date();
        await job.save();

        res.status(200).json({ message: "Offer rejected successfully." });
    } catch (err) {
        console.error("Error rejecting offer:", err);
        res.status(500).json({ message: "Error rejecting offer", error: err.message });
    }
};
