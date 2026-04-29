import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { useAuth } from "../lib/auth";
import { isApprover, isOriginator } from "../lib/roles";
import { AdminUsersPage } from "../pages/AdminUsersPage";
import { ApproverDashboard } from "../pages/ApproverDashboard";
import { LoginPage } from "../pages/LoginPage";
import { NewRequestPage } from "../pages/NewRequestPage";
import { OriginatorDashboard } from "../pages/OriginatorDashboard";
import { RequestDetailPage } from "../pages/RequestDetailPage";
import { EditRequestPage } from "../pages/EditRequestPage";

function LoadingScreen() {
    return (
        <div className="center-screen">
            <div className="loading-card">
                <div className="spinner" />
                <p>Loading Parts Approval Portal...</p>
            </div>
        </div>
    );
}

function ProtectedRoute() {
    const { session, profile, loading } = useAuth();

    if (loading) {
        return <LoadingScreen />;
    }

    if (!session) {
        return <Navigate to="/login" replace />;
    }

    if (!profile) {
        return (
            <div className="center-screen">
                <div className="error-card">
                    <h1>Profile Not Found</h1>
                    <p>
                        Your login exists in Supabase Auth, but there is no active profile
                        record for this account.
                    </p>
                    <p className="muted">
                        Ask an administrator to verify your row in the profiles table.
                    </p>
                </div>
            </div>
        );
    }

    return <AppShell />;
}

function DashboardRedirect() {
    const { profile } = useAuth();

    if (!profile) {
        return <Navigate to="/login" replace />;
    }

    if (isApprover(profile)) {
        return <Navigate to="/approver" replace />;
    }

    if (isOriginator(profile)) {
        return <Navigate to="/originator" replace />;
    }

    return <Navigate to="/originator" replace />;
}

export function AppRouter() {
    const { session, loading } = useAuth();

    return (
        <Routes>
            <Route
                path="/login"
                element={
                    loading ? (
                        <LoadingScreen />
                    ) : session ? (
                        <Navigate to="/" replace />
                    ) : (
                        <LoginPage />
                    )
                }
            />

            <Route element={<ProtectedRoute />}>
                <Route path="/" element={<DashboardRedirect />} />
                <Route path="/originator" element={<OriginatorDashboard />} />
                <Route path="/approver" element={<ApproverDashboard />} />
                <Route path="/requests/new" element={<NewRequestPage />} />
                <Route path="/requests/:requestId/edit" element={<EditRequestPage />} />
                <Route path="/requests/:requestId" element={<RequestDetailPage />} />
                <Route path="/admin/users" element={<AdminUsersPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}