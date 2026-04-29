import { useEffect, useMemo, useState } from "react";
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
    getUniqueOriginatorOptions,
} from "../lib/requestFilters";
import { supabase } from "../lib/supabaseClient";
import type { PartsRequest } from "../types/domain";
import { DashboardBreakdowns } from "../components/kpi/DashboardBreakdowns";
import {
    loadAircraftBreakdown,
    loadDollarTierBreakdown,
    loadOriginatorBreakdown,
    type AircraftBreakdown,
    type DollarTierBreakdown,
    type OriginatorBreakdown,
} from "../lib/dashboardBreakdowns";

const defaultFilters: DashboardFilterState = {
    search: "",
    status: "all",
    aircraft: "all",
    dollarTier: "all",
    originator: "all",
    startDate: "",
    endDate: "",
};

export function ApproverDashboard() {
    const { profile } = useAuth();

    const [requests, setRequests] = useState<PartsRequest[]>([]);
    const [filters, setFilters] = useState<DashboardFilterState>(defaultFilters);
    const [kpis, setKpis] = useState<DashboardKpis>(emptyDashboardKpis);
    const [loading, setLoading] = useState(true);
    const [dollarTiers, setDollarTiers] = useState<DollarTierBreakdown[]>([]);
    const [aircraftBreakdown, setAircraftBreakdown] = useState<AircraftBreakdown[]>([]);
    const [originatorBreakdown, setOriginatorBreakdown] = useState<OriginatorBreakdown[]>([]);

    useEffect(() => {
        async function loadRequests() {
            if (!profile) {
                setLoading(false);
                setRequests([]);
                setKpis(emptyDashboardKpis);
                return;
            }

            setLoading(true);

            const [
                { data, error },
                nextKpis,
                nextDollarTiers,
                nextAircraftBreakdown,
                nextOriginatorBreakdown,
            ] = await Promise.all([
                supabase
                    .from("parts_requests")
                    .select(
                        `
      *,
      profiles!parts_requests_originator_id_fkey (
        full_name,
        email
      )
    `
                    )
                    .order("created_at", { ascending: false }),

                loadDashboardKpis("approver"),
                loadDollarTierBreakdown("approver"),
                loadAircraftBreakdown("approver"),
                loadOriginatorBreakdown("approver"),
            ]);

            if (error) {
                console.error("Failed to load approval requests:", error.message);
                setRequests([]);
            } else {
                setRequests((data ?? []) as PartsRequest[]);
            }

            setKpis(nextKpis);
            setDollarTiers(nextDollarTiers);
            setAircraftBreakdown(nextAircraftBreakdown);
            setOriginatorBreakdown(nextOriginatorBreakdown);
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

    const originatorOptions = useMemo(() => {
        return getUniqueOriginatorOptions(requests);
    }, [requests]);

    const awaitingMyApproval = useMemo(() => {
        if (!profile || !profile.can_approve) {
            return [];
        }

        return filteredRequests.filter((request) => {
            const isOpen = ["submitted", "in_review", "more_info_requested"].includes(
                request.status
            );

            const hasAuthority =
                profile.approval_level >= (request.required_approval_level ?? 999);

            return isOpen && hasAuthority;
        });
    }, [filteredRequests, profile]);

    const allOpen = filteredRequests.filter((request) =>
        ["submitted", "in_review", "more_info_requested"].includes(request.status)
    );

    const inReview = filteredRequests.filter(
        (request) => request.status === "in_review"
    );

    const approved = filteredRequests.filter(
        (request) => request.status === "approved"
    );

    const notApproved = filteredRequests.filter(
        (request) => request.status === "not_approved"
    );

    const recalledCancelled = filteredRequests.filter((request) =>
        ["recalled", "cancelled"].includes(request.status)
    );

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
            <DashboardBreakdowns
                dollarTiers={dollarTiers}
                aircraft={aircraftBreakdown}
                originators={originatorBreakdown}
                showOriginators
            />

            <DashboardFilters
                filters={filters}
                onFiltersChange={setFilters}
                aircraftOptions={aircraftOptions}
                originatorOptions={originatorOptions}
                showOriginatorFilter
                showDateFilters
            />

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

                    <RequestTable
                        title="Recalled / Cancelled Requests"
                        requests={recalledCancelled}
                        emptyMessage="No recalled or cancelled requests."
                    />
                </>
            )}
        </div>
    );
}