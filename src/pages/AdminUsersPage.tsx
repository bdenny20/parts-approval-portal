import { useEffect, useState } from "react";
import { getApprovalLevelLabel, getRoleLabel } from "../lib/roles";
import { supabase } from "../lib/supabaseClient";
import type { Profile } from "../types/domain";

export function AdminUsersPage() {
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadProfiles() {
            setLoading(true);

            const { data, error } = await supabase
                .from("profiles")
                .select("*")
                .order("full_name", { ascending: true });

            if (error) {
                console.error("Failed to load profiles:", error.message);
                setProfiles([]);
            } else {
                setProfiles((data ?? []) as Profile[]);
            }

            setLoading(false);
        }

        loadProfiles();
    }, []);

    return (
        <div className="page-stack">
            <div className="page-title-row">
                <div>
                    <h2>User Management</h2>
                    <p>Manage application profiles, roles, and approval authority.</p>
                </div>
            </div>

            <section className="panel">
                <div className="panel-header">
                    <h2>Profiles</h2>
                    <span>{profiles.length} users</span>
                </div>

                {loading ? (
                    <div className="empty-state">Loading users...</div>
                ) : profiles.length === 0 ? (
                    <div className="empty-state">No profiles found.</div>
                ) : (
                    <div className="table-wrap">
                        <table>
                            <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Approval Level</th>
                                <th>Can Approve</th>
                                <th>Manage Users</th>
                                <th>Active</th>
                            </tr>
                            </thead>

                            <tbody>
                            {profiles.map((profile) => (
                                <tr key={profile.id}>
                                    <td>{profile.full_name}</td>
                                    <td>{profile.email}</td>
                                    <td>{getRoleLabel(profile.role)}</td>
                                    <td>{getApprovalLevelLabel(profile.approval_level)}</td>
                                    <td>{profile.can_approve ? "Yes" : "No"}</td>
                                    <td>{profile.can_manage_users ? "Yes" : "No"}</td>
                                    <td>{profile.is_active ? "Yes" : "No"}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </div>
    );
}