const Job = require("../models/jobModel");
const College = require("../models/collegeModel");
const Student = require("../models/studentModel");
const { parseSalary } = require("../utils/salaryParser");

exports.getPendingJobs = async (req, res) => {
    try {
        const college = await College.findOne({ "users.email": req.user.email });
        if (!college) return res.status(404).json({ message: "College not found" });

        const pendingJobs = await Job.find({
            colleges: college._id,
            status: "PENDING"
        }).populate("company", "companyName website");

        res.status(200).json({ pendingJobs });
    } catch (err) {
        console.error("Error fetching pending jobs:", err);
        res.status(500).json({ message: "Error fetching pending jobs", error: err.message });
    }
};

exports.getApprovedJobs = async (req, res) => {
    try {
        const college = await College.findOne({ "users.email": req.user.email });
        if (!college) return res.status(404).json({ message: "College not found" });

        const approvedJobs = await Job.find({
            colleges: college._id,
            status: "LIVE"
        }).populate("company", "companyName website");

        res.status(200).json({ approvedJobs });
    } catch (err) {
        console.error("Error fetching approved jobs:", err);
        res.status(500).json({ message: "Error fetching approved jobs", error: err.message });
    }
};

exports.verifyJob = async (req, res) => {
    try {
        const { jobId } = req.params;
        const college = await College.findOne({ "users.email": req.user.email });

        if (!college) return res.status(404).json({ message: "College not found" });

        const job = await Job.findOne({ _id: jobId, colleges: college._id });
        if (!job) return res.status(404).json({ message: "Job not found or not assigned to your college" });

        const collegeIdStr = college._id.toString();
        let approvalIndex = job.collegeApprovals.findIndex(a => a.college.toString() === collegeIdStr);

        if (approvalIndex === -1) {
            job.collegeApprovals.push({
                college: college._id,
                principalApproved: true,
                approvedDepts: []
            });
        } else {
            job.collegeApprovals[approvalIndex].principalApproved = true;
        }

        job.status = "LIVE";
        await job.save();

        await College.findByIdAndUpdate(college._id, { $addToSet: { verifiedJobs: jobId } });

        res.status(200).json({ message: "Principal validation successful", job });
    } catch (err) {
        console.error("Error verifying job:", err);
        res.status(500).json({ message: "Error verifying job", error: err.message });
    }
};

exports.deptVerifyJob = async (req, res) => {
    try {
        const { jobId } = req.params;
        const college = await College.findOne({ "users.email": req.user.email });

        if (!college) return res.status(404).json({ message: "College not found for this DEPT user" });

        const job = await Job.findOne({ _id: jobId, colleges: college._id });
        if (!job) return res.status(404).json({ message: "Job not found or not assigned to your college" });

        const userDept = req.user.department;
        if (!job.departments.includes(userDept)) {
            return res.status(403).json({ message: "This job is not for your department" });
        }

        let approvalIndex = job.collegeApprovals.findIndex(a => a.college.toString() === college._id.toString());

        if (approvalIndex === -1) {
            job.collegeApprovals.push({
                college: college._id,
                principalApproved: false,
                approvedDepts: [userDept]
            });
        } else {
            if (!job.collegeApprovals[approvalIndex].approvedDepts.includes(userDept)) {
                job.collegeApprovals[approvalIndex].approvedDepts.push(userDept);
            }
        }

        await job.save();
        res.status(200).json({ message: "Department validation successful", job });
    } catch (err) {
        console.error("Error in dept verification:", err);
        res.status(500).json({ message: "Error in dept verification", error: err.message });
    }
};

