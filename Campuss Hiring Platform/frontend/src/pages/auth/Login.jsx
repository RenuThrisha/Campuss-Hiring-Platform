import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../utils/api';

const Login = () => {
    const [identifier, setIdentifier] = useState(''); // email or rollNo
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('STUDENT'); // STUDENT, COMPANY, COLLEGE
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            let endpoint = '/auth/student/login';
            const loginData = { password };

            if (role === 'STUDENT') {
                loginData.rollNo = identifier;
            } else {
                loginData.email = identifier;
            }

            if (role === 'COMPANY') endpoint = '/auth/company/login';
            if (role === 'COLLEGE') endpoint = '/auth/college/login';

            const res = await api.post(endpoint, loginData);
            localStorage.setItem('token', res.data.token);
            // Use the specific role from backend (PRINCIPAL, DEPT) if available, otherwise fallback to UI role
            const userRole = res.data.user?.role || res.data.student?.role || role;
            localStorage.setItem('user', JSON.stringify({ ...(res.data.user || res.data.student), role: userRole }));

            if (userRole === 'STUDENT') navigate('/dashboard');
            else if (userRole === 'COMPANY') navigate('/company/dashboard');
            else if (['PRINCIPAL', 'DEPT', 'COLLEGE'].includes(userRole)) navigate('/college/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
        }
    };

    return (
        <div className="container d-flex align-items-center justify-content-center min-vh-100">
            <div className="card shadow p-4" style={{ maxWidth: '400px', width: '100%' }}>
                <h2 className="text-center mb-4 text-primary">Login</h2>
                {error && <div className="alert alert-danger">{error}</div>}

                <div className="btn-group w-100 mb-4" role="group">
                    <button
                        type="button"
                        className={`btn btn-outline-primary ${role === 'STUDENT' ? 'active' : ''}`}
                        onClick={() => { setRole('STUDENT'); setIdentifier(''); }}
                    >Student</button>
                    <button
                        type="button"
                        className={`btn btn-outline-primary ${role === 'COMPANY' ? 'active' : ''}`}
                        onClick={() => { setRole('COMPANY'); setIdentifier(''); }}
                    >Company</button>
                    <button
                        type="button"
                        className={`btn btn-outline-primary ${role === 'COLLEGE' ? 'active' : ''}`}
                        onClick={() => { setRole('COLLEGE'); setIdentifier(''); }}
                    >College</button>
                </div>
                <form onSubmit={handleLogin}>
                    <div className="mb-3">
                        <label className="form-label">{role === 'STUDENT' ? 'Roll Number' : 'Email'}</label>
                        <input
                            type={role === 'STUDENT' ? 'text' : 'email'}
                            className="form-control"
                            value={identifier}
                            onChange={(e) => setIdentifier(e.target.value)}
                            required
                        />
                    </div>
                    <div className="mb-3">
                        <label className="form-label">Password</label>
                        <input
                            type="password"
                            className="form-control"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className="btn btn-primary w-100 mb-3">Login</button>
                </form>
                <div className="text-center">
                    <p>Don't have an account? <Link to="/register">Register here</Link></p>
                </div>
            </div>
        </div>
    );
};

export default Login;
