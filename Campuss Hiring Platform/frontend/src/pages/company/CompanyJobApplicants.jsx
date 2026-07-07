import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import Navbar from '../../components/common/Navbar';

import { Eye, ExternalLink, Github, Code, CheckCircle } from 'lucide-react';

const CompanyJobApplicants = () => {
    const { jobId } = useParams();
    const navigate = useNavigate();
    const [applicants, setApplicants] = useState([]);
    const [jobDetails, setJobDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [showProfileModal, setShowProfileModal] = useState(false);

    const fetchApplicants = async () => {
        try {
            const res = await api.get(`/company/jobs/${jobId}/applicants`);
            setApplicants(res.data.applicants || []);
            setJobDetails(res.data.job);
        } catch (err) {
            console.error("Error fetching applicants:", err);
            setError(err.response?.data?.message || "Failed to load applicants");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (jobId) {
            fetchApplicants();
        }
    }, [jobId]);

    const handleUpdateStatus = async (studentId, status, currentRound) => {
        try {
            await api.patch(`/company/jobs/${jobId}/progress`, {
                studentId,
                status,
                currentRound
            });
            // Refresh list
            fetchApplicants();
        } catch (err) {
            alert(err.response?.data?.message || "Failed to update status");
        }
    };

    const handleNextRound = (student, currentRoundName) => {
        if (!jobDetails || !jobDetails.rounds) return;
        const rounds = jobDetails.rounds;
        const idx = rounds.indexOf(currentRoundName);

        if (idx !== -1 && idx < rounds.length - 1) {
            const nextRound = rounds[idx + 1];
            handleUpdateStatus(student._id, 'IN_PROGRESS', nextRound);
        } else {
            // Already at last round, maybe prompt to qualify?
            const confirmQualify = window.confirm("This is the last round. Do you want to select this student?");
            if (confirmQualify) {
                handleUpdateStatus(student._id, 'QUALIFIED', currentRoundName);
            }
        }
    };

    const handleViewProfile = (student) => {
        setSelectedStudent(student);
        setShowProfileModal(true);
    };

    if (loading) return <div className="text-center mt-5"><div className="spinner-border text-primary"></div></div>;

    return (
        <>
            <Navbar />
            <div className="container pb-5">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h2 className="fw-bold fs-3">Job Applicants</h2>
                        {jobDetails && <p className="text-muted mb-0">For Role: <strong>{jobDetails.title}</strong></p>}
                    </div>
                    <button className="btn btn-outline-secondary" onClick={() => navigate('/company/dashboard')}>Back to Dashboard</button>
                </div>

                {error && <div className="alert alert-danger">{error}</div>}

                <div className="card shadow-sm border-0">
                    <div className="card-body p-0">
                        {applicants.length > 0 ? (
                            <div className="table-responsive">
                                <table className="table table-hover align-middle mb-0">
                                    <thead className="table-light">
                                        <tr>
                                            <th>Name</th>
                                            <th>Email</th>
                                            <th>College</th>
                                            <th>Dept</th>
                                            <th>CGPA</th>
                                            <th>Current Round</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {applicants.map((student) => {
                                            const progress = student.progress || {};
                                            const currentRound = progress.currentRound || (jobDetails?.rounds?.[0]) || 'Reviewing';
                                            const status = progress.status || 'IN_PROGRESS';
                                            const rounds = jobDetails?.rounds || [];
                                            const currentIdx = rounds.indexOf(currentRound);
                                            const isLastRound = currentIdx === rounds.length - 1;

                                            return (
                                                <tr key={student._id}>
                                                    <td className="fw-bold">{student.name}</td>
                                                    <td>{student.email}</td>
                                                    <td>{student.college?.collegeName || 'N/A'}</td>
                                                    <td>{student.department}</td>
                                                    <td>{student.cgpa || 'N/A'}</td>
                                                    <td>
                                                        <span className="badge bg-light text-dark border">
                                                            {currentRound}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span className={`badge ${status === 'QUALIFIED' ? 'bg-success' :
                                                            status === 'REJECTED' ? 'bg-danger' :
                                                                'bg-primary'
                                                            }`}>
                                                            {status}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        {status !== 'REJECTED' && status !== 'QUALIFIED' && (
                                                            <div className="d-flex gap-2">
                                                                <button
                                                                    className="btn btn-sm btn-success d-flex align-items-center gap-1"
                                                                    onClick={() => handleNextRound(student, currentRound)}
                                                                >
                                                                    {isLastRound ? <><CheckCircle size={14} /> Select</> : 'Proceed to Next Round'}
                                                                </button>
                                                                <button
                                                                    className="btn btn-sm btn-outline-danger"
                                                                    onClick={() => {
                                                                        if (window.confirm('Are you sure you want to reject this applicant?')) {
                                                                            handleUpdateStatus(student._id, 'REJECTED', currentRound);
                                                                        }
                                                                    }}
                                                                >
                                                                    Reject
                                                                </button>
                                                            </div>
                                                        )}
                                                        <div className="mt-2 d-flex gap-2">
                                                            <button
                                                                className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1"
                                                                onClick={() => handleViewProfile(student)}
                                                            >
                                                                <Eye size={14} /> Profile
                                                            </button>
                                                            {status === 'QUALIFIED' && <span className="badge bg-success py-2">Selected</span>}
                                                            {status === 'REJECTED' && <span className="badge bg-danger py-2">Rejected</span>}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-5">
                                <p className="text-muted mb-0">No applicants found for this job yet.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>


            {/* Profile Modal */}
            {
                showProfileModal && selectedStudent && (
                    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                        <div className="modal-dialog">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title fw-bold">Student Profile: {selectedStudent.name}</h5>
                                    <button type="button" className="btn-close" onClick={() => setShowProfileModal(false)}></button>
                                </div>
                                <div className="modal-body">
                                    <div className="mb-3">
                                        <h6 className="fw-bold">Contact Info</h6>
                                        <p className="mb-1"><strong>Email:</strong> {selectedStudent.email}</p>
                                        <p className="mb-1"><strong>College:</strong> {selectedStudent.college?.collegeName}</p>
                                        <p className="mb-1"><strong>Dept:</strong> {selectedStudent.department} | <strong>Year:</strong> {selectedStudent.year}</p>
                                        <p className="mb-0"><strong>CGPA:</strong> {selectedStudent.cgpa}</p>
                                    </div>
                                    <hr />
                                    <div className="mb-3">
                                        <h6 className="fw-bold mb-3">Links & Profiles</h6>
                                        <div className="d-flex flex-column gap-2">
                                            {selectedStudent.resumeUrl ? (
                                                <a href={selectedStudent.resumeUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline-dark d-flex align-items-center gap-2 justify-content-center">
                                                    <ExternalLink size={16} /> View Resume
                                                </a>
                                            ) : <span className="text-muted fst-italic">No Resume Uploaded</span>}

                                            {selectedStudent.github && (
                                                <a href={selectedStudent.github} target="_blank" rel="noopener noreferrer" className="btn btn-outline-dark d-flex align-items-center gap-2 justify-content-center">
                                                    <Github size={16} /> GitHub Profile
                                                </a>
                                            )}
                                        </div>

                                        <h6 className="fw-bold mt-4 mb-2">Coding Platforms</h6>
                                        <div className="d-flex flex-column gap-2">
                                            {selectedStudent.codingProfiles?.leetcode ? (
                                                <a href={selectedStudent.codingProfiles.leetcode} target="_blank" rel="noopener noreferrer" className="text-decoration-none d-flex align-items-center gap-2 p-2 border rounded hover-bg-light">
                                                    <Code size={18} className="text-warning" /> LeetCode
                                                </a>
                                            ) : <div className="text-muted small ps-2">LeetCode not provided</div>}

                                            {selectedStudent.codingProfiles?.codechef ? (
                                                <a href={selectedStudent.codingProfiles.codechef} target="_blank" rel="noopener noreferrer" className="text-decoration-none d-flex align-items-center gap-2 p-2 border rounded hover-bg-light">
                                                    <Code size={18} className="text-danger" /> CodeChef
                                                </a>
                                            ) : <div className="text-muted small ps-2">CodeChef not provided</div>}

                                            {selectedStudent.codingProfiles?.codeforces ? (
                                                <a href={selectedStudent.codingProfiles.codeforces} target="_blank" rel="noopener noreferrer" className="text-decoration-none d-flex align-items-center gap-2 p-2 border rounded hover-bg-light">
                                                    <Code size={18} className="text-info" /> CodeForces
                                                </a>
                                            ) : <div className="text-muted small ps-2">CodeForces not provided</div>}
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowProfileModal(false)}>Close</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </>
    );
};

export default CompanyJobApplicants;
