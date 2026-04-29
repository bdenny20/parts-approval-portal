import type { RequestStatus } from "../../types/domain";

export type DollarTierFilter = "all" | "dom" | "evp" | "ceo" | "owner";

export interface DashboardFilterState {
    search: string;
    status: "all" | RequestStatus;
    aircraft: string;
    dollarTier: DollarTierFilter;
    originator: string;
    startDate: string;
    endDate: string;
}

interface DashboardFiltersProps {
    filters: DashboardFilterState;
    onFiltersChange: (filters: DashboardFilterState) => void;
    aircraftOptions: string[];
    originatorOptions?: string[];
    showOriginatorFilter?: boolean;
    showDateFilters?: boolean;
}

const statusOptions: Array<"all" | RequestStatus> = [
    "all",
    "draft",
    "submitted",
    "in_review",
    "more_info_requested",
    "approved",
    "not_approved",
    "recalled",
    "cancelled",
];

const dollarTierOptions: Array<{
    value: DollarTierFilter;
    label: string;
}> = [
    { value: "all", label: "All dollar tiers" },
    { value: "dom", label: "DOM: $3,001 - $10,000" },
    { value: "evp", label: "EVP MX: $10,001 - $20,000" },
    { value: "ceo", label: "CEO: $20,001 - $35,000" },
    { value: "owner", label: "Owner: $35,001+" },
];

function statusLabel(status: "all" | RequestStatus): string {
    const labels: Record<"all" | RequestStatus, string> = {
        all: "All statuses",
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

export function DashboardFilters({
                                     filters,
                                     onFiltersChange,
                                     aircraftOptions,
                                     originatorOptions = [],
                                     showOriginatorFilter = false,
                                     showDateFilters = false,
                                 }: DashboardFiltersProps) {
    function updateFilter<K extends keyof DashboardFilterState>(
        key: K,
        value: DashboardFilterState[K]
    ) {
        onFiltersChange({
            ...filters,
            [key]: value,
        });
    }

    function clearFilters() {
        onFiltersChange({
            search: "",
            status: "all",
            aircraft: "all",
            dollarTier: "all",
            originator: "all",
            startDate: "",
            endDate: "",
        });
    }

    return (
        <section className="panel">
            <div className="panel-header">
                <h2>Filters</h2>
                <button className="secondary-button compact-button" type="button" onClick={clearFilters}>
                    Clear Filters
                </button>
            </div>

            <div className="filter-grid">
                <label className="form-field">
                    Search
                    <input
                        className="form-input"
                        value={filters.search}
                        onChange={(event) => updateFilter("search", event.target.value)}
                        placeholder="Request #, title, aircraft, WO, part #"
                    />
                </label>

                <label className="form-field">
                    Status
                    <select
                        className="form-select"
                        value={filters.status}
                        onChange={(event) =>
                            updateFilter("status", event.target.value as DashboardFilterState["status"])
                        }
                    >
                        {statusOptions.map((status) => (
                            <option key={status} value={status}>
                                {statusLabel(status)}
                            </option>
                        ))}
                    </select>
                </label>

                <label className="form-field">
                    Aircraft
                    <select
                        className="form-select"
                        value={filters.aircraft}
                        onChange={(event) => updateFilter("aircraft", event.target.value)}
                    >
                        <option value="all">All aircraft</option>
                        {aircraftOptions.map((aircraft) => (
                            <option key={aircraft} value={aircraft}>
                                {aircraft}
                            </option>
                        ))}
                    </select>
                </label>

                <label className="form-field">
                    Dollar Tier
                    <select
                        className="form-select"
                        value={filters.dollarTier}
                        onChange={(event) =>
                            updateFilter("dollarTier", event.target.value as DollarTierFilter)
                        }
                    >
                        {dollarTierOptions.map((tier) => (
                            <option key={tier.value} value={tier.value}>
                                {tier.label}
                            </option>
                        ))}
                    </select>
                </label>

                {showOriginatorFilter && (
                    <label className="form-field">
                        Originator
                        <select
                            className="form-select"
                            value={filters.originator}
                            onChange={(event) => updateFilter("originator", event.target.value)}
                        >
                            <option value="all">All originators</option>
                            {originatorOptions.map((originator) => (
                                <option key={originator} value={originator}>
                                    {originator}
                                </option>
                            ))}
                        </select>
                    </label>
                )}

                {showDateFilters && (
                    <>
                        <label className="form-field">
                            Created From
                            <input
                                className="form-input"
                                type="date"
                                value={filters.startDate}
                                onChange={(event) => updateFilter("startDate", event.target.value)}
                            />
                        </label>

                        <label className="form-field">
                            Created To
                            <input
                                className="form-input"
                                type="date"
                                value={filters.endDate}
                                onChange={(event) => updateFilter("endDate", event.target.value)}
                            />
                        </label>
                    </>
                )}
            </div>
        </section>
    );
}