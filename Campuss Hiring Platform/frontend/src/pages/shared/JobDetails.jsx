import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import Navbar from '../../components/common/Navbar';
import { CheckCircle, Clock, MapPin, DollarSign, Briefcase, GraduationCap, Building } from 'lucide-react';

const JobDetails = () => {
    const { jobId } = useParams();
    const navigate = useNavigate();
    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [user, setUser] = useState(null);
    const [applying, setApplying] = useState(false);

    useEffect(() => {
        const fetchJob = async () => {
            try {
                const res = await api.get(`/common/jobs/${jobId}`);
                setJob(res.data.job);
            } catch (err) {
                console.error("Error fetching job details:", err);
                setError(err.response?.data?.message || "Failed to load job details");
            } finally {
                setLoading(false);
            }
        };

        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        setUser(storedUser);
        if (jobId) fetchJob();
    }, [jobId]);

    const handleApply = async () => {
        if (!window.confirm("Are you sure you want to apply for this position?")) return;
        setApplying(true);
        try {
            await api.post(`/student/jobs/${jobId}/apply`);
            alert('Application submitted successfully!');
            navigate('/dashboard');
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to apply for job');
        } finally {
            setApplying(false);
        }
    };

    const handleApprove = async () => {
        try {
            const endpoint = user.role === 'PRINCIPAL'
                ? `/college/jobs/${jobId}/verify`
                : `/college/jobs/${jobId}/dept-verify`;

            await api.patch(endpoint);
            alert('Job approved successfully');
            navigate('/college/dashboard');
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to approve job');
        }
    };

    if (loading) return <div className="text-center mt-5"><div className="spinner-border text-primary"></div></div>;
    if (error) return <div className="alert alert-danger m-5">{error}</div>;
    if (!job) return <div className="alert alert-warning m-5">Job not found</div>;

    const isStudent = user?.role === 'STUDENT';
    const isCollege = ['PRINCIPAL', 'DEPT'].includes(user?.role);
    const isCompany = user?.role === 'COMPANY';

    return (
        <>
            <Navbar />
            <div className="container py-5">
                <div className="row justify-content-center">
                    <div className="col-lg-10">
                        <button className="btn btn-outline-secondary mb-4" onClick={() => navigate(-1)}>
                            ← Back
                        </button>

                        <div className="card shadow-lg border-0">
                            <div className="card-header bg-primary text-white p-4">
                                <div className="d-flex justify-content-between align-items-start">
                                    <div>
                                        <h2 className="fw-bold mb-1">{job.title}</h2>
                                        <p className="mb-0 opacity-75 fs-5">
                                            <Building className="inline-block me-2" size={20} />
                                            {job.company?.companyName}
                                        </p>
                                    </div>
                                    <span className={`badge bg-white text-primary fs-6 px-3 py-2`}>
                                        {job.roleType}
                                    </span>
                                </div>
                            </div>
                            <div className="card-body p-5">
                                {/* Key Details Grid */}
                                <div className="row g-4 mb-5">
                                    <div className="col-md-4">
                                        <div className="p-3 bg-light rounded h-100">
                                            <div className="d-flex align-items-center mb-2 text-primary">
                                                <DollarSign size={20} className="me-2" />
                                                <h6 className="fw-bold mb-0">Salary / Stipend</h6>
                                            </div>
                                            <p className="mb-0 fs-5">{job.salary}</p>
                                        </div>
                                    </div>
                                    <div className="col-md-4">
                                        <div className="p-3 bg-light rounded h-100">
                                            <div className="d-flex align-items-center mb-2 text-primary">
                                                <GraduationCap size={20} className="me-2" />
                                                <h6 className="fw-bold mb-0">Eligibility</h6>
                                            </div>
                                            <p className="mb-0">
                                                CGPA: <strong>{job.eligibleCGPA}+</strong><br />
                                                Years: {job.eligibleYears.join(', ')}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="col-md-4">
                                        <div className="p-3 bg-light rounded h-100">
                                            <div className="d-flex align-items-center mb-2 text-primary">
                                                <Briefcase size={20} className="me-2" />
                                                <h6 className="fw-bold mb-0">Departments</h6>
                                            </div>
                                            <p className="mb-0">{job.departments.join(', ')}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Description */}
                                <div className="mb-5">
                                    <h4 className="fw-bold border-bottom pb-2 mb-3">Job Description</h4>
                                    <div className="text-secondary" style={{ whiteSpace: 'pre-line', lineHeight: '1.6' }}>
                                        {job.description}
                                    </div>
                                </div>

                                {/* Hiring Rounds */}
                                {job.rounds && job.rounds.length > 0 && (
                                    <div className="mb-5">
                                        <h4 className="fw-bold border-bottom pb-2 mb-3">Hiring Process</h4>
                                        <div className="d-flex flex-wrap gap-3">
                                            {job.rounds.map((round, idx) => (
                                                <div key={idx} className="d-flex align-items-center bg-light px-3 py-2 rounded-pill border">
                                                    <span className="badge bg-primary rounded-circle me-2">{idx + 1}</span>
                                                    <span className="fw-semibold">{round}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="d-flex justify-content-end gap-3 pt-3 border-top">
                                    {isStudent && (
                                        <button
                                            className="btn btn-primary btn-lg px-5 fw-bold"
                                            onClick={handleApply}
                                            disabled={applying}
                                        >
                                            {applying ? 'Submitting...' : 'Apply Now'}
                                        </button>
                                    )}

                                    {isCollege && job.status === 'PENDING' && (
                                        <button
                                            className="btn btn-success btn-lg px-5 fw-bold"
                                            onClick={handleApprove}
                                        >
                                            Approve Job
                                        </button>
                                    )}

                                    {isCompany && (
                                        <button
                                            className="btn btn-outline-primary btn-lg px-5"
                                            onClick={() => navigate(`/company/jobs/${jobId}/applicants`)}
                                        >
                                            View Applicants
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default JobDetails;
