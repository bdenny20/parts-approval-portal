import { supabase } from "./supabaseClient";

export interface DashboardKpis {
    openRequests: number;
    inReview: number;
    approved: number;
    notApproved: number;
    averageApprovalHours: number;
    awaitingMyApproval: number;
}

interface DashboardKpiRpcRow {
    open_requests: number;
    in_review_requests: number;
    approved_requests: number;
    not_approved_requests: number;
    average_approval_hours: number;
    awaiting_my_approval: number;
}

export type DashboardKpiScope = "visible" | "originator" | "approver";

export const emptyDashboardKpis: DashboardKpis = {
    openRequests: 0,
    inReview: 0,
    approved: 0,
    notApproved: 0,
    averageApprovalHours: 0,
    awaitingMyApproval: 0,
};

export async function loadDashboardKpis(
    scope: DashboardKpiScope
): Promise<DashboardKpis> {
    const { data, error } = await supabase.rpc(
        "get_parts_request_dashboard_kpis",
        {
            p_scope: scope,
        }
    );

    if (error) {
        console.error("Failed to load dashboard KPIs:", error.message);
        return emptyDashboardKpis;
    }

    const row = Array.isArray(data)
        ? (data[0] as DashboardKpiRpcRow | undefined)
        : undefined;

    if (!row) {
        return emptyDashboardKpis;
    }

    return {
        openRequests: Number(row.open_requests ?? 0),
        inReview: Number(row.in_review_requests ?? 0),
        approved: Number(row.approved_requests ?? 0),
        notApproved: Number(row.not_approved_requests ?? 0),
        averageApprovalHours: Number(row.average_approval_hours ?? 0),
        awaitingMyApproval: Number(row.awaiting_my_approval ?? 0),
    };
}

export function formatAverageApprovalTime(hours: number): string {
    if (!hours || hours <= 0) {
        return "—";
    }

    if (hours < 1) {
        return `${Math.round(hours * 60)} min`;
    }

    if (hours < 24) {
        return `${hours.toFixed(1)} hrs`;
    }

    const days = hours / 24;
    return `${days.toFixed(1)} days`;
}