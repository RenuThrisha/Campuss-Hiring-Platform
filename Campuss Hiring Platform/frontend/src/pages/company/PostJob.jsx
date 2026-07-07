import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import Navbar from '../../components/common/Navbar';

const PostJob = () => {
    const navigate = useNavigate();
    const [colleges, setColleges] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        roleType: 'FULLTIME',
        salary: '',
        eligibleCGPA: '',
        deadline: '',
        eligibleYears: [],
        departments: [],
        selectedColleges: [],
        rounds: ['Resume Screening', 'Technical Assessment', 'Interview', 'HR Round']
    });

    const handleRoundChange = (index, value) => {
        const updatedRounds = [...formData.rounds];
        updatedRounds[index] = value;
        setFormData(prev => ({ ...prev, rounds: updatedRounds }));
    };

    const addRound = () => {
        setFormData(prev => ({ ...prev, rounds: [...prev.rounds, ''] }));
    };

    const removeRound = (index) => {
        if (formData.rounds.length > 1) {
            setFormData(prev => ({ ...prev, rounds: prev.rounds.filter((_, i) => i !== index) }));
        }
    };

    const yearsOptions = [
        { label: '1st Year', value: '1st' },
        { label: '2nd Year', value: '2nd' },
        { label: '3rd Year', value: '3rd' },
        { label: '4th Year', value: '4th' }
    ];
    const deptOptions = ['CSE', 'IT', 'ECE', 'EEE', 'Mechanical', 'Civil', 'MBA', 'MCA'];

    useEffect(() => {
        const fetchColleges = async () => {
            try {
                const res = await api.get('/auth/colleges');
                setColleges(res.data.colleges || []);
            } catch (err) {
                console.error('Error fetching colleges', err);
                setError('Failed to load colleges. Please try again.');
            } finally {
                setLoading(false);
            }
        };
        fetchColleges();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCheckboxChange = (name, value) => {
        setFormData(prev => {
            const current = prev[name];
            if (current.includes(value)) {
                return { ...prev, [name]: current.filter(item => item !== value) };
            } else {
                return { ...prev, [name]: [...current, value] };
            }
        });
    };

    const handleCollegeToggle = (collegeId) => {
        setFormData(prev => {
            const current = prev.selectedColleges;
            if (current.includes(collegeId)) {
                return { ...prev, selectedColleges: current.filter(id => id !== collegeId) };
            } else {
                return { ...prev, selectedColleges: [...current, collegeId] };
            }
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setSubmitting(true);

        const payload = {
            ...formData,
            colleges: formData.selectedColleges,
            salary: Number(formData.salary),
            eligibleCGPA: Number(formData.eligibleCGPA)
        };

        try {
            await api.post('/company/jobs', payload);
            setSuccess('Job posted successfully! Redirecting to dashboard...');
            setTimeout(() => navigate('/company/dashboard'), 2000);
        } catch (err) {
            console.error('Error posting job', err);
            setError(err.response?.data?.message || 'Failed to post job. Please check all fields.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="text-center mt-5"><div className="spinner-border text-primary"></div></div>;

    return (
        <>
            <Navbar />
            <div className="container py-5">
                <div className="row justify-content-center">
                    <div className="col-lg-8">
                        <div className="card shadow-sm border-0">
                            <div className="card-header bg-primary text-white py-3">
                                <h4 className="mb-0 fw-bold">Post a New Job Opportunity</h4>
                            </div>
                            <div className="card-body p-4">
                                {error && <div className="alert alert-danger">{error}</div>}
                                {success && <div className="alert alert-success">{success}</div>}

                                <form onSubmit={handleSubmit}>
                                    <div className="mb-4">
                                        <label className="form-label fw-bold">Job Title</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            name="title"
                                            value={formData.title}
                                            onChange={handleChange}
                                            placeholder="e.g. Software Engineer Graduate Program"
                                            required
                                        />
                                    </div>

                                    <div className="mb-4">
                                        <label className="form-label fw-bold">Job Description</label>
                                        <textarea
                                            className="form-control"
                                            name="description"
                                            rows="4"
                                            value={formData.description}
                                            onChange={handleChange}
                                            placeholder="Describe the role, responsibilities, and requirements..."
                                            required
                                        ></textarea>
                                    </div>

                                    <div className="row mb-4">
                                        <div className="col-md-6">
                                            <label className="form-label fw-bold">Role Type</label>
                                            <select
                                                className="form-select"
                                                name="roleType"
                                                value={formData.roleType}
                                                onChange={handleChange}
                                            >
                                                <option value="FULLTIME">Full-time</option>
                                                <option value="INTERN">Internship</option>
                                            </select>
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label fw-bold">Salary (LPA/Monthly)</label>
                                            <input
                                                type="number"
                                                className="form-control"
                                                name="salary"
                                                value={formData.salary}
                                                onChange={handleChange}
                                                placeholder="e.g. 1200000"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="row mb-4">
                                        <div className="col-md-6">
                                            <label className="form-label fw-bold">Minimum CGPA</label>
                                            <input
                                                type="number"
                                                step="0.1"
                                                className="form-control"
                                                name="eligibleCGPA"
                                                value={formData.eligibleCGPA}
                                                onChange={handleChange}
                                                placeholder="e.g. 7.5"
                                                required
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label fw-bold">Application Deadline</label>
                                            <input
                                                type="date"
                                                className="form-control"
                                                name="deadline"
                                                value={formData.deadline}
                                                onChange={handleChange}
                                                min={new Date().toISOString().split('T')[0]}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                        <label className="form-label d-block fw-bold">Eligible Years</label>
                                        <div className="d-flex flex-wrap gap-3 mt-2">
                                            {yearsOptions.map(year => (
                                                <div key={year.value} className="form-check">
                                                    <input
                                                        className="form-check-input"
                                                        type="checkbox"
                                                        id={`year-${year.value}`}
                                                        checked={formData.eligibleYears.includes(year.value)}
                                                        onChange={() => handleCheckboxChange('eligibleYears', year.value)}
                                                    />
                                                    <label className="form-check-label" htmlFor={`year-${year.value}`}>
                                                        {year.label}
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                        <label className="form-label d-block fw-bold">Eligible Departments</label>
                                        <div className="d-flex flex-wrap gap-3 mt-2">
                                            {deptOptions.map(dept => (
                                                <div key={dept} className="form-check">
                                                    <input
                                                        className="form-check-input"
                                                        type="checkbox"
                                                        id={`dept-${dept}`}
                                                        checked={formData.departments.includes(dept)}
                                                        onChange={() => handleCheckboxChange('departments', dept)}
                                                    />
                                                    <label className="form-check-label" htmlFor={`dept-${dept}`}>
                                                        {dept}
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                        <label className="form-label fw-bold">Target Colleges (Select at least one)</label>
                                        <div className="border rounded p-3 bg-light" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                            {colleges.length > 0 ? colleges.map(college => (
                                                <div key={college._id} className="form-check mb-2">
                                                    <input
                                                        className="form-check-input"
                                                        type="checkbox"
                                                        id={`college-${college._id}`}
                                                        checked={formData.selectedColleges.includes(college._id)}
                                                        onChange={() => handleCollegeToggle(college._id)}
                                                    />
                                                    <label className="form-check-label" htmlFor={`college-${college._id}`}>
                                                        {college.collegeName}
                                                    </label>
                                                </div>
                                            )) : <p className="text-muted mb-0">No colleges found.</p>}
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                        <label className="form-label fw-bold">Hiring Rounds</label>
                                        <div className="bg-light p-3 rounded border">
                                            {formData.rounds.map((round, index) => (
                                                <div key={index} className="d-flex mb-2 gap-2">
                                                    <span className="input-group-text bg-white">{index + 1}</span>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        value={round}
                                                        onChange={(e) => handleRoundChange(index, e.target.value)}
                                                        placeholder={`Round ${index + 1} Name`}
                                                        required
                                                    />
                                                    <button
                                                        type="button"
                                                        className="btn btn-outline-danger"
                                                        onClick={() => removeRound(index)}
                                                        disabled={formData.rounds.length <= 1}
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            ))}
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-outline-primary mt-2"
                                                onClick={addRound}
                                            >
                                                + Add Another Round
                                            </button>
                                        </div>
                                    </div>

                                    <div className="d-grid">
                                        <button
                                            type="submit"
                                            className="btn btn-primary btn-lg fw-bold"
                                            disabled={submitting || formData.selectedColleges.length === 0}
                                        >
                                            {submitting ? (
                                                <><span className="spinner-border spinner-border-sm me-2"></span>Posting...</>
                                            ) : 'Post Job Opportunity'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default PostJob;
