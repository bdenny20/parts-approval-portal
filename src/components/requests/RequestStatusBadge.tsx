import { getStatusLabel } from "../../lib/formatters";
import type { RequestStatus } from "../../types/domain";

interface RequestStatusBadgeProps {
    status: RequestStatus;
}

export function RequestStatusBadge({ status }: RequestStatusBadgeProps) {
    return (
        <span className={`status-badge status-${status}`}>
      {getStatusLabel(status)}
    </span>
    );
}