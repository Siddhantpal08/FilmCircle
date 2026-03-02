import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/common/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import MovieDetail from './pages/MovieDetail';
import Community from './pages/Community';
import Clubs from './pages/Clubs';
import ClubDetail from './pages/ClubDetail';
import Upload from './pages/Upload';
import Profile from './pages/Profile';
import Loader from './components/common/Loader';

function ProtectedRoute({ children }) {
    const { isAuthenticated, loading } = useAuth();
    if (loading) return <Loader />;
    return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function AppRoutes() {
    const { loading } = useAuth();
    if (loading) return <Loader fullPage />;

    return (
        <>
            <Navbar />
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/movie/:id" element={<MovieDetail />} />
                <Route path="/community" element={<Community />} />
                <Route path="/clubs" element={<Clubs />} />
                <Route path="/clubs/:id" element={<ClubDetail />} />
                <Route path="/upload" element={<ProtectedRoute><Upload /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="*" element={
                    <div className="page flex-center flex-col" style={{ textAlign: 'center', gap: '1rem' }}>
                        <h1>404</h1>
                        <p>This page doesn't exist</p>
                        <a href="/" className="btn btn-primary">Go Home</a>
                    </div>
                } />
            </Routes>
        </>
    );
}

export default function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <AppRoutes />
            </BrowserRouter>
        </AuthProvider>
    );
}
