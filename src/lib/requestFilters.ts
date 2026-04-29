import type { PartsRequest } from "../types/domain";
import type { DashboardFilterState, DollarTierFilter } from "../components/requests/DashboardFilters";

function requestMatchesDollarTier(
    request: PartsRequest,
    dollarTier: DollarTierFilter
): boolean {
    if (dollarTier === "all") {
        return true;
    }

    const amount = Number(request.requested_amount);

    if (dollarTier === "dom") {
        return amount > 3000 && amount <= 10000;
    }

    if (dollarTier === "evp") {
        return amount > 10000 && amount <= 20000;
    }

    if (dollarTier === "ceo") {
        return amount > 20000 && amount <= 35000;
    }

    if (dollarTier === "owner") {
        return amount > 35000;
    }

    return true;
}

function normalize(value: string | null | undefined): string {
    return (value ?? "").trim().toLowerCase();
}

export function filterPartsRequests(
    requests: PartsRequest[],
    filters: DashboardFilterState
): PartsRequest[] {
    return requests.filter((request) => {
        const search = normalize(filters.search);

        if (search) {
            const searchableText = [
                request.request_number,
                request.title,
                request.aircraft_tail,
                request.work_order_number,
                request.part_number,
                request.part_description,
                request.required_approval_role,
                request.profiles?.full_name,
                request.profiles?.email,
            ]
                .map((value) => normalize(value))
                .join(" ");

            if (!searchableText.includes(search)) {
                return false;
            }
        }

        if (filters.status !== "all" && request.status !== filters.status) {
            return false;
        }

        if (filters.aircraft !== "all" && request.aircraft_tail !== filters.aircraft) {
            return false;
        }

        if (!requestMatchesDollarTier(request, filters.dollarTier)) {
            return false;
        }

        if (
            filters.originator !== "all" &&
            request.profiles?.full_name !== filters.originator
        ) {
            return false;
        }

        if (filters.startDate) {
            const createdAt = new Date(request.created_at);
            const startDate = new Date(`${filters.startDate}T00:00:00`);

            if (createdAt < startDate) {
                return false;
            }
        }

        if (filters.endDate) {
            const createdAt = new Date(request.created_at);
            const endDate = new Date(`${filters.endDate}T23:59:59`);

            if (createdAt > endDate) {
                return false;
            }
        }

        return true;
    });
}

export function getUniqueAircraftOptions(requests: PartsRequest[]): string[] {
    return Array.from(
        new Set(
            requests
                .map((request) => request.aircraft_tail)
                .filter(Boolean)
                .sort()
        )
    );
}

export function getUniqueOriginatorOptions(requests: PartsRequest[]): string[] {
    return Array.from(
        new Set(
            requests
                .map((request) => request.profiles?.full_name)
                .filter((name): name is string => Boolean(name))
                .sort()
        )
    );
}