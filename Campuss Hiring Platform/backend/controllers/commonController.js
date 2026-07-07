const Job = require("../models/jobModel");

exports.getJobDetails = async (req, res) => {
    try {
        const { jobId } = req.params;
        const job = await Job.findById(jobId)
            .populate("company", "companyName description website")
            .populate("colleges", "collegeName");

        if (!job) return res.status(404).json({ message: "Job not found" });

        res.status(200).json({ job });
    } catch (err) {
        console.error("Error fetching job details:", err);
        res.status(500).json({ message: "Error fetching job details", error: err.message });
    }
};