exports.verifyStudentProgress = async (req, res) => {
    try {
        const { jobId } = req.params;
        const { studentId } = req.body;

        const college = await College.findOne({ "users.email": req.user.email });
        if (!college) return res.status(404).json({ message: "College not found" });

        const job = await Job.findOne({ _id: jobId, colleges: college._id });
        if (!job) return res.status(404).json({ message: "Job not found" });

        const progressIndex = job.applicantProgress.findIndex(p => p.student.toString() === studentId);
        if (progressIndex === -1) return res.status(404).json({ message: "Student progress not found for this job" });

        job.applicantProgress[progressIndex].isVerified = true;
        job.applicantProgress[progressIndex].verifiedAt = new Date();
        job.applicantProgress[progressIndex].verifiedBy = req.user.role;

        const currentProgress = job.applicantProgress[progressIndex];

        await job.save();
        res.status(200).json({ message: "Progress verified successfully" });
    } catch (err) {
        console.error("Error verifying progress:", err);
        res.status(500).json({ message: "Error verifying progress", error: err.message });
    }
};

exports.getJobProgress = async (req, res) => {
    try {
        const { jobId } = req.params;
        const college = await College.findOne({ "users.email": req.user.email });
        if (!college) return res.status(404).json({ message: "College not found" });

        const job = await Job.findOne({ _id: jobId, colleges: college._id })
            .populate({
                path: "applicantProgress.student",
                select: "name email department year cgpa"
            });

        if (!job) return res.status(404).json({ message: "Job not found or not assigned to your college" });

        res.status(200).json({
            jobTitle: job.title,
            rounds: job.rounds,
            progress: job.applicantProgress
        });
    } catch (err) {
        console.error("Error fetching job progress:", err);
        res.status(500).json({ message: "Error fetching job progress", error: err.message });
    }
};

exports.getPlacementStats = async (req, res) => {
    try {
        const college = await College.findOne({ "users.email": req.user.email });
        if (!college) return res.status(404).json({ message: "College not found" });

        const { year } = req.query;
        let query = { college: college._id, isApproved: true };

        if (req.user.role === "DEPT") query.department = req.user.department;

        // Apply year filter if provided and not "All"
        if (year && year !== "All") {
            query.year = year;
        }

        // populate selectedJobs -> job -> company and selectedJobs.company so we can aggregate per-company placements
        const students = await Student.find(query)
            .populate({ path: 'selectedJobs.job', populate: { path: 'company', select: 'companyName' } })
            .populate({ path: 'selectedJobs.company', select: 'companyName' });

        const stats = {
            totalStudents: students.length,
            placedStudents: students.filter(s => s.selectedJobs.length > 0).length,
            unplacedStudents: students.filter(s => s.selectedJobs.length === 0).length,
            placementPercentage: students.length > 0
                ? ((students.filter(s => s.selectedJobs.length > 0).length / students.length) * 100).toFixed(2)
                : 0
        };

        // Build company breakdown: companyName -> { total, byDept, byRole, bestPackage }
        const companyMap = {};
        students.forEach(s => {
            (s.selectedJobs || []).forEach(rec => {
                const job = rec.job || {};
                // Prefer company info from the selectedJobs.company (populated),
                // fall back to job.company (populated via job) if needed.
                const companyName = (rec.company && rec.company.companyName) || job.company?.companyName || 'Unknown';
                if (!companyMap[companyName]) companyMap[companyName] = { total: 0, byDept: {}, byRole: { INTERN: 0, FULLTIME: 0 }, bestPackageNum: 0, bestPackageStr: null };

                companyMap[companyName].total += 1;

                const dept = s.department || 'Unknown';
                companyMap[companyName].byDept[dept] = (companyMap[companyName].byDept[dept] || 0) + 1;

                const role = rec.roleType || 'FULLTIME';
                companyMap[companyName].byRole[role] = (companyMap[companyName].byRole[role] || 0) + 1;

                // Track best (highest) package for the company
                try {
                    const num = parseSalary(rec.salary);
                    if (num > (companyMap[companyName].bestPackageNum || 0)) {
                        companyMap[companyName].bestPackageNum = num;
                        companyMap[companyName].bestPackageStr = rec.salary;
                    }
                } catch (e) {
                    // ignore parse errors
                }
            });
        });

        stats.companyBreakdown = companyMap;

        if (req.user.role === "PRINCIPAL") {
            const deptBreakdown = {};
            college.departments.forEach(dept => {
                const deptStudents = students.filter(s => s.department === dept);
                deptBreakdown[dept] = {
                    total: deptStudents.length,
                    placed: deptStudents.filter(s => s.selectedJobs.length > 0).length,
                    unplaced: deptStudents.filter(s => s.selectedJobs.length === 0).length,
                    percentage: deptStudents.length > 0
                        ? ((deptStudents.filter(s => s.selectedJobs.length > 0).length / deptStudents.length) * 100).toFixed(2)
                        : 0
                };
            });
            stats.deptBreakdown = deptBreakdown;
        }

        res.status(200).json({ stats });
    } catch (err) {
        console.error("Error fetching placement stats:", err);
        res.status(500).json({ message: "Error fetching placement stats", error: err.message });
    }
};

