import type { LucideIcon } from "lucide-react";

interface KpiCardProps {
    title: string;
    value: string | number;
    description: string;
    icon: LucideIcon;
    tone?: "blue" | "green" | "amber" | "red" | "slate";
}

export function KpiCard({
                            title,
                            value,
                            description,
                            icon: Icon,
                            tone = "slate",
                        }: KpiCardProps) {
    return (
        <article className={`kpi-card kpi-${tone}`}>
            <div className="kpi-icon">
                <Icon size={20} />
            </div>

            <div>
                <p className="kpi-title">{title}</p>
                <strong className="kpi-value">{value}</strong>
                <p className="kpi-description">{description}</p>
            </div>
        </article>
    );
}