const Job = require("../models/jobModel");
const Company = require("../models/companyModel");
const Student = require("../models/studentModel");
exports.postJob = async (req, res) => {
    try {
        const {
            title, description, roleType, colleges,
            departments, eligibleYears, salary,
            eligibleCGPA, rounds, deadline
        } = req.body;
        if (!title || !description || !roleType || !salary) {
            return res.status(400).json({ message: "Basic fields (title, desc, role, salary) are required" });
        }
        if (!colleges || colleges.length === 0) {
            return res.status(400).json({ message: "At least one college must be selected" });
        }
        if (eligibleCGPA === undefined || eligibleCGPA === null) {
            return res.status(400).json({ message: "eligibleCGPA is required" });
        }
        if (!deadline) {
            return res.status(400).json({ message: "Application deadline is required" });
        }

        let parsedDeadline = new Date(deadline);
        if (Number.isNaN(parsedDeadline.getTime())) {
            return res.status(400).json({ message: "Invalid deadline date" });
        }
        if (typeof deadline === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(deadline)) {
            parsedDeadline.setHours(23, 59, 59, 999);
        }
        if (parsedDeadline < new Date()) {
            return res.status(400).json({ message: "Deadline must be a future date" });
        }

        const newJob = new Job({
            title, description, roleType,
            company: req.user.id,
            colleges, departments, eligibleYears,
            salary, eligibleCGPA,
            deadline: parsedDeadline,
            rounds: rounds || [],
            status: "PENDING",
            collegeApprovals: colleges.map(cId => ({
                college: cId,
                principalApproved: false,
                approvedDepts: []
            }))
        });

        await newJob.save();

        await Company.findByIdAndUpdate(req.user.id, {
            $push: { postedJobs: newJob._id }
        });

        res.status(201).json({
            message: "Job posted successfully, pending verification",
            job: newJob
        });
    } catch (err) {
        console.error("Error creating job:", err);
        res.status(500).json({ message: "Error creating job", error: err.message });
    }
};

exports.getCompanyJobs = async (req, res) => {
    try {
        const jobs = await Job.find({ company: req.user.id })
            .populate("colleges", "collegeName")
            .sort("-createdAt");

        res.status(200).json({ jobs });
    } catch (err) {
        console.error("Error fetching jobs:", err);
        res.status(500).json({ message: "Error fetching jobs", error: err.message });
    }
};

exports.getApplicants = async (req, res) => {
    try {
        const job = await Job.findOne({ _id: req.params.jobId, company: req.user.id })
            .populate({
                path: "applicants",
                select: "-password", // Select all fields except password, or explicitly select needed fields
                populate: { path: "college", select: "collegeName" }
            });

        if (!job) return res.status(404).json({ message: "Job not found or unauthorized" });

        const applicantsWithProgress = job.applicants.map(student => {
            const progress = job.applicantProgress.find(p => p.student.toString() === student._id.toString());
            return {
                ...student.toObject(),
                progress: progress || { status: 'IN_PROGRESS', currentRound: job.rounds.length > 0 ? job.rounds[0] : 'Application Submitted' }
            };
        });

        res.status(200).json({
            job: {
                _id: job._id,
                title: job.title,
                rounds: job.rounds
            },
            applicants: applicantsWithProgress
        });
    } catch (err) {
        console.error("Error fetching applicants:", err);
        res.status(500).json({ message: "Error fetching applicants", error: err.message });
    }
};

exports.selectStudent = async (req, res) => {
    try {
        const { studentId } = req.body;
        const { jobId } = req.params;

        const job = await Job.findOne({ _id: jobId, company: req.user.id });
        if (!job) return res.status(404).json({ message: "Job not found or unauthorized" });

        if (!job.applicants.includes(studentId)) return res.status(400).json({ message: "Student has not applied to this job" });
        if (job.selectedStudents.includes(studentId)) return res.status(400).json({ message: "Student already selected" });

        if (!job.selectedStudents.includes(studentId)) {
            job.selectedStudents.push(studentId);
        }

        const progressIndex = job.applicantProgress.findIndex(p => p.student.toString() === studentId);

        if (progressIndex === -1) {
            job.applicantProgress.push({
                student: studentId,
                currentRound: "Selection",
                status: "QUALIFIED",
                isVerified: true,
                verifiedAt: new Date(),
                verifiedBy: "COMPANY"
            });
        } else {
            job.applicantProgress[progressIndex].currentRound = "Selection";
            job.applicantProgress[progressIndex].status = "QUALIFIED";
            job.applicantProgress[progressIndex].isVerified = true;
            job.applicantProgress[progressIndex].updatedAt = new Date();
        }

        await job.save();
        res.status(200).json({ message: "Student selection submitted, pending college verification" });
    } catch (err) {
        console.error("Error selecting student:", err);
        res.status(500).json({ message: "Error selecting student", error: err.message });
    }
};

exports.updateStudentProgress = async (req, res) => {
    try {
        const { studentId, currentRound, status } = req.body;
        const { jobId } = req.params;

        const job = await Job.findOne({ _id: jobId, company: req.user.id });
        if (!job) return res.status(404).json({ message: "Job not found or unauthorized" });

        const progressIndex = job.applicantProgress.findIndex(p => p.student && p.student.toString() === studentId);

        if (progressIndex === -1) {
            job.applicantProgress.push({
                student: studentId,
                currentRound,
                status,
                updatedAt: new Date()
            });
        } else {
            if (currentRound) job.applicantProgress[progressIndex].currentRound = currentRound;
            if (status) job.applicantProgress[progressIndex].status = status;
            job.applicantProgress[progressIndex].updatedAt = new Date();
            job.applicantProgress[progressIndex].isVerified = true;
            job.applicantProgress[progressIndex].verifiedAt = new Date();
            job.applicantProgress[progressIndex].verifiedBy = "COMPANY";
        }

        try {
            await job.save();
            res.status(200).json({ message: "Progress updated successfully", progress: job.applicantProgress });
        } catch (saveErr) {
            console.error("Mongoose save error details:", JSON.stringify(saveErr.errors, null, 2) || saveErr);
            res.status(400).json({ message: "Validation error updating progress", error: saveErr.message, details: saveErr.errors });
        }
    } catch (err) {
        console.error("Unhandled error updating progress:", err);
        res.status(500).json({ message: "Internal server error updating progress", error: err.message });
    }
};
