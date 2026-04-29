import { PlusCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { KpiGrid } from "../components/kpi/KpiGrid";
import {
    DashboardFilters,
    type DashboardFilterState,
} from "../components/requests/DashboardFilters";
import { RequestTable } from "../components/requests/RequestTable";
import { useAuth } from "../lib/auth";
import {
    emptyDashboardKpis,
    loadDashboardKpis,
    type DashboardKpis,
} from "../lib/dashboardKpis";
import {
    filterPartsRequests,
    getUniqueAircraftOptions,
} from "../lib/requestFilters";
import { supabase } from "../lib/supabaseClient";
import type { PartsRequest } from "../types/domain";

const defaultFilters: DashboardFilterState = {
    search: "",
    status: "all",
    aircraft: "all",
    dollarTier: "all",
    originator: "all",
    startDate: "",
    endDate: "",
};

export function OriginatorDashboard() {
    const { profile } = useAuth();

    const [requests, setRequests] = useState<PartsRequest[]>([]);
    const [filters, setFilters] = useState<DashboardFilterState>(defaultFilters);
    const [kpis, setKpis] = useState<DashboardKpis>(emptyDashboardKpis);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadRequests() {
            if (!profile) {
                setLoading(false);
                setRequests([]);
                setKpis(emptyDashboardKpis);
                return;
            }

            setLoading(true);

            const [{ data, error }, nextKpis] = await Promise.all([
                supabase
                    .from("parts_requests")
                    .select("*")
                    .eq("originator_id", profile.id)
                    .order("created_at", { ascending: false }),

                loadDashboardKpis("originator"),
            ]);

            if (error) {
                console.error("Failed to load originator requests:", error.message);
                setRequests([]);
            } else {
                setRequests((data ?? []) as PartsRequest[]);
            }

            setKpis(nextKpis);
            setLoading(false);
        }

        void loadRequests();
    }, [profile]);

    const filteredRequests = useMemo(() => {
        return filterPartsRequests(requests, filters);
    }, [requests, filters]);

    const aircraftOptions = useMemo(() => {
        return getUniqueAircraftOptions(requests);
    }, [requests]);

    const editable = filteredRequests.filter((request) =>
        ["draft", "recalled", "more_info_requested"].includes(request.status)
    );

    const drafts = filteredRequests.filter((request) => request.status === "draft");

    const submitted = filteredRequests.filter(
        (request) => request.status === "submitted"
    );

    const open = filteredRequests.filter((request) =>
        ["submitted", "in_review", "more_info_requested"].includes(request.status)
    );

    const approved = filteredRequests.filter(
        (request) => request.status === "approved"
    );

    const notApproved = filteredRequests.filter(
        (request) => request.status === "not_approved"
    );

    const closed = filteredRequests.filter((request) =>
        ["recalled", "cancelled"].includes(request.status)
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

            <DashboardFilters
                filters={filters}
                onFiltersChange={setFilters}
                aircraftOptions={aircraftOptions}
            />

            {loading ? (
                <section className="panel">
                    <div className="empty-state">Loading your requests...</div>
                </section>
            ) : (
                <>
                    <RequestTable
                        title="Editable Requests"
                        requests={editable}
                        emptyMessage="No editable draft, recalled, or more-info requests."
                        currentProfileId={profile?.id}
                        showEditAction
                    />

                    <RequestTable
                        title="My Draft Requests"
                        requests={drafts}
                        emptyMessage="No draft requests yet."
                        currentProfileId={profile?.id}
                        showEditAction
                    />

                    <RequestTable
                        title="My Submitted Requests"
                        requests={submitted}
                        emptyMessage="No submitted requests."
                        currentProfileId={profile?.id}
                        showEditAction
                    />

                    <RequestTable
                        title="My Open Requests"
                        requests={open}
                        emptyMessage="No open requests."
                        currentProfileId={profile?.id}
                        showEditAction
                    />

                    <RequestTable
                        title="My Approved Requests"
                        requests={approved}
                        emptyMessage="No approved requests yet."
                        currentProfileId={profile?.id}
                        showEditAction
                    />

                    <RequestTable
                        title="My Not Approved Requests"
                        requests={notApproved}
                        emptyMessage="No not-approved requests."
                        currentProfileId={profile?.id}
                        showEditAction
                    />

                    <RequestTable
                        title="Recalled / Cancelled Requests"
                        requests={closed}
                        emptyMessage="No recalled or cancelled requests."
                        currentProfileId={profile?.id}
                        showEditAction
                    />
                </>
            )}
        </div>
    );
}