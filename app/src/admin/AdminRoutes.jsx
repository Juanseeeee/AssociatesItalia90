import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './layout/AdminLayout';
import Dashboard from './pages/Dashboard';
import Members from './pages/Members';
import Requests from './pages/Requests';
import Payments from './pages/Payments';
import Activities from './pages/Activities';
import News from './pages/News';
import Login from './pages/Login';
import './admin.css';

const RequireAdmin = ({ children }) => {
  const token = localStorage.getItem('admin_token');
  if (!token) {
    return <Navigate to="/admin/login" replace />;
  }
  return children;
};

const AdminRoutes = () => {
  return (
    <Routes>
      <Route path="login" element={<Login />} />
      <Route path="/" element={
        <RequireAdmin>
          <AdminLayout />
        </RequireAdmin>
      }>
        <Route index element={<Dashboard />} />
        <Route path="members" element={<Members />} />
        <Route path="requests" element={<Requests />} />
        <Route path="payments" element={<Payments />} />
        <Route path="activities" element={<Activities />} />
        <Route path="news" element={<News />} />
      </Route>
    </Routes>
  );
};

export default AdminRoutes;
