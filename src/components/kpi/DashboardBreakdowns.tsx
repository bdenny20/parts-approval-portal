import { BreakdownPanel, type BreakdownItem } from "./BreakdownPanel";
import type {
    AircraftBreakdown,
    DollarTierBreakdown,
    OriginatorBreakdown,
} from "../../lib/dashboardBreakdowns";

interface DashboardBreakdownsProps {
    dollarTiers: DollarTierBreakdown[];
    aircraft: AircraftBreakdown[];
    originators?: OriginatorBreakdown[];
    showOriginators?: boolean;
}

export function DashboardBreakdowns({
                                        dollarTiers,
                                        aircraft,
                                        originators = [],
                                        showOriginators = false,
                                    }: DashboardBreakdownsProps) {
    const dollarTierItems: BreakdownItem[] = dollarTiers.map((tier) => ({
        id: tier.tierKey,
        label: tier.tierLabel,
        requestCount: tier.requestCount,
        totalRequestedAmount: tier.totalRequestedAmount,
    }));

    const aircraftItems: BreakdownItem[] = aircraft.map((item) => ({
        id: item.aircraftTail,
        label: item.aircraftTail,
        requestCount: item.requestCount,
        totalRequestedAmount: item.totalRequestedAmount,
    }));

    const originatorItems: BreakdownItem[] = originators.map((item) => ({
        id: item.originatorId,
        label: item.originatorName,
        requestCount: item.requestCount,
        totalRequestedAmount: item.totalRequestedAmount,
    }));

    return (
        <section className="dashboard-breakdowns">
            <BreakdownPanel
                title="Requests by Dollar Tier"
                subtitle="Grouped by approval authority threshold"
                items={dollarTierItems}
                emptyMessage="No dollar tier data available."
            />

            <BreakdownPanel
                title="Requests by Aircraft"
                subtitle="Top aircraft by request volume and value"
                items={aircraftItems}
                emptyMessage="No aircraft data available."
            />

            {showOriginators && (
                <BreakdownPanel
                    title="Requests by Originator"
                    subtitle="Top request creators by volume and value"
                    items={originatorItems}
                    emptyMessage="No originator data available."
                />
            )}
        </section>
    );
}