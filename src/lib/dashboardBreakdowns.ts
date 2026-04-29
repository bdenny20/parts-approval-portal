import { supabase } from "./supabaseClient";

export type DashboardBreakdownScope = "visible" | "originator" | "approver";

export interface DollarTierBreakdown {
    tierKey: string;
    tierLabel: string;
    requestCount: number;
    totalRequestedAmount: number;
}

export interface AircraftBreakdown {
    aircraftTail: string;
    requestCount: number;
    totalRequestedAmount: number;
}

export interface OriginatorBreakdown {
    originatorId: string;
    originatorName: string;
    requestCount: number;
    totalRequestedAmount: number;
}

interface DollarTierRpcRow {
    tier_key: string;
    tier_label: string;
    request_count: number;
    total_requested_amount: number;
}

interface AircraftRpcRow {
    aircraft_tail: string;
    request_count: number;
    total_requested_amount: number;
}

interface OriginatorRpcRow {
    originator_id: string;
    originator_name: string;
    request_count: number;
    total_requested_amount: number;
}

export async function loadDollarTierBreakdown(
    scope: DashboardBreakdownScope
): Promise<DollarTierBreakdown[]> {
    const { data, error } = await supabase.rpc("get_requests_by_dollar_tier", {
        p_scope: scope,
    });

    if (error) {
        console.error("Failed to load dollar tier breakdown:", error.message);
        return [];
    }

    return ((data ?? []) as DollarTierRpcRow[]).map((row) => ({
        tierKey: row.tier_key,
        tierLabel: row.tier_label,
        requestCount: Number(row.request_count ?? 0),
        totalRequestedAmount: Number(row.total_requested_amount ?? 0),
    }));
}

export async function loadAircraftBreakdown(
    scope: DashboardBreakdownScope
): Promise<AircraftBreakdown[]> {
    const { data, error } = await supabase.rpc("get_requests_by_aircraft", {
        p_scope: scope,
    });

    if (error) {
        console.error("Failed to load aircraft breakdown:", error.message);
        return [];
    }

    return ((data ?? []) as AircraftRpcRow[]).map((row) => ({
        aircraftTail: row.aircraft_tail,
        requestCount: Number(row.request_count ?? 0),
        totalRequestedAmount: Number(row.total_requested_amount ?? 0),
    }));
}

export async function loadOriginatorBreakdown(
    scope: DashboardBreakdownScope
): Promise<OriginatorBreakdown[]> {
    const { data, error } = await supabase.rpc("get_requests_by_originator", {
        p_scope: scope,
    });

    if (error) {
        console.error("Failed to load originator breakdown:", error.message);
        return [];
    }

    return ((data ?? []) as OriginatorRpcRow[]).map((row) => ({
        originatorId: row.originator_id,
        originatorName: row.originator_name,
        requestCount: Number(row.request_count ?? 0),
        totalRequestedAmount: Number(row.total_requested_amount ?? 0),
    }));
}