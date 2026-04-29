import type { RequestStatus } from "../types/domain";

export function formatCurrency(value: number | null | undefined): string {
    if (value === null || value === undefined || Number.isNaN(value)) {
        return "$0.00";
    }

    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
    }).format(value);
}

export function formatDateTime(value: string | null | undefined): string {
    if (!value) {
        return "—";
    }

    return new Intl.DateTimeFormat("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(new Date(value));
}

export function getStatusLabel(status: RequestStatus): string {
    const labels: Record<RequestStatus, string> = {
        draft: "Draft",
        submitted: "Submitted",
        in_review: "In Review",
        more_info_requested: "More Info Requested",
        approved: "Approved",
        not_approved: "Not Approved",
        recalled: "Recalled",
        cancelled: "Cancelled",
    };

    return labels[status];
}