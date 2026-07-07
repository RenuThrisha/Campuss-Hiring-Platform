import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import StudentDashboard from './pages/student/StudentDashboard';
import ExperienceFeed from './pages/shared/ExperienceFeed';
import AddExperience from './pages/student/AddExperience';
import CompanyDashboard from './pages/company/CompanyDashboard';
import PostJob from './pages/company/PostJob';
import CompanyJobApplicants from './pages/company/CompanyJobApplicants';
import CollegeDashboard from './pages/college/CollegeDashboard';
import JobDetails from './pages/shared/JobDetails';

const DashboardRedirect = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (user.role === 'STUDENT') return <StudentDashboard />;
  if (user.role === 'COMPANY') return <Navigate to="/company/dashboard" />;
  if (['PRINCIPAL', 'DEPT'].includes(user.role)) return <Navigate to="/college/dashboard" />;
  return <Navigate to="/login" />;
};

const PrivateRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  if (!token) return <Navigate to="/login" />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" />;

  // Approval check for students
  if (user.role === 'STUDENT' && user.isApproved === false) {
    return (
      <div className="container mt-5">
        <div className="alert alert-info shadow-sm p-5 text-center">
          <h2 className="mb-4">Account Pending Approval</h2>
          <p className="lead">Your registration has been submitted successfully, but your account is currently pending approval by the college administrator.</p>
          <p>Please check back later or contact your college placement department.</p>
          <hr />
          <button className="btn btn-outline-primary" onClick={() => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
          }}>Logout & Return to Login</button>
        </div>
      </div>
    );
  }

  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <DashboardRedirect />
            </PrivateRoute>
          }
        />
        <Route
          path="/company/dashboard"
          element={
            <PrivateRoute allowedRoles={['COMPANY']}>
              <CompanyDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/company/post-job"
          element={
            <PrivateRoute allowedRoles={['COMPANY']}>
              <PostJob />
            </PrivateRoute>
          }
        />
        <Route
          path="/company/jobs/:jobId/applicants"
          element={
            <PrivateRoute allowedRoles={['COMPANY']}>
              <CompanyJobApplicants />
            </PrivateRoute>
          }
        />
        <Route
          path="/jobs/:jobId"
          element={
            <PrivateRoute>
              <JobDetails />
            </PrivateRoute>
          }
        />
        <Route
          path="/college/dashboard"
          element={
            <PrivateRoute allowedRoles={['PRINCIPAL', 'DEPT']}>
              <CollegeDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/add-experience/:id"
          element={
            <PrivateRoute allowedRoles={['STUDENT']}>
              <AddExperience />
            </PrivateRoute>
          }
        />
        <Route
          path="/experiences"
          element={
            <PrivateRoute allowedRoles={['STUDENT']}>
              <ExperienceFeed />
            </PrivateRoute>
          }
        />
        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Routes>
    </Router>
  );
}

export default App;
