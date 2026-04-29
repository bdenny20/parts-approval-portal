import { formatCurrency } from "../../lib/formatters";

export interface BreakdownItem {
    id: string;
    label: string;
    requestCount: number;
    totalRequestedAmount: number;
}

interface BreakdownPanelProps {
    title: string;
    subtitle: string;
    items: BreakdownItem[];
    emptyMessage: string;
}

export function BreakdownPanel({
                                   title,
                                   subtitle,
                                   items,
                                   emptyMessage,
                               }: BreakdownPanelProps) {
    const maxAmount = Math.max(
        ...items.map((item) => item.totalRequestedAmount),
        0
    );

    return (
        <section className="panel breakdown-panel">
            <div className="panel-header">
                <div>
                    <h2>{title}</h2>
                    <p className="panel-subtitle">{subtitle}</p>
                </div>

                <span>{items.length} groups</span>
            </div>

            {items.length === 0 ? (
                <div className="empty-state">{emptyMessage}</div>
            ) : (
                <div className="breakdown-list">
                    {items.map((item) => {
                        const widthPercent =
                            maxAmount > 0
                                ? Math.max((item.totalRequestedAmount / maxAmount) * 100, 7)
                                : 7;

                        return (
                            <article key={item.id} className="breakdown-row">
                                <div className="breakdown-topline">
                                    <strong>{item.label}</strong>
                                    <span>{formatCurrency(item.totalRequestedAmount)}</span>
                                </div>

                                <div className="breakdown-meta">
                                    {item.requestCount}{" "}
                                    {item.requestCount === 1 ? "request" : "requests"}
                                </div>

                                <div className="breakdown-bar-track">
                                    <div
                                        className="breakdown-bar"
                                        style={{ width: `${widthPercent}%` }}
                                    />
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}
        </section>
    );
}