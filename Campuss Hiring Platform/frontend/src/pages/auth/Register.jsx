import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../utils/api';

const DEPARTMENTS = ["CSE", "CSE-IOT", "CSE-AIML", "CSE-AIDS", "CSE-Cyber", "IT", "ECE", "EEE", "Civil", "Mech"];

const Register = () => {
    const [role, setRole] = useState('STUDENT'); // STUDENT, COMPANY, COLLEGE
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        collegeId: '',
        department: '',
        year: '1st',
        cgpa: '',
        rollNo: '', // For Students
        companyName: '', // For Companies
        website: '', // For Companies
        description: '', // For Companies
        collegeName: '', // For College registration
        collegeCode: '', // New Field
        departments: [], // Array for College registration checkpoints
    });

    const [colleges, setColleges] = useState([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        if (role === 'STUDENT') {
            const fetchColleges = async () => {
                try {
                    const res = await api.get('/auth/colleges');
                    setColleges(res.data.colleges || []);
                    if (res.data.colleges?.length > 0) {
                        setFormData(prev => ({ ...prev, collegeId: res.data.colleges[0]._id }));
                    }
                } catch (err) {
                    console.error('Error fetching colleges', err);
                }
            };
            fetchColleges();
        }
    }, [role]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            let endpoint = '/auth/student/register';
            let data = { ...formData };

            if (role === 'COMPANY') {
                endpoint = '/auth/company/register';
            } else if (role === 'COLLEGE') {
                endpoint = '/auth/college/register';
                // formData.departments is already an array for COLLEGE now
                data.departments = Array.isArray(formData.departments) ? formData.departments : [];
            } else if (role === 'STUDENT' && !formData.collegeId) {
                setError('Please select a college');
                return;
            }

            const res = await api.post(endpoint, data);
            setSuccess(res.data.message || 'Registration successful!');

            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed');
        }
    };

    return (
        <div className="container d-flex align-items-center justify-content-center min-vh-100 py-5">
            <div className="card shadow p-4" style={{ maxWidth: '600px', width: '100%' }}>
                <h2 className="text-center mb-4 text-primary">Register</h2>

                <div className="btn-group w-100 mb-4" role="group">
                    <button
                        type="button"
                        className={`btn btn-outline-primary ${role === 'STUDENT' ? 'active' : ''}`}
                        onClick={() => setRole('STUDENT')}
                    >Student</button>
                    <button
                        type="button"
                        className={`btn btn-outline-primary ${role === 'COMPANY' ? 'active' : ''}`}
                        onClick={() => setRole('COMPANY')}
                    >Company</button>
                    <button
                        type="button"
                        className={`btn btn-outline-primary ${role === 'COLLEGE' ? 'active' : ''}`}
                        onClick={() => setRole('COLLEGE')}
                    >College</button>
                </div>

                {error && <div className="alert alert-danger">{error}</div>}
                {success && <div className="alert alert-success">{success}</div>}

                <form onSubmit={handleRegister}>
                    {/* Universal Fields */}
                    <div className="mb-3">
                        <label className="form-label">{role === 'COMPANY' ? 'Contact Person Name' : 'Full Name'}</label>
                        <input name="name" className="form-control" onChange={handleChange} required value={formData.name} />
                    </div>
                    <div className="mb-3">
                        <label className="form-label">Email</label>
                        <input name="email" type="email" className="form-control" onChange={handleChange} required value={formData.email} />
                    </div>
                    <div className="mb-3">
                        <label className="form-label">Password</label>
                        <input name="password" type="password" className="form-control" onChange={handleChange} required value={formData.password} />
                    </div>

                    {/* Role Specific Fields */}
                    {role === 'STUDENT' && (
                        <>
                            <div className="mb-3">
                                <label className="form-label">Roll Number</label>
                                <input name="rollNo" className="form-control" onChange={handleChange} required placeholder="e.g. 2021CS001" value={formData.rollNo} />
                            </div>
                            <div className="mb-3">
                                <label className="form-label">College</label>
                                <select name="collegeId" className="form-select" onChange={handleChange} required value={formData.collegeId}>
                                    <option value="">Select College</option>
                                    {colleges.map((c) => (
                                        <option key={c._id} value={c._id}>{c.collegeName}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Department</label>
                                <select name="department" className="form-select" onChange={handleChange} required value={formData.department}>
                                    <option value="">Select Department</option>
                                    {DEPARTMENTS.map(dept => (
                                        <option key={dept} value={dept}>{dept}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="row">
                                <div className="col-md-6 mb-3">
                                    <label className="form-label">Year of Study</label>
                                    <select name="year" className="form-select" onChange={handleChange} required value={formData.year}>
                                        <option value="1st">1st Year</option>
                                        <option value="2nd">2nd Year</option>
                                        <option value="3rd">3rd Year</option>
                                        <option value="4th">4th Year</option>
                                    </select>
                                </div>
                                <div className="col-md-6 mb-3">
                                    <label className="form-label">CGPA</label>
                                    <input name="cgpa" type="number" step="0.01" className="form-control" onChange={handleChange} value={formData.cgpa} />
                                </div>
                            </div>
                        </>
                    )}

                    {role === 'COMPANY' && (
                        <>
                            <div className="mb-3">
                                <label className="form-label">Company Name</label>
                                <input name="companyName" className="form-control" onChange={handleChange} required value={formData.companyName} />
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Website</label>
                                <input name="website" className="form-control" onChange={handleChange} value={formData.website} />
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Description</label>
                                <textarea name="description" className="form-control" onChange={handleChange} rows="3" value={formData.description}></textarea>
                            </div>
                        </>
                    )}

                    {role === 'COLLEGE' && (
                        <>
                            <div className="mb-3">
                                <label className="form-label">College Name</label>
                                <input name="collegeName" className="form-control" onChange={handleChange} required value={formData.collegeName} />
                            </div>
                            <div className="mb-3">
                                <label className="form-label">College Code</label>
                                <input name="collegeCode" className="form-control" onChange={handleChange} required placeholder="Unique Code (e.g., VCE123)" value={formData.collegeCode} />
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Departments Handled</label>
                                <div className="card p-2" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                    {DEPARTMENTS.map(dept => (
                                        <div className="form-check" key={dept}>
                                            <input
                                                className="form-check-input"
                                                type="checkbox"
                                                value={dept}
                                                id={`dept-${dept}`}
                                                checked={formData.departments.includes(dept)}
                                                onChange={(e) => {
                                                    const { checked, value } = e.target;
                                                    setFormData(prev => {
                                                        const currentDepts = Array.isArray(prev.departments) ? prev.departments : [];
                                                        if (checked) {
                                                            return { ...prev, departments: [...currentDepts, value] };
                                                        } else {
                                                            return { ...prev, departments: currentDepts.filter(d => d !== value) };
                                                        }
                                                    });
                                                }}
                                            />
                                            <label className="form-check-label" htmlFor={`dept-${dept}`}>
                                                {dept}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    <button type="submit" className="btn btn-primary w-100 mb-3">Register as {role.charAt(0) + role.slice(1).toLowerCase()}</button>
                </form>
                <div className="text-center">
                    <p>Already have an account? <Link to="/login">Login here</Link></p>
                </div>
            </div>
        </div>
    );
};

export default Register;
