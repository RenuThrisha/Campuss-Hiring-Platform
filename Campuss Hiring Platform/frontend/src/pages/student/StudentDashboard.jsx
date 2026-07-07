import React, { useEffect, useState } from 'react';
import api from '../../utils/api';
import Navbar from '../../components/common/Navbar';
import { Link } from 'react-router-dom';
import { Check, X, Clock, Circle, Edit2, Github, Link as LinkIcon, Code } from 'lucide-react';

const StudentDashboard = () => {
    const [profile, setProfile] = useState(null);
    const [applications, setApplications] = useState([]);
    const [eligibleJobs, setEligibleJobs] = useState([]);
    const [offlinePlacements, setOfflinePlacements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editFormData, setEditFormData] = useState({
        resumeUrl: '',
        github: '',
        leetcode: '',
        codechef: '',
        codeforces: ''
    });

    const fetchData = async () => {
        try {
            const [profileRes, appRes, eligibleRes, offlineRes] = await Promise.all([
                api.get('/student/profile'),
                api.get('/student/applications'),
                api.get('/student/jobs/eligible'),
                api.get('/student/offline-placements')
            ]);
            setProfile(profileRes.data.student);
            setApplications(appRes.data.applied || []);
            setEligibleJobs(eligibleRes.data.jobs || []);
            setOfflinePlacements(offlineRes.data.offlinePlacements || []);
        } catch (err) {
            console.error('Error fetching dashboard data', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleAcceptOffer = async (jobId) => {
        if (!window.confirm('Are you sure you want to accept this offer? This will mark you as placed.')) return;
        try {
            console.log('Accepting offer for job:', jobId);
            const res = await api.post(`/student/offers/${jobId}/accept`);
            alert(res.data.message);
            fetchData();
        } catch (err) {
            console.error('Accept offer error:', err);
            alert(err.response?.data?.message || err.message || 'Failed to accept offer');
        }
    };

    const handleRejectOffer = async (jobId) => {
        if (!window.confirm('Are you sure you want to reject this offer? This action cannot be undone.')) return;
        try {
            const res = await api.post(`/student/offers/${jobId}/reject`);
            alert(res.data.message);
            fetchData();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to reject offer');
        }
    };

    const handleApply = async (jobId) => {
        try {
            await api.post(`/student/jobs/${jobId}/apply`);
            alert('Application submitted successfully!');
            fetchData(); // Refresh data to update application list and eligibility
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to apply for job');
        }
    };

    const handleEditClick = () => {
        setEditFormData({
            resumeUrl: profile?.resumeUrl || '',
            github: profile?.github || '',
            leetcode: profile?.codingProfiles?.leetcode || '',
            codechef: profile?.codingProfiles?.codechef || '',
            codeforces: profile?.codingProfiles?.codeforces || ''
        });
        setShowEditModal(true);
    };

    const handleEditChange = (e) => {
        setEditFormData({ ...editFormData, [e.target.name]: e.target.value });
    };

    const handleSaveProfile = async () => {
        try {
            const payload = {
                resumeUrl: editFormData.resumeUrl,
                github: editFormData.github,
                codingProfiles: {
                    leetcode: editFormData.leetcode,
                    codechef: editFormData.codechef,
                    codeforces: editFormData.codeforces
                }
            };

            const res = await api.put('/student/profile', payload);
            setProfile(res.data.student);
            setShowEditModal(false);
            alert('Profile updated successfully!');
        } catch (err) {
            console.error('Error updating profile', err);
            alert(err.response?.data?.message || 'Failed to update profile');
        }
    };

    if (loading) return <div className="text-center mt-5"><div className="spinner-border text-primary"></div></div>;

    return (
        <>
            <Navbar />
            <div className="container pb-5">
                <div className="row g-4">
                    {/* Profile Card */}
                    <div className="col-md-4">
                        <div className="card shadow-sm mb-4">
                            <div className="card-body">
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <h5 className="card-title fw-bold mb-0">Student Profile</h5>
                                    <button className="btn btn-sm btn-outline-primary d-flex align-items-center gap-2" onClick={handleEditClick}>
                                        <Edit2 size={16} /> Edit
                                    </button>
                                </div>
                                <hr />
                                <p className="mb-1"><strong>Name:</strong> {profile?.name}</p>
                                <p className="mb-1"><strong>Email:</strong> {profile?.email}</p>
                                <p className="mb-1"><strong>Department:</strong> {profile?.department}</p>
                                <p className="mb-1"><strong>Year:</strong> {profile?.year}</p>

                                <p className="mb-1"><strong>CGPA:</strong> {profile?.cgpa || 'N/A'}</p>
                                <hr />
                                <div className="d-flex flex-column gap-2 mt-2">
                                    {profile?.resumeUrl && (
                                        <a href={profile.resumeUrl} target="_blank" rel="noopener noreferrer" className="text-decoration-none d-flex align-items-center gap-2 text-dark">
                                            <LinkIcon size={16} className="text-primary" /> Resume
                                        </a>
                                    )}
                                    {profile?.github && (
                                        <a href={profile.github} target="_blank" rel="noopener noreferrer" className="text-decoration-none d-flex align-items-center gap-2 text-dark">
                                            <Github size={16} className="text-dark" /> GitHub
                                        </a>
                                    )}
                                    {profile?.codingProfiles?.leetcode && (
                                        <a href={profile.codingProfiles.leetcode} target="_blank" rel="noopener noreferrer" className="text-decoration-none d-flex align-items-center gap-2 text-dark">
                                            <Code size={16} className="text-warning" /> LeetCode
                                        </a>
                                    )}
                                    {profile?.codingProfiles?.codechef && (
                                        <a href={profile.codingProfiles.codechef} target="_blank" rel="noopener noreferrer" className="text-decoration-none d-flex align-items-center gap-2 text-dark">
                                            <Code size={16} className="text-danger" /> CodeChef
                                        </a>
                                    )}
                                    {profile?.codingProfiles?.codeforces && (
                                        <a href={profile.codingProfiles.codeforces} target="_blank" rel="noopener noreferrer" className="text-decoration-none d-flex align-items-center gap-2 text-dark">
                                            <Code size={16} className="text-info" /> CodeForces
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Available Jobs */}
                        <div className="card shadow-sm mb-4">
                            <div className="card-header bg-white py-3">
                                <h5 className="mb-0 fw-bold text-primary">Available Jobs</h5>
                            </div>
                            <div className="card-body p-0">
                                {(() => {
                                    const trulyAvailableJobs = eligibleJobs.filter(job => {
                                        const application = applications.find(app => (app.job?._id === job._id || app.job === job._id));
                                        if (!application) return true; // Show if not applied

                                        const status = application.progress?.status || 'IN_PROGRESS';
                                        return status === 'IN_PROGRESS'; // Show if applied but still active
                                    });

                                    if (trulyAvailableJobs.length === 0) {
                                        return (
                                            <div className="p-4 text-center">
                                                <p className="text-muted mb-0">No new eligible jobs found at the moment.</p>
                                            </div>
                                        );
                                    }

                                    return (
                                        <div className="list-group list-group-flush">
                                            {trulyAvailableJobs.map((job) => {
                                                const isApplied = applications.some(app => (app.job?._id === job._id || app.job === job._id));

                                                return (
                                                    <div key={job._id} className="list-group-item p-3 border-bottom">
                                                        <div className="d-flex justify-content-between align-items-start mb-2">
                                                            <div>
                                                                <h6 className="fw-bold mb-0">{job.title}</h6>
                                                                <small className="text-muted">{job.company?.companyName}</small>
                                                            </div>
                                                            <span className="badge bg-primary-subtle text-primary border border-primary-subtle">
                                                                {job.roleType}
                                                            </span>
                                                        </div>
                                                        <div className="d-flex justify-content-between align-items-center mt-3">
                                                            <span className="fw-bold text-success small">{job.salary}</span>
                                                            <div className="d-flex gap-2">
                                                                {isApplied ? (
                                                                    <span className="badge bg-success">Applied</span>
                                                                ) : (
                                                                    <Link to={`/jobs/${job._id}`} className="btn btn-sm btn-outline-primary px-3">
                                                                        View Details
                                                                    </Link>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>

                        <div className="card shadow-sm mb-4">
                            <div className="card-header bg-white py-3 text-success">
                                <h5 className="mb-0 fw-bold">On-Campus Placements</h5>
                            </div>
                            <div className="card-body">
                                {profile?.selectedJobs?.length > 0 ? (
                                    <div className="list-group">
                                        {profile.selectedJobs.map((p, idx) => (
                                            <div key={idx} className="list-group-item d-flex justify-content-between align-items-center">
                                                <div>
                                                    <h6 className="mb-1 font-bold">{p.job?.company?.companyName || 'On-Campus Job'}</h6>
                                                    <small className="text-muted">{p.roleType} - {p.salary}</small>
                                                </div>
                                                <Link to={`/add-experience/${p.job?._id}?type=ON_CAMPUS`} className="btn btn-sm btn-outline-primary">
                                                    {p.experience ? 'Edit Experience' : 'Add Experience'}
                                                </Link>
                                            </div>
                                        ))}
                                    </div>
                                ) : <p className="text-muted mb-0">No on-campus placements secured yet.</p>}
                            </div>
                        </div>

                        <div className="card shadow-sm">
                            <div className="card-header bg-white py-3 text-info">
                                <h5 className="mb-0 fw-bold">Off-Campus Placements</h5>
                            </div>
                            <div className="card-body">
                                {offlinePlacements.length > 0 ? (
                                    <div className="list-group">
                                        {offlinePlacements.map((p, idx) => (
                                            <div key={idx} className="list-group-item d-flex justify-content-between align-items-center">
                                                <div>
                                                    <h6 className="mb-1 font-bold">{p.companyName}</h6>
                                                    <small className="text-muted">{p.jobTitle} - {p.status}</small>
                                                </div>
                                                {p.status === 'APPROVED' && (
                                                    <Link to={`/add-experience/${p._id}?type=OFF_CAMPUS`} className="btn btn-sm btn-outline-primary">
                                                        {p.experience ? 'Edit Experience' : 'Add Experience'}
                                                    </Link>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : <p className="text-muted mb-0">No off-campus placements submitted yet.</p>}
                            </div>
                        </div>
                    </div>

                    {/* Applications Column */}
                    <div className="col-md-8">
                        {/* Application Status Section */}
                        <div className="card shadow-sm mb-4">
                            <div className="card-header bg-white py-3">
                                <h5 className="mb-0 fw-bold">My Applications</h5>
                            </div>
                            <div className="card-body p-0">
                                {(() => {
                                    const activeAndHiredApps = applications.filter(app => {
                                        const status = app.progress?.status || 'IN_PROGRESS';
                                        return status === 'IN_PROGRESS' || status === 'QUALIFIED' || status === 'ACCEPTED' || status === 'OFFER_REJECTED';
                                    });

                                    if (activeAndHiredApps.length === 0) {
                                        return <div className="p-3 text-muted">You have no active or secured applications.</div>;
                                    }

                                    return (
                                        <div className="p-3">
                                            {activeAndHiredApps.map((app, idx) => {
                                                const rounds = app.job?.rounds && app.job.rounds.length > 0 ? app.job.rounds : ['Application Submitted'];
                                                const currentRound = app.progress?.currentRound || rounds[0];
                                                const status = app.progress?.status || 'IN_PROGRESS';
                                                const currentIdx = rounds.findIndex(r => r === currentRound);

                                                // Fallback if current round name doesn't match predefined rounds
                                                const activeStep = status === 'QUALIFIED' ? rounds.length : (currentIdx !== -1 ? currentIdx : 0);

                                                return (
                                                    <div key={idx} className="card mb-3 border shadow-sm">
                                                        <div className="card-body">
                                                            <div className="d-flex justify-content-between align-items-center mb-3">
                                                                <div>
                                                                    <h6 className="fw-bold mb-0 text-primary">{app.job?.company?.companyName || app.company?.companyName}</h6>
                                                                    <small className="text-muted">{app.job?.title || 'Job Role'}</small>
                                                                </div>
                                                                <div className="d-flex gap-2 align-items-center">
                                                                    <span className={`badge ${status === 'ACCEPTED' ? 'bg-success' :
                                                                        status === 'QUALIFIED' ? 'bg-info text-dark' :
                                                                            status === 'OFFER_REJECTED' ? 'bg-danger' :
                                                                                'bg-warning text-dark'
                                                                        }`}>
                                                                        {status === 'ACCEPTED' ? 'Placed' :
                                                                            status === 'QUALIFIED' ? 'Offer Received' :
                                                                                status === 'OFFER_REJECTED' ? 'Offer Rejected' :
                                                                                    'Active'}
                                                                    </span>
                                                                    {status === 'QUALIFIED' && (
                                                                        <div className="d-flex gap-2">
                                                                            <button
                                                                                onClick={() => handleAcceptOffer(app.job?._id)}
                                                                                className="btn btn-sm btn-success py-0 px-2"
                                                                                style={{ fontSize: '0.7rem' }}
                                                                            >
                                                                                Accept
                                                                            </button>
                                                                            <button
                                                                                onClick={() => handleRejectOffer(app.job?._id)}
                                                                                className="btn btn-sm btn-outline-danger py-0 px-2"
                                                                                style={{ fontSize: '0.7rem' }}
                                                                            >
                                                                                Reject
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                                    {(status === 'ACCEPTED' || status === 'QUALIFIED' || status === 'OFFER_REJECTED') && (
                                                                        <Link to={`/jobs/${app.job?._id}`} className="btn btn-sm btn-outline-primary py-0 px-2" style={{ fontSize: '0.7rem' }}>
                                                                            View Details
                                                                        </Link>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* Stepper */}
                                                            <div className="position-relative">
                                                                <div className="d-flex justify-content-between position-relative" style={{ zIndex: 1 }}>
                                                                    {rounds.map((round, stepIdx) => {
                                                                        let stepStatus = 'upcoming'; // upcoming, current, completed

                                                                        if (status === 'QUALIFIED' || status === 'ACCEPTED' || status === 'OFFER_REJECTED' || stepIdx < activeStep) stepStatus = 'completed';
                                                                        else if (stepIdx === activeStep) stepStatus = 'current';

                                                                        return (
                                                                            <div key={stepIdx} className="d-flex flex-column align-items-center" style={{ flex: 1 }}>
                                                                                <div
                                                                                    className={`rounded-circle d-flex align-items-center justify-content-center mb-2 border ${stepStatus === 'completed' ? 'bg-success text-white border-success' :
                                                                                        stepStatus === 'current' ? 'bg-white text-primary border-primary border-2' :
                                                                                            'bg-light text-muted border-light-subtle'
                                                                                        }`}
                                                                                    style={{ width: '32px', height: '32px', minWidth: '32px' }}
                                                                                >
                                                                                    {stepStatus === 'completed' ? <Check size={16} /> :
                                                                                        stepStatus === 'current' ? <Clock size={16} /> :
                                                                                            <Circle size={12} />}
                                                                                </div>
                                                                                <small className={`text-center small fw-bold ${stepStatus === 'current' ? 'text-primary' :
                                                                                    stepStatus === 'upcoming' ? 'text-muted' : 'text-dark'
                                                                                    }`} style={{ fontSize: '0.75rem' }}>
                                                                                    {round}
                                                                                </small>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>

                                                                {/* Connector Line */}
                                                                <div className="position-absolute top-0 start-0 w-100" style={{ top: '16px', zIndex: 0 }}>
                                                                    <div className="h-100 d-flex align-items-center px-4">
                                                                        <div className="w-100 bg-light" style={{ height: '2px' }}>
                                                                            <div
                                                                                className={`h-100 bg-success`}
                                                                                style={{
                                                                                    width: `${(status === 'QUALIFIED' || status === 'ACCEPTED' || status === 'OFFER_REJECTED') ? 100 : (activeStep / (rounds.length - 1)) * 100}%`,
                                                                                    transition: 'width 0.5s ease'
                                                                                }}
                                                                            ></div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Profile Modal */}
            {
                showEditModal && (
                    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                        <div className="modal-dialog">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title fw-bold">Edit Profile</h5>
                                    <button type="button" className="btn-close" onClick={() => setShowEditModal(false)}></button>
                                </div>
                                <div className="modal-body">
                                    <div className="mb-3">
                                        <label className="form-label fw-bold">Resume URL</label>
                                        <input
                                            type="url"
                                            className="form-control"
                                            name="resumeUrl"
                                            value={editFormData.resumeUrl}
                                            onChange={handleEditChange}
                                            placeholder="https://drive.google.com/..."
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label fw-bold">GitHub Profile URL</label>
                                        <input
                                            type="url"
                                            className="form-control"
                                            name="github"
                                            value={editFormData.github}
                                            onChange={handleEditChange}
                                            placeholder="https://github.com/..."
                                        />
                                    </div>
                                    <h6 className="fw-bold mt-4 mb-3 border-bottom pb-2">Coding Profiles</h6>
                                    <div className="mb-3">
                                        <label className="form-label">LeetCode URL</label>
                                        <input
                                            type="url"
                                            className="form-control"
                                            name="leetcode"
                                            value={editFormData.leetcode}
                                            onChange={handleEditChange}
                                            placeholder="https://leetcode.com/..."
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">CodeChef URL</label>
                                        <input
                                            type="url"
                                            className="form-control"
                                            name="codechef"
                                            value={editFormData.codechef}
                                            onChange={handleEditChange}
                                            placeholder="https://www.codechef.com/users/..."
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">CodeForces URL</label>
                                        <input
                                            type="url"
                                            className="form-control"
                                            name="codeforces"
                                            value={editFormData.codeforces}
                                            onChange={handleEditChange}
                                            placeholder="https://codeforces.com/profile/..."
                                        />
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>Close</button>
                                    <button type="button" className="btn btn-primary" onClick={handleSaveProfile}>Save Changes</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </>
    );
};

export default StudentDashboard;