exports.getPendingOfflinePlacements = async (req, res) => {
    try {
        const college = await College.findOne({ "users.email": req.user.email });
        if (!college) return res.status(404).json({ message: "College not found" });

        let query = { college: college._id, "offlinePlacements.status": "PENDING" };
        if (req.user.role === "DEPT") query.department = req.user.department;

        const students = await Student.find(query).select("name email department year offlinePlacements");

        const pendingPlacements = [];
        students.forEach(student => {
            student.offlinePlacements.forEach(placement => {
                if (placement.status === "PENDING") {
                    pendingPlacements.push({
                        studentId: student._id,
                        studentName: student.name,
                        studentEmail: student.email,
                        studentDept: student.department,
                        placement
                    });
                }
            });
        });

        res.status(200).json({ pendingPlacements });
    } catch (err) {
        console.error("Error fetching pending offline placements:", err);
        res.status(500).json({ message: "Error fetching pending offline placements", error: err.message });
    }
};

exports.verifyOfflinePlacement = async (req, res) => {
    try {
        const { studentId, placementId } = req.params;
        const { status } = req.body;

        if (!["APPROVED", "REJECTED"].includes(status)) return res.status(400).json({ message: "Invalid status" });

        const student = await Student.findById(studentId);
        if (!student) return res.status(404).json({ message: "Student not found" });

        const placementIndex = student.offlinePlacements.findIndex(p => p._id.toString() === placementId);
        if (placementIndex === -1) return res.status(404).json({ message: "Placement not found" });

        student.offlinePlacements[placementIndex].status = status;
        student.offlinePlacements[placementIndex].verifiedBy = req.user.role;
        student.offlinePlacements[placementIndex].verifiedAt = new Date();

        await student.save();
        res.status(200).json({ message: `Placement ${status.toLowerCase()} successfully` });
    } catch (err) {
        console.error("Error verifying offline placement:", err);
        res.status(500).json({ message: "Error verifying offline placement", error: err.message });
    }
};

exports.getPendingStudents = async (req, res) => {
    try {
        const userEmail = req.user.email;
        // Case-insensitive search for college user
        const college = await College.findOne({
            "users.email": { $regex: new RegExp(`^${userEmail}$`, "i") }
        });

        if (!college) {
            console.error(`College not found for email: ${userEmail}`);
            return res.status(404).json({ message: "College not found" });
        }

        let query = { college: college._id, isApproved: false };

        // Only apply department filter if the user is DEPT and HAS a department set
        if (req.user.role === "DEPT" && req.user.department) {
            query.department = req.user.department;
        }

        const pendingStudents = await Student.find(query)
            .select("name email department year rollNo")
            .sort({ createdAt: -1 }); // Show newest first

        console.log(`[PendingStudents] Found ${pendingStudents.length} for ${college.collegeName} (User: ${userEmail})`);

        res.status(200).json({ pendingStudents });
    } catch (err) {
        console.error("Error fetching pending students:", err);
        res.status(500).json({ message: "Error fetching pending students", error: err.message });
    }
};

