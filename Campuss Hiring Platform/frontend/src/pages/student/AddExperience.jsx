import React, { useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import Navbar from '../../components/common/Navbar';

const AddExperience = () => {
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const type = searchParams.get('type');
    const [experience, setExperience] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post(`/student/experience/${id}`, { type, experience });
            setSuccess('Experience added successfully!');
            setTimeout(() => navigate('/dashboard'), 2000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to add experience');
        }
    };

    return (
        <>
            <Navbar />
            <div className="container">
                <div className="card shadow-sm mx-auto" style={{ maxWidth: '600px' }}>
                    <div className="card-body">
                        <h4 className="card-title mb-4">Record Your Experience</h4>
                        {error && <div className="alert alert-danger">{error}</div>}
                        {success && <div className="alert alert-success">{success}</div>}
                        <form onSubmit={handleSubmit}>
                            <div className="mb-3">
                                <label className="form-label">Placement Type</label>
                                <input type="text" className="form-control" value={type === 'ON_CAMPUS' ? 'On-Campus' : 'Off-Campus'} disabled />
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Write your experience</label>
                                <textarea
                                    className="form-control"
                                    rows="10"
                                    value={experience}
                                    onChange={(e) => setExperience(e.target.value)}
                                    required
                                    placeholder="Describe the recruitment process, rounds, questions asked, etc..."
                                ></textarea>
                            </div>
                            <div className="d-flex gap-2">
                                <button type="submit" className="btn btn-primary">Save Experience</button>
                                <button type="button" className="btn btn-light" onClick={() => navigate('/dashboard')}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
};

export default AddExperience;
