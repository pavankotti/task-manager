import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import { Layout } from './Layout';

// --- LAZY LOADING IMPLEMENTATION ---
const Auth = lazy(() => import('./Auth').then(module => ({ default: module.Auth })));
const ProjectDashboard = lazy(() => import('./ProjectDashboard').then(module => ({ default: module.ProjectDashboard })));
const Projects = lazy(() => import('./Projects').then(module => ({ default: module.Projects })));

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

const Dashboard = () => {
  return (
    <Layout>
      <ProjectDashboard />
    </Layout>
  );
};

// Simple spinner while lazy chunks load
const Loader = () => (
  <div className="flex h-screen items-center justify-center bg-gray-50">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 border-t-transparent"></div>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <Router>
        <Suspense fallback={<Loader />}>
          <Routes>
            <Route path="/login" element={<Auth />} />
            <Route 
              path="/projects" 
              element={<ProtectedRoute><Layout><Projects /></Layout></ProtectedRoute>} 
            />
            <Route 
              path="/board/:projectId" 
              element={<ProtectedRoute><Layout><ProjectDashboard /></Layout></ProtectedRoute>} 
            />
            {/* Default fallback redirects to projects */}
            <Route path="/" element={<Navigate to="/projects" replace />} />
          </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
  );
}

export default App;