exports.approveStudent = async (req, res) => {
    try {
        const { studentId } = req.params;
        const student = await Student.findById(studentId);
        if (!student) return res.status(404).json({ message: "Student not found" });

        const college = await College.findOne({ "users.email": req.user.email });
        if (!college || student.college.toString() !== college._id.toString()) {
            return res.status(403).json({ message: "Unauthorized to approve this student" });
        }

        student.isApproved = true;
        await student.save();

        res.status(200).json({ message: "Student approved successfully" });
    } catch (err) {
        console.error("Error approving student:", err);
        res.status(500).json({ message: "Error approving student", error: err.message });
    }
};

exports.getAllStudents = async (req, res) => {
    try {
        const { year } = req.query;
        const college = await College.findOne({ "users.email": req.user.email });

        if (!college) {
            return res.status(404).json({ message: "College not found" });
        }

        let query = { college: college._id, isApproved: true };

        if (req.user.role === "DEPT" && req.user.department) {
            query.department = req.user.department;
        }

        if (year && year !== "All") {
            query.year = year;
        }

        const students = await Student.find(query)
            .select("name email department year rollNo cgpa mobile selectedJobs offlinePlacements")
            .populate({ path: 'selectedJobs.job', populate: { path: 'company', select: 'companyName' } })
            .sort({ rollNo: 1 });

        // Enrich students with a computed placedPackage (best salary among approved/selected placements)
        const enriched = students.map(s => {
            let bestNum = 0;
            let bestStr = null;

            (s.selectedJobs || []).forEach(rec => {
                if (!rec || !rec.salary) return;
                const num = parseSalary(rec.salary);
                if (num > bestNum) { bestNum = num; bestStr = rec.salary; }
            });

            (s.offlinePlacements || []).forEach(p => {
                if (!p || !p.salary) return;
                // consider only APPROVED offline placements
                if (p.status !== 'APPROVED') return;
                const num = parseSalary(p.salary);
                if (num > bestNum) { bestNum = num; bestStr = p.salary; }
            });

            return Object.assign({}, s.toObject(), { placedPackage: bestStr });
        });

        res.status(200).json({ students: enriched });
    } catch (err) {
        console.error("Error fetching all students:", err);
        res.status(500).json({ message: "Error fetching students", error: err.message });
    }
};

// PRINCIPAL/DEPT - Get experiences shared by students in the college
exports.getCollegeExperiences = async (req, res) => {
    try {
        const college = await College.findOne({ "users.email": req.user.email });
        if (!college) return res.status(404).json({ message: "College not found" });

        let query = { college: college._id, $or: [
            { "selectedJobs.experience": { $ne: "" } },
            { "offlinePlacements.experience": { $ne: "" } }
        ] };

        // If the user is a DEPT-level user, restrict to their department
        if (req.user.role === "DEPT" && req.user.department) {
            query.department = req.user.department;
        }

        const students = await Student.find(query).populate({
            path: "selectedJobs.job",
            select: "title",
            populate: { path: "company", select: "companyName" }
        });

        const experiences = [];

        students.forEach(s => {
            s.selectedJobs.forEach(j => {
                if (j.experience) {
                    experiences.push({
                        studentId: s._id,
                        studentName: s.name,
                        department: s.department,
                        companyName: j.job?.company?.companyName || "Unknown Company",
                        jobTitle: j.job?.title || "Unknown Role",
                        experience: j.experience,
                        type: "ON_CAMPUS",
                        date: j.at
                    });
                }
            });

            s.offlinePlacements.forEach(p => {
                if (p.experience) {
                    experiences.push({
                        studentId: s._id,
                        studentName: s.name,
                        department: s.department,
                        companyName: p.companyName,
                        jobTitle: p.jobTitle,
                        experience: p.experience,
                        type: "OFF_CAMPUS",
                        date: p.verifiedAt || p.submittedAt
                    });
                }
            });
        });

        experiences.sort((a, b) => new Date(b.date) - new Date(a.date));

        res.status(200).json({ experiences });
    } catch (err) {
        console.error("Error fetching college experiences:", err);
        res.status(500).json({ message: "Error fetching college experiences", error: err.message });
    }
};

