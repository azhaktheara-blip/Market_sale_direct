import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { useAuth } from '../../context/AuthContext';
import { Skeleton } from '../common/Skeleton';

interface DashboardLayoutProps {
  requiredRole?: 'CUSTOMER' | 'FARMER' | 'ADMIN';
  portal: 'customer' | 'farmer' | 'admin';
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ requiredRole, portal }) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-stone-50">
        <Navbar />
        <div className="max-w-7xl mx-auto p-8 w-full">
          <Skeleton className="h-10 w-48 mb-6" />
          <div className="grid grid-cols-3 gap-6">
            <Skeleton className="h-32 rounded-2xl" />
            <Skeleton className="h-32 rounded-2xl" />
            <Skeleton className="h-32 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user.role !== requiredRole && user.role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      <Navbar />
      <div className="flex-1 flex max-w-7xl mx-auto w-full">
        <div className="hidden md:block">
          <Sidebar portal={portal} />
        </div>
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

