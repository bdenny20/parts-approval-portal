import { type FormEvent, useEffect, useMemo, useState } from "react";
import { Save, Search, ShieldCheck, UserCog } from "lucide-react";
import { getApprovalLevelLabel, getRoleLabel } from "../lib/roles";
import { supabase } from "../lib/supabaseClient";
import type { Profile, UserRole } from "../types/domain";
import { EmailProcessorPanel } from "../components/admin/EmailProcessorPanel";

interface EditableProfileState {
    full_name: string;
    email: string;
    role: UserRole;
    approval_level: string;
    can_approve: boolean;
    can_manage_users: boolean;
    department: string;
    is_active: boolean;
}

const roleOptions: UserRole[] = [
    "originator",
    "dom",
    "evp_maintenance",
    "ceo",
    "owner",
    "admin",
];

function profileToEditableState(profile: Profile): EditableProfileState {
    return {
        full_name: profile.full_name,
        email: profile.email,
        role: profile.role,
        approval_level: String(profile.approval_level),
        can_approve: profile.can_approve,
        can_manage_users: profile.can_manage_users,
        department: profile.department ?? "",
        is_active: profile.is_active,
    };
}

function getDefaultApprovalLevelForRole(role: UserRole): number {
    const levels: Record<UserRole, number> = {
        originator: 0,
        dom: 1,
        evp_maintenance: 2,
        ceo: 3,
        owner: 4,
        admin: 0,
    };

    return levels[role];
}

