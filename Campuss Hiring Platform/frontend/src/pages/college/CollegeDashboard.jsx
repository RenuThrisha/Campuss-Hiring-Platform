import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import Navbar from '../../components/common/Navbar';

const CollegeDashboard = () => {
    const [stats, setStats] = useState(null);
    const [pendingJobs, setPendingJobs] = useState([]);
    const [approvedJobs, setApprovedJobs] = useState([]);
    const [pendingStudents, setPendingStudents] = useState([]);
    const [loading, setLoading] = useState(true);

    const [showApprovedJobs, setShowApprovedJobs] = useState(false);

    const [allStudents, setAllStudents] = useState([]);
    const [yearFilter, setYearFilter] = useState("All");
    const [experiences, setExperiences] = useState([]);

    const fetchStats = async (year = "All") => {
        try {
            const statsRes = await api.get(`/college/stats/placement?year=${year}`);
            setStats(statsRes.data.stats);
        } catch (err) {
            console.error('Error fetching placement stats', err);
        }
    };

    const fetchData = async () => {
        try {
            const [pendingRes, approvedRes, studentsRes, allStudentsRes] = await Promise.all([
                api.get('/college/jobs/pending'),
                api.get('/college/jobs/approved'),
                api.get('/college/students/pending'),
                api.get('/college/students')
            ]);
            setPendingJobs(pendingRes.data.pendingJobs || []);
            setApprovedJobs(approvedRes.data.approvedJobs || []);
            setPendingStudents(studentsRes.data.pendingStudents || []);
            setAllStudents(allStudentsRes.data.students || []);
            // Initially fetch stats for All
            await fetchStats("All");
            // fetch college experiences
            try {
                const expRes = await api.get('/college/experiences');
                setExperiences(expRes.data.experiences || []);
            } catch (e) {
                console.error('Error fetching college experiences', e);
            }
            setPendingJobs(pendingRes.data.pendingJobs || []);
            setApprovedJobs(approvedRes.data.approvedJobs || []);
            setPendingStudents(studentsRes.data.pendingStudents || []);
            setAllStudents(allStudentsRes.data.students || []);
        } catch (err) {
            console.error('Error fetching college data', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (!loading) {
            fetchStats(yearFilter);
        }
    }, [yearFilter]);

    const handleApproveStudent = async (studentId) => {
        try {
            await api.patch(`/college/students/${studentId}/approve`);
            setPendingStudents(prev => prev.filter(s => s._id !== studentId));
            const statsRes = await api.get('/college/stats/placement');
            setStats(statsRes.data.stats);
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to approve student');
        }
    };

    const handleApproveJob = async (jobId) => {
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const endpoint = user.role === 'PRINCIPAL'
                ? `/college/jobs/${jobId}/verify`
                : `/college/jobs/${jobId}/dept-verify`;

            await api.patch(endpoint);
            setPendingJobs(prev => prev.filter(j => j._id !== jobId));
            alert('Job approved successfully');
        } catch (err) {
            console.error('Error approving job', err);
            alert(err.response?.data?.message || 'Failed to approve job');
        }
    };

    const filteredStudents = yearFilter === "All"
        ? allStudents
        : allStudents.filter(s => s.year === yearFilter + (yearFilter === "4th" ? "" : (yearFilter === "1st" ? "" : (yearFilter === "2nd" ? "" : (yearFilter === "3rd" ? "" : "")))));
    // Logic fix: Ensure year format matches backend/studentModel enum ["1st", "2nd", "3rd", "4th"]
    // The tabs will set "1st", "2nd" etc directly.

    if (loading) return <div className="text-center mt-5"><div className="spinner-border text-primary"></div></div>;

    return (
        <>
            <Navbar />
            <div className="container pb-5">
                <h2 className="fw-bold mb-4">College/Department Dashboard</h2>

                <div className="row g-4 mb-5">
                    <div className="col-md-3">
                        <div className="card shadow-sm border-0 bg-primary text-white">
                            <div className="card-body">
                                <h6>Total Students</h6>
                                <h3>{stats?.totalStudents || 0}</h3>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-3">
                        <div className="card shadow-sm border-0 bg-success text-white">
                            <div className="card-body">
                                <h6>Placed Students</h6>
                                <h3>{stats?.placedStudents || 0}</h3>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-3">
                        <div className="card shadow-sm border-0 bg-info text-white">
                            <div className="card-body">
                                <h6>Placement %</h6>
                                <h3>{stats?.placementPercentage || 0}%</h3>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-3">
                        <div className="card shadow-sm border-0 bg-warning text-dark">
                            <div className="card-body">
                                <h6>Unplaced Students</h6>
                                <h3>{stats?.unplacedStudents || 0}</h3>
                            </div>
                        </div>
                    </div>
                </div>

                {/* All Students Section */}
                <div className="card shadow-sm mb-5">
                    <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
                        <h5 className="mb-0 fw-bold text-dark">All Students ({allStudents.length})</h5>
                        <ul className="nav nav-pills card-header-pills">
                            {["All", "1st", "2nd", "3rd", "4th"].map(year => (
                                <li className="nav-item" key={year}>
                                    <button
                                        className={`nav-link btn-sm ${yearFilter === year ? "active" : ""}`}
                                        onClick={() => setYearFilter(year)}
                                    >
                                        {year === "All" ? "All Years" : `${year} Year`}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="card-body p-0">
                        <div className="table-responsive">
                            <table className="table table-hover mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th className="ps-4">Name</th>
                                        <th>Roll No</th>
                                        <th>Department</th>
                                        <th>Year</th>
                                        <th>CGPA</th>
                                        <th>Package</th>
                                        <th>Contact</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredStudents.length > 0 ? (
                                        filteredStudents.map((student) => (
                                            <tr key={student._id}>
                                                <td className="ps-4 fw-bold">{student.name}</td>
                                                    <td>{student.rollNo}</td>
                                                    <td>{student.department}</td>
                                                    <td><span className="badge bg-secondary">{student.year}</span></td>
                                                    <td>{student.cgpa || "-"}</td>
                                                    <td>{student.placedPackage || '-'}</td>
                                                    <td>
                                                        <small className="d-block">{student.email}</small>
                                                        <small className="text-muted">{student.mobile || ""}</small>
                                                    </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="6" className="text-center py-4 text-muted">
                                                No students found for this filter.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className="row g-4">
                    {/* Student Approvals */}
                    <div className="col-md-6">
                        <div className="card shadow-sm h-100">
                            <div className="card-header bg-white py-3">
                                <h5 className="mb-0 fw-bold text-primary">Pending Student Logins ({pendingStudents.length})</h5>
                            </div>
                            <div className="card-body">
                                {pendingStudents.length > 0 ? (
                                    <div className="list-group list-group-flush">
                                        {pendingStudents.map((student) => (
                                            <div key={student._id} className="list-group-item d-flex justify-content-between align-items-center px-0">
                                                <div>
                                                    <h6 className="mb-0 fw-bold">{student.name}</h6>
                                                    <small className="text-muted">{student.rollNo} - {student.department} ({student.year})</small>
                                                </div>
                                                <button
                                                    onClick={() => handleApproveStudent(student._id)}
                                                    className="btn btn-sm btn-success"
                                                >Approve</button>
                                            </div>
                                        ))}
                                    </div>
                                ) : <p className="text-muted mb-0">No pending student approvals.</p>}
                            </div>
                        </div>
                    </div>

                    {/* Job Verifications */}
                    <div className="col-md-6">
                        <div className="card shadow-sm h-100">
                            <div className="card-header bg-white py-3">
                                <h5 className="mb-0 fw-bold text-primary">Pending Job verifications ({pendingJobs.length})</h5>
                            </div>
                            <div className="card-body">
                                {pendingJobs.length > 0 ? (
                                    <div className="list-group list-group-flush">
                                        {pendingJobs.map((job) => (
                                            <div key={job._id} className="list-group-item d-flex justify-content-between align-items-center px-0">
                                                <div>
                                                    <h6 className="mb-0 fw-bold">{job.title}</h6>
                                                    <small className="text-muted">{job.company?.companyName} - {job.salary}</small>
                                                </div>
                                                <Link
                                                    to={`/jobs/${job._id}`}
                                                    className="btn btn-sm btn-outline-primary"
                                                >
                                                    View & Verify
                                                </Link>
                                            </div>
                                        ))}
                                    </div>
                                ) : <p className="text-muted mb-0">No pending job verifications.</p>}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="row g-4 mt-2">
                    {/* Approved Job Verifications */}
                    <div className="col-md-12">
                        <div className="card shadow-sm">
                            <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
                                <h5 className="mb-0 fw-bold text-success">Approved Jobs</h5>
                                <button
                                    className="btn btn-sm btn-outline-success"
                                    onClick={() => setShowApprovedJobs(s => !s)}
                                    aria-expanded={showApprovedJobs}
                                >
                                    {showApprovedJobs ? 'Hide' : `Show (${approvedJobs.length})`}
                                </button>
                            </div>
                            {showApprovedJobs && (
                                <div className="card-body">
                                    {approvedJobs.length > 0 ? (
                                        <div className="row g-3">
                                            {approvedJobs.map((job) => (
                                                <div key={job._id} className="col-md-4">
                                                    <div className="card h-100 border-success-subtle bg-success-subtle bg-opacity-10">
                                                        <div className="card-body">
                                                            <div className="d-flex justify-content-between">
                                                                <h6 className="fw-bold mb-1">{job.title}</h6>
                                                                <span className="badge bg-success">LIVE</span>
                                                            </div>
                                                            <p className="text-muted small mb-0">{job.company?.companyName}</p>
                                                            <p className="fw-bold text-primary small mb-2">{job.salary}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : <p className="text-muted mb-0">No approved jobs found.</p>}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Company placement breakdown */}
                    <div className="col-md-12">
                        <CompanyPlacementCard stats={stats} />
                    </div>
                    </div>

                    <div className="row g-4 mt-3">
                        <div className="col-md-12">
                            <CollegeExperiencesCard experiences={experiences} />
                        </div>
                </div>
            </div>
        </>
    );
};

const CompanyPlacementCard = ({ stats }) => {
    const [showCompanyStats, setShowCompanyStats] = useState(false);

    const companyMap = stats?.companyBreakdown || {};
    const companies = Object.keys(companyMap);

    // derive department columns from deptBreakdown if available, otherwise from companyMap
    const deptCols = stats?.deptBreakdown ? Object.keys(stats.deptBreakdown) : Array.from(new Set(companies.flatMap(c => Object.keys(companyMap[c].byDept || {}))));

    return (
        <div className="card shadow-sm">
            <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
                <h5 className="mb-0 fw-bold text-info">Placed Students by Company</h5>
                <button
                    className="btn btn-sm btn-outline-info"
                    onClick={() => setShowCompanyStats(s => !s)}
                    aria-expanded={showCompanyStats}
                >
                    {showCompanyStats ? 'Hide' : `Show (${companies.length})`}
                </button>
            </div>
            {showCompanyStats && (
                <div className="card-body p-3">
                    {companies.length === 0 ? (
                        <p className="text-muted mb-0">No placement data available.</p>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-sm">
                                <thead>
                                    <tr>
                                        <th>Company</th>
                                        {deptCols.map(d => <th key={d}>{d}</th>)}
                                        <th>Intern / Full-time</th>
                                        <th>Best Package</th>
                                        <th>Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {companies.map(cn => (
                                        <tr key={cn}>
                                            <td className="fw-bold">{cn}</td>
                                            {deptCols.map(d => (
                                                <td key={d}>{companyMap[cn].byDept[d] || 0}</td>
                                            ))}
                                            <td>
                                                {companyMap[cn].byRole?.INTERN > 0
                                                    ? 'Internship'
                                                    : (companyMap[cn].byRole?.FULLTIME > 0 ? 'Full-time' : '-')}
                                            </td>
                                            <td>{companyMap[cn].bestPackageStr || '-'}</td>
                                            <td>{companyMap[cn].total}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const CollegeExperiencesCard = ({ experiences }) => {
    const [show, setShow] = useState(false);

    return (
        <div className="card shadow-sm">
            <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
                <h5 className="mb-0 fw-bold text-secondary">Student Experiences ({experiences.length})</h5>
                <button className="btn btn-sm btn-outline-secondary" onClick={() => setShow(s => !s)}>
                    {show ? 'Hide' : 'Show'}
                </button>
            </div>
            {show && (
                <div className="card-body p-3">
                    {experiences.length === 0 ? (
                        <p className="text-muted mb-0">No experiences shared yet.</p>
                    ) : (
                        <div className="list-group">
                            {experiences.map((e, idx) => (
                                <div key={idx} className="list-group-item">
                                    <div className="d-flex justify-content-between">
                                        <div>
                                            <h6 className="mb-1 fw-bold">{e.studentName} <small className="text-muted">({e.department})</small></h6>
                                            <small className="text-muted">{e.companyName} — {e.jobTitle} • {e.type === 'ON_CAMPUS' ? 'On-campus' : 'Off-campus'}</small>
                                        </div>
                                        <small className="text-muted">{new Date(e.date).toLocaleDateString()}</small>
                                    </div>
                                    <p className="mb-0 mt-2">{e.experience}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default CollegeDashboard;
