import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Navbar = () => {
    const navigate = useNavigate();
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const role = user.role;

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const getDashboardPath = () => {
        if (role === 'COMPANY') return '/company/dashboard';
        if (role === 'COLLEGE') return '/college/dashboard';
        return '/dashboard';
    };

    return (
        <nav className="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm mb-4">
            <div className="container">
                <Link className="navbar-brand fw-bold" to={getDashboardPath()}>Campus Hiring</Link>
                <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                    <span className="navbar-toggler-icon"></span>
                </button>
                <div className="collapse navbar-collapse" id="navbarNav">
                    <ul className="navbar-nav me-auto">
                        {token && (
                            <>
                                <li className="nav-item">
                                    <Link className="nav-link" to={getDashboardPath()}>Dashboard</Link>
                                </li>
                                {role === 'STUDENT' && (
                                    <li className="nav-item">
                                        <Link className="nav-link" to="/experiences">All Experiences</Link>
                                    </li>
                                )}
                            </>
                        )}
                    </ul>
                    <div className="navbar-nav">
                        {token ? (
                            <div className="nav-item dropdown">
                                <a className="nav-link dropdown-toggle" href="#" id="userDropdown" data-bs-toggle="dropdown">
                                    {user.name || 'User'}
                                </a>
                                <ul className="dropdown-menu dropdown-menu-end">
                                    <li><button className="dropdown-item" onClick={handleLogout}>Logout</button></li>
                                </ul>
                            </div>
                        ) : (
                            <>
                                <Link className="nav-link" to="/login">Login</Link>
                                <Link className="nav-link" to="/register">Register</Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
