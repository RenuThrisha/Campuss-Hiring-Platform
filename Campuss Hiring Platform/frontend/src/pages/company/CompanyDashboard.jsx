import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import Navbar from '../../components/common/Navbar';

const CompanyDashboard = () => {
    const navigate = useNavigate();
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchJobs = async () => {
            try {
                const res = await api.get('/company/jobs');
                setJobs(res.data.jobs || []);
            } catch (err) {
                console.error('Error fetching company jobs', err);
            } finally {
                setLoading(false);
            }
        };
        fetchJobs();
    }, []);

    if (loading) return <div className="text-center mt-5"><div className="spinner-border text-primary"></div></div>;

    return (
        <>
            <Navbar />
            <div className="container pb-5">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h2 className="fw-bold">Company Dashboard</h2>
                    <button className="btn btn-primary" onClick={() => navigate('/company/post-job')}>Post New Job</button>
                </div>

                <div className="row g-4">
                    <div className="col-12">
                        <div className="card shadow-sm">
                            <div className="card-header bg-white">
                                <h5 className="mb-0 fw-bold">Your Posted Jobs</h5>
                            </div>
                            <div className="card-body">
                                {jobs.length > 0 ? (
                                    <div className="table-responsive">
                                        <table className="table table-hover align-middle">
                                            <thead className="table-light">
                                                <tr>
                                                    <th>Job Title</th>
                                                    <th>Role</th>
                                                    <th>Salary</th>
                                                    <th>Status</th>
                                                    <th>Colleges</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {jobs.map((job) => (
                                                    <tr key={job._id}>
                                                        <td>{job.title}</td>
                                                        <td>{job.roleType}</td>
                                                        <td>{job.salary}</td>
                                                        <td>
                                                            <span className={`badge ${job.status === 'LIVE' ? 'bg-success' : 'bg-warning text-dark'}`}>
                                                                {job.status}
                                                            </span>
                                                        </td>
                                                        <td>{job.colleges?.map(c => c.collegeName).join(', ')}</td>
                                                        <td>
                                                            <button
                                                                className="btn btn-sm btn-outline-primary me-2"
                                                                onClick={() => navigate(`/company/jobs/${job._id}/applicants`)}
                                                            >
                                                                View Applicants
                                                            </button>
                                                            <button className="btn btn-sm btn-outline-secondary">Edit</button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : <p className="text-muted mb-0">No jobs posted yet.</p>}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default CompanyDashboard;
