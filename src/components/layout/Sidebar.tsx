import {
    BarChart3,
    ClipboardCheck,
    FilePlus2,
    LayoutDashboard,
    ShieldCheck,
    Users,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../lib/auth";
import { isAdmin, isApprover } from "../../lib/roles";

export function Sidebar() {
    const { profile } = useAuth();

    return (
        <aside className="sidebar">
            <div className="brand">
                <div className="brand-mark">
                    <ClipboardCheck size={22} />
                </div>
                <div>
                    <div className="brand-title">Parts Approval</div>
                    <div className="brand-subtitle">Portal</div>
                </div>
            </div>

            <nav className="nav-list">
                {profile && isApprover(profile) ? (
                    <NavLink to="/approver" className="nav-link">
                        <ShieldCheck size={18} />
                        Approvals
                    </NavLink>
                ) : (
                    <NavLink to="/originator" className="nav-link">
                        <LayoutDashboard size={18} />
                        Dashboard
                    </NavLink>
                )}

                <NavLink to="/requests/new" className="nav-link">
                    <FilePlus2 size={18} />
                    New Request
                </NavLink>

                <NavLink to="/" className="nav-link">
                    <BarChart3 size={18} />
                    KPI Overview
                </NavLink>

                {profile && isAdmin(profile) && (
                    <NavLink to="/admin/users" className="nav-link">
                        <Users size={18} />
                        User Management
                    </NavLink>
                )}
            </nav>

            <div className="sidebar-footer">
                <div className="sidebar-footer-label">Internal Workflow</div>
                <div className="sidebar-footer-text">Aircraft Parts & MX</div>
            </div>
        </aside>
    );
}