import { PlusCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { KpiGrid } from "../components/kpi/KpiGrid";
import { RequestTable } from "../components/requests/RequestTable";
import { useAuth } from "../lib/auth";
import { supabase } from "../lib/supabaseClient";
import type { PartsRequest } from "../types/domain";

export function OriginatorDashboard() {
    const { profile } = useAuth();
    const [requests, setRequests] = useState<PartsRequest[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadRequests() {
            if (!profile) {
                setLoading(false);
                return;
            }

            setLoading(true);

            const { data, error } = await supabase
                .from("parts_requests")
                .select("*")
                .eq("originator_id", profile.id)
                .order("created_at", { ascending: false });

            if (error) {
                console.error("Failed to load originator requests:", error.message);
                setRequests([]);
            } else {
                setRequests((data ?? []) as PartsRequest[]);
            }

            setLoading(false);
        }

        void loadRequests();
    }, [profile]);

    const kpis = useMemo(() => {
        const openStatuses = ["submitted", "in_review", "more_info_requested"];

        return {
            openRequests: requests.filter((request) =>
                openStatuses.includes(request.status)
            ).length,
            inReview: requests.filter((request) => request.status === "in_review")
                .length,
            approved: requests.filter((request) => request.status === "approved")
                .length,
            notApproved: requests.filter(
                (request) => request.status === "not_approved"
            ).length,
            awaitingMyApproval: 0,
        };
    }, [requests]);

    const drafts = requests.filter((request) => request.status === "draft");

    const submitted = requests.filter(
        (request) => request.status === "submitted"
    );

    const open = requests.filter((request) =>
        ["submitted", "in_review", "more_info_requested"].includes(request.status)
    );

    const approved = requests.filter((request) => request.status === "approved");

    const notApproved = requests.filter(
        (request) => request.status === "not_approved"
    );

    return (
        <div className="page-stack">
            <div className="page-title-row">
                <div>
                    <h2>Originator Dashboard</h2>
                    <p>Track your high-dollar parts approval requests.</p>
                </div>

                <Link to="/requests/new" className="primary-button link-button">
                    <PlusCircle size={18} />
                    Create New Request
                </Link>
            </div>

            <KpiGrid {...kpis} />

            {loading ? (
                <section className="panel">
                    <div className="empty-state">Loading your requests...</div>
                </section>
            ) : (
                <>
                    <RequestTable
                        title="My Draft Requests"
                        requests={drafts}
                        emptyMessage="No draft requests yet."
                    />

                    <RequestTable
                        title="My Submitted Requests"
                        requests={submitted}
                        emptyMessage="No submitted requests."
                    />

                    <RequestTable
                        title="My Open Requests"
                        requests={open}
                        emptyMessage="No open requests."
                    />

                    <RequestTable
                        title="My Approved Requests"
                        requests={approved}
                        emptyMessage="No approved requests yet."
                    />

                    <RequestTable
                        title="My Not Approved Requests"
                        requests={notApproved}
                        emptyMessage="No not-approved requests."
                    />
                </>
            )}
        </div>
    );
}