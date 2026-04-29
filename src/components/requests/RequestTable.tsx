import { Link } from "react-router-dom";
import { Eye, Pencil } from "lucide-react";
import { formatCurrency, formatDateTime } from "../../lib/formatters";
import type { PartsRequest } from "../../types/domain";
import { RequestStatusBadge } from "./RequestStatusBadge";

interface RequestTableProps {
    title: string;
    requests: PartsRequest[];
    emptyMessage: string;
    currentProfileId?: string;
    showEditAction?: boolean;
}

const editableStatuses = ["draft", "recalled", "more_info_requested"];

export function RequestTable({
                                 title,
                                 requests,
                                 emptyMessage,
                                 currentProfileId,
                                 showEditAction = false,
                             }: RequestTableProps) {
    return (
        <section className="panel">
            <div className="panel-header">
                <h2>{title}</h2>
                <span>{requests.length} records</span>
            </div>

            {requests.length === 0 ? (
                <div className="empty-state">{emptyMessage}</div>
            ) : (
                <div className="table-wrap">
                    <table>
                        <thead>
                        <tr>
                            <th>Request #</th>
                            <th>Title</th>
                            <th>Aircraft</th>
                            <th>Part #</th>
                            <th>Amount</th>
                            <th>Status</th>
                            <th>Required Authority</th>
                            <th>Created</th>
                            <th>Actions</th>
                        </tr>
                        </thead>

                        <tbody>
                        {requests.map((request) => {
                            const canEdit =
                                showEditAction &&
                                currentProfileId === request.originator_id &&
                                editableStatuses.includes(request.status);

                            return (
                                <tr key={request.id}>
                                    <td>
                                        <Link to={`/requests/${request.id}`} className="table-link">
                                            {request.request_number}
                                        </Link>
                                    </td>

                                    <td>{request.title}</td>
                                    <td>{request.aircraft_tail}</td>
                                    <td>{request.part_number}</td>
                                    <td>{formatCurrency(request.requested_amount)}</td>

                                    <td>
                                        <RequestStatusBadge status={request.status} />
                                    </td>

                                    <td>{request.required_approval_role ?? "—"}</td>
                                    <td>{formatDateTime(request.created_at)}</td>

                                    <td>
                                        <div className="table-action-row">
                                            <Link
                                                to={`/requests/${request.id}`}
                                                className="table-action-button"
                                            >
                                                <Eye size={15} />
                                                View
                                            </Link>

                                            {canEdit && (
                                                <Link
                                                    to={`/requests/${request.id}/edit`}
                                                    className="table-action-button edit"
                                                >
                                                    <Pencil size={15} />
                                                    Edit
                                                </Link>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    );
}