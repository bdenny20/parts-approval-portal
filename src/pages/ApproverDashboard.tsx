import { useEffect, useMemo, useState } from "react";
import { KpiGrid } from "../components/kpi/KpiGrid";
import { RequestTable } from "../components/requests/RequestTable";
import { useAuth } from "../lib/auth";
import { supabase } from "../lib/supabaseClient";
import type { PartsRequest } from "../types/domain";

export function ApproverDashboard() {
    const { profile } = useAuth();
    const [requests, setRequests] = useState<PartsRequest[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadRequests() {
            setLoading(true);

            const { data, error } = await supabase
                .from("parts_requests")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) {
                console.error("Failed to load approval requests:", error.message);
                setRequests([]);
            } else {
                setRequests((data ?? []) as PartsRequest[]);
            }

            setLoading(false);
        }

        void loadRequests();
    }, []);

    const awaitingMyApproval = useMemo(() => {
        if (!profile || !profile.can_approve) {
            return [];
        }

        return requests.filter((request) => {
            const isOpen = ["submitted", "in_review", "more_info_requested"].includes(
                request.status
            );

            const hasAuthority =
                profile.approval_level >= (request.required_approval_level ?? 999);

            return isOpen && hasAuthority;
        });
    }, [requests, profile]);

    const allOpen = requests.filter((request) =>
        ["submitted", "in_review", "more_info_requested"].includes(request.status)
    );

    const inReview = requests.filter((request) => request.status === "in_review");

    const approved = requests.filter((request) => request.status === "approved");

    const notApproved = requests.filter(
        (request) => request.status === "not_approved"
    );

    const kpis = {
        openRequests: allOpen.length,
        inReview: inReview.length,
        approved: approved.length,
        notApproved: notApproved.length,
        awaitingMyApproval: awaitingMyApproval.length,
    };

    return (
        <div className="page-stack">
            <div className="page-title-row">
                <div>
                    <h2>Approver Dashboard</h2>
                    <p>
                        Review submitted parts requests and take action within your approval
                        authority.
                    </p>
                </div>
            </div>

            <KpiGrid {...kpis} />

            {loading ? (
                <section className="panel">
                    <div className="empty-state">Loading approval queue...</div>
                </section>
            ) : (
                <>
                    <RequestTable
                        title="Awaiting My Approval"
                        requests={awaitingMyApproval}
                        emptyMessage="No requests are currently awaiting your approval."
                    />

                    <RequestTable
                        title="All Open Requests"
                        requests={allOpen}
                        emptyMessage="No open requests."
                    />

                    <RequestTable
                        title="In Review Requests"
                        requests={inReview}
                        emptyMessage="No requests are currently in review."
                    />

                    <RequestTable
                        title="Approved History"
                        requests={approved}
                        emptyMessage="No approved request history."
                    />

                    <RequestTable
                        title="Not Approved History"
                        requests={notApproved}
                        emptyMessage="No not-approved request history."
                    />
                </>
            )}
        </div>
    );
}