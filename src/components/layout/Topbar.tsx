import { LogOut, UserCircle } from "lucide-react";
import { useAuth } from "../../lib/auth";
import { getApprovalLevelLabel, getRoleLabel } from "../../lib/roles";

export function Topbar() {
    const { profile, signOut } = useAuth();

    return (
        <header className="topbar">
            <div>
                <h1>Parts Approval Portal</h1>
                <p>High-dollar aircraft parts approval workflow</p>
            </div>

            <div className="topbar-user">
                <UserCircle size={34} />

                <div className="topbar-user-info">
                    <strong>{profile?.full_name ?? "Unknown User"}</strong>
                    <span>
            {profile ? getRoleLabel(profile.role) : "No profile"} ·{" "}
                        {profile
                            ? getApprovalLevelLabel(profile.approval_level)
                            : "No approval level"}
          </span>
                </div>

                <button className="icon-button" type="button" onClick={signOut}>
                    <LogOut size={18} />
                </button>
            </div>
        </header>
    );
}