import {
    CheckCircle2,
    Clock3,
    FileWarning,
    Hourglass,
    ShieldAlert,
    Timer,
} from "lucide-react";
import { formatAverageApprovalTime } from "../../lib/dashboardKpis";
import { KpiCard } from "./KpiCard";

interface KpiGridProps {
    openRequests: number;
    inReview: number;
    approved: number;
    notApproved: number;
    averageApprovalHours: number;
    awaitingMyApproval: number;
}

export function KpiGrid({
                            openRequests,
                            inReview,
                            approved,
                            notApproved,
                            averageApprovalHours,
                            awaitingMyApproval,
                        }: KpiGridProps) {
    return (
        <section className="kpi-grid">
            <KpiCard
                title="Open Requests"
                value={openRequests}
                description="Submitted, in review, or more info requested"
                icon={Hourglass}
                tone="blue"
            />

            <KpiCard
                title="In Review"
                value={inReview}
                description="Currently under approver review"
                icon={Clock3}
                tone="amber"
            />

            <KpiCard
                title="Approved"
                value={approved}
                description="Completed approved requests"
                icon={CheckCircle2}
                tone="green"
            />

            <KpiCard
                title="Not Approved"
                value={notApproved}
                description="Rejected purchase requests"
                icon={FileWarning}
                tone="red"
            />

            <KpiCard
                title="Avg Approval Time"
                value={formatAverageApprovalTime(averageApprovalHours)}
                description="From submitted to approved"
                icon={Timer}
                tone="purple"
            />

            <KpiCard
                title="Awaiting My Approval"
                value={awaitingMyApproval}
                description="Requests within your authority"
                icon={ShieldAlert}
                tone="slate"
            />
        </section>
    );
}