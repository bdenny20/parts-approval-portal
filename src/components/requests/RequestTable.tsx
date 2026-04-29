import { Link } from "react-router-dom";
import { formatCurrency, formatDateTime } from "../../lib/formatters";
import type { PartsRequest } from "../../types/domain";
import { RequestStatusBadge } from "./RequestStatusBadge";

interface RequestTableProps {
  title: string;
  requests: PartsRequest[];
  emptyMessage: string;
}

export function RequestTable({
                               title,
                               requests,
                               emptyMessage,
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
                </tr>
                </thead>

                <tbody>
                {requests.map((request) => (
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
                    </tr>
                ))}
                </tbody>
              </table>
            </div>
        )}
      </section>
  );
}