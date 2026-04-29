import type { Profile } from "../types/domain";

export function isOriginator(profile: Profile): boolean {
    return profile.role === "originator" || profile.approval_level === 0;
}

export function isApprover(profile: Profile): boolean {
    return profile.can_approve === true && profile.approval_level >= 1;
}

export function isAdmin(profile: Profile): boolean {
    return profile.can_manage_users === true || profile.role === "admin";
}

export function getRoleLabel(role: Profile["role"]): string {
    const labels: Record<Profile["role"], string> = {
        originator: "Originator / Parts Buyer",
        dom: "DOM",
        evp_maintenance: "EVP of Maintenance",
        ceo: "CEO",
        owner: "Owner",
        admin: "Admin",
    };

    return labels[role];
}

export function getApprovalLevelLabel(level: number): string {
    const labels: Record<number, string> = {
        0: "No approval authority",
        1: "DOM",
        2: "EVP of Maintenance",
        3: "CEO",
        4: "Owner",
    };

    return labels[level] ?? "Unknown";
}