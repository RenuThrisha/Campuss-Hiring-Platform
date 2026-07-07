import React, { useEffect, useState } from 'react';
import api from '../../utils/api';
import Navbar from '../../components/common/Navbar';

const ExperienceFeed = () => {
    const [experiences, setExperiences] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchExperiences = async () => {
            try {
                const res = await api.get('/student/experiences/all');
                setExperiences(res.data.experiences || []);
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to fetch experiences');
            } finally {
                setLoading(false);
            }
        };
        fetchExperiences();
    }, []);

    if (loading) return <div className="text-center mt-5"><div className="spinner-border text-primary"></div></div>;

    return (
        <>
            <Navbar />
            <div className="container pb-5">
                <h2 className="mb-4">Placement Experiences</h2>
                {error && <div className="alert alert-danger">{error}</div>}
                {experiences.length > 0 ? (
                    <div className="row g-4">
                        {experiences.map((exp, idx) => (
                            <div key={idx} className="col-md-6 col-lg-4">
                                <div className="card shadow-sm h-100">
                                    <div className="card-body">
                                        <div className="d-flex justify-content-between">
                                            <h5 className="card-title text-primary mb-1">{exp.companyName}</h5>
                                            <span className={`badge ${exp.type === 'ON_CAMPUS' ? 'bg-info' : 'bg-warning'} text-dark`}>
                                                {exp.type === 'ON_CAMPUS' ? 'On-Campus' : 'Off-Campus'}
                                            </span>
                                        </div>
                                        <h6 className="card-subtitle mb-3 text-muted">{exp.jobTitle}</h6>
                                        <p className="card-text text-truncate-3" style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                            {exp.experience}
                                        </p>
                                        <button className="btn btn-link p-0" data-bs-toggle="modal" data-bs-target={`#modal-${idx}`}>Read More</button>
                                    </div>
                                    <div className="card-footer bg-white text-muted small">
                                        By {exp.studentName} on {new Date(exp.date).toLocaleDateString()}
                                    </div>
                                </div>

                                {/* Modal for full experience */}
                                <div className="modal fade" id={`modal-${idx}`} tabIndex="-1">
                                    <div className="modal-dialog modal-lg">
                                        <div className="modal-content">
                                            <div className="modal-header">
                                                <h5 className="modal-title">{exp.companyName} - {exp.jobTitle}</h5>
                                                <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
                                            </div>
                                            <div className="modal-body" style={{ whiteSpace: 'pre-wrap' }}>
                                                <p><strong>Shared by:</strong> {exp.studentName}</p>
                                                <hr />
                                                {exp.experience}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : <p className="text-muted">No shared experiences yet. Be the first to share yours!</p>}
            </div>
        </>
    );
};

export default ExperienceFeed;