export function AdminUsersPage() {
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
    const [formState, setFormState] = useState<EditableProfileState | null>(null);

    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    async function loadProfiles() {
        setLoading(true);
        setErrorMessage("");

        const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .order("full_name", { ascending: true });

        if (error) {
            console.error("Failed to load profiles:", error);
            setErrorMessage(error.message);
            setProfiles([]);
        } else {
            setProfiles((data ?? []) as Profile[]);
        }

        setLoading(false);
    }

    useEffect(() => {
        void loadProfiles();
    }, []);

    const filteredProfiles = useMemo(() => {
        const normalizedSearch = search.trim().toLowerCase();

        if (!normalizedSearch) {
            return profiles;
        }

        return profiles.filter((profile) => {
            const searchableText = [
                profile.full_name,
                profile.email,
                profile.role,
                profile.department,
                String(profile.approval_level),
            ]
                .join(" ")
                .toLowerCase();

            return searchableText.includes(normalizedSearch);
        });
    }, [profiles, search]);

    function selectProfile(profile: Profile) {
        setSelectedProfile(profile);
        setFormState(profileToEditableState(profile));
        setErrorMessage("");
        setSuccessMessage("");
    }

    function updateField<K extends keyof EditableProfileState>(
        field: K,
        value: EditableProfileState[K]
    ) {
        setFormState((current) => {
            if (!current) {
                return current;
            }

            return {
                ...current,
                [field]: value,
            };
        });
    }

    function handleRoleChange(role: UserRole) {
        setFormState((current) => {
            if (!current) {
                return current;
            }

            const defaultLevel = getDefaultApprovalLevelForRole(role);

            return {
                ...current,
                role,
                approval_level: String(defaultLevel),
                can_approve: defaultLevel > 0 ? current.can_approve : false,
            };
        });
    }

    function validateForm(): string | null {
        if (!selectedProfile || !formState) {
            return "No profile selected.";
        }

        if (!formState.full_name.trim()) {
            return "Full name is required.";
        }

        if (!formState.email.trim()) {
            return "Email is required.";
        }

        const approvalLevel = Number(formState.approval_level);

        if (!Number.isInteger(approvalLevel) || approvalLevel < 0 || approvalLevel > 4) {
            return "Approval level must be a whole number between 0 and 4.";
        }

        if (approvalLevel === 0 && formState.can_approve) {
            return "A user with approval level 0 cannot have approval authority.";
        }

        if (formState.role === "admin" && formState.can_approve && approvalLevel === 0) {
            return "Admin users need an explicit approval level greater than 0 before can_approve can be enabled.";
        }

        return null;
    }

    async function handleSave(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const validationError = validateForm();

        if (validationError) {
            setErrorMessage(validationError);
            setSuccessMessage("");
            return;
        }

        if (!selectedProfile || !formState) {
            return;
        }

        setSaving(true);
        setErrorMessage("");
        setSuccessMessage("");

        const approvalLevel = Number(formState.approval_level);

        const { data, error } = await supabase
            .from("profiles")
            .update({
                full_name: formState.full_name.trim(),
                email: formState.email.trim().toLowerCase(),
                role: formState.role,
                approval_level: approvalLevel,
                can_approve: approvalLevel > 0 ? formState.can_approve : false,
                can_manage_users: formState.can_manage_users,
                department: formState.department.trim() || null,
                is_active: formState.is_active,
            })
            .eq("id", selectedProfile.id)
            .select("*")
            .single();

        if (error) {
            console.error("Failed to update profile:", error);
            setErrorMessage(error.message);
            setSaving(false);
            return;
        }

        const updatedProfile = data as Profile;

        setProfiles((currentProfiles) =>
            currentProfiles.map((profile) =>
                profile.id === updatedProfile.id ? updatedProfile : profile
            )
        );

        setSelectedProfile(updatedProfile);
        setFormState(profileToEditableState(updatedProfile));
        setSuccessMessage("Profile updated successfully.");
        setSaving(false);
    }

    return (
        <div className="page-stack">
            <div className="page-title-row">
                <div>
                    <h2>User Management</h2>
                    <p>Manage application profiles, roles, approval authority, and access.</p>
                </div>
            </div>

            {errorMessage && <div className="form-error">{errorMessage}</div>}
            {successMessage && <div className="form-success">{successMessage}</div>}
            <EmailProcessorPanel />
            <section className="admin-layout">
                <article className="panel">
                    <div className="panel-header">
                        <h2>Profiles</h2>
                        <span>{filteredProfiles.length} users</span>
                    </div>

                    <div className="admin-search">
                        <Search size={18} />
                        <input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search users, roles, departments..."
                        />
                    </div>

                    {loading ? (
                        <div className="empty-state">Loading users...</div>
                    ) : filteredProfiles.length === 0 ? (
                        <div className="empty-state">No profiles found.</div>
                    ) : (
                        <div className="admin-user-list">
                            {filteredProfiles.map((profile) => (
                                <button
                                    key={profile.id}
                                    type="button"
                                    className={`admin-user-row ${
                                        selectedProfile?.id === profile.id ? "selected" : ""
                                    }`}
                                    onClick={() => selectProfile(profile)}
                                >
                                    <div className="admin-user-avatar">
                                        <UserCog size={19} />
                                    </div>

                                    <div className="admin-user-main">
                                        <strong>{profile.full_name}</strong>
                                        <span>{profile.email}</span>
                                    </div>

                                    <div className="admin-user-meta">
                                        <span>{getRoleLabel(profile.role)}</span>
                                        <small>{getApprovalLevelLabel(profile.approval_level)}</small>
                                    </div>

                                    <div className="admin-user-flags">
                                        {profile.can_approve && <span className="mini-badge green">Approver</span>}
                                        {profile.can_manage_users && <span className="mini-badge blue">Admin</span>}
                                        {!profile.is_active && <span className="mini-badge red">Inactive</span>}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </article>

                <article className="panel">
                    <div className="panel-header">
                        <h2>Profile Editor</h2>
                        <span>{selectedProfile ? selectedProfile.full_name : "Select a user"}</span>
                    </div>

                    {!selectedProfile || !formState ? (
                        <div className="empty-state">
                            <h3>Select a profile</h3>
                            <p>Choose a user from the left to edit role and permissions.</p>
                        </div>
                    ) : (
                        <form className="admin-edit-form" onSubmit={handleSave}>
                            <div className="permission-note">
                                <ShieldCheck size={18} />
                                <span>
                  User-management access and purchase-approval authority are separate.
                  Enabling admin access does not automatically allow approval.
                </span>
                            </div>

                            <div className="form-grid admin-form-grid">
                                <label className="form-field form-span-2">
                                    Full Name
                                    <input
                                        className="form-input"
                                        value={formState.full_name}
                                        onChange={(event) => updateField("full_name", event.target.value)}
                                        required
                                    />
                                </label>

                                <label className="form-field form-span-2">
                                    Email
                                    <input
                                        className="form-input"
                                        type="email"
                                        value={formState.email}
                                        onChange={(event) => updateField("email", event.target.value)}
                                        required
                                    />
                                </label>

                                <label className="form-field">
                                    Role
                                    <select
                                        className="form-select"
                                        value={formState.role}
                                        onChange={(event) => handleRoleChange(event.target.value as UserRole)}
                                    >
                                        {roleOptions.map((role) => (
                                            <option key={role} value={role}>
                                                {getRoleLabel(role)}
                                            </option>
                                        ))}
                                    </select>
                                </label>

                                <label className="form-field">
                                    Approval Level
                                    <select
                                        className="form-select"
                                        value={formState.approval_level}
                                        onChange={(event) => updateField("approval_level", event.target.value)}
                                    >
                                        <option value="0">0 — No approval authority</option>
                                        <option value="1">1 — DOM</option>
                                        <option value="2">2 — EVP Maintenance</option>
                                        <option value="3">3 — CEO</option>
                                        <option value="4">4 — Owner</option>
                                    </select>
                                </label>

                                <label className="form-field form-span-2">
                                    Department
                                    <input
                                        className="form-input"
                                        value={formState.department}
                                        onChange={(event) => updateField("department", event.target.value)}
                                        placeholder="Parts, Maintenance, Executive, Administration"
                                    />
                                </label>

                                <div className="admin-checkbox-grid form-span-2">
                                    <label className="checkbox-card">
                                        <input
                                            type="checkbox"
                                            checked={formState.can_approve}
                                            onChange={(event) =>
                                                updateField("can_approve", event.target.checked)
                                            }
                                        />
                                        <span>
                      <strong>Can Approve Purchases</strong>
                      <small>
                        Requires approval level 1-4. Higher levels can approve lower tiers.
                      </small>
                    </span>
                                    </label>

                                    <label className="checkbox-card">
                                        <input
                                            type="checkbox"
                                            checked={formState.can_manage_users}
                                            onChange={(event) =>
                                                updateField("can_manage_users", event.target.checked)
                                            }
                                        />
                                        <span>
                      <strong>Can Manage Users</strong>
                      <small>
                        Allows editing app profiles and access settings.
                      </small>
                    </span>
                                    </label>

                                    <label className="checkbox-card">
                                        <input
                                            type="checkbox"
                                            checked={formState.is_active}
                                            onChange={(event) =>
                                                updateField("is_active", event.target.checked)
                                            }
                                        />
                                        <span>
                      <strong>Active User</strong>
                      <small>
                        Inactive users cannot use the application profile.
                      </small>
                    </span>
                                    </label>
                                </div>
                            </div>

                            <div className="admin-save-row">
                                <button className="primary-button" type="submit" disabled={saving}>
                                    <Save size={18} />
                                    {saving ? "Saving..." : "Save Profile"}
                                </button>
                            </div>
                        </form>
                    )}
                </article>
            </section>
        </div>
    );
}