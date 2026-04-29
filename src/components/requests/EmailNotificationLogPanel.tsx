import { AlertTriangle, CheckCircle2, Clock3, Mail } from "lucide-react";
import { formatDateTime } from "../../lib/formatters";
import type { EmailNotificationLog } from "../../types/domain";

interface EmailNotificationLogPanelProps {
    logs: EmailNotificationLog[];
}

function getNotificationTypeLabel(type: EmailNotificationLog["notification_type"]) {
    const labels: Record<EmailNotificationLog["notification_type"], string> = {
        submitted: "Submitted",
        more_info_requested: "More Info Requested",
        approved: "Approved",
        not_approved: "Not Approved",
        recalled: "Recalled",
        cancelled: "Cancelled",
    };

    return labels[type];
}

function getStatusIcon(status: EmailNotificationLog["delivery_status"]) {
    if (status === "sent") {
        return <CheckCircle2 size={17} />;
    }

    if (status === "failed") {
        return <AlertTriangle size={17} />;
    }

    return <Clock3 size={17} />;
}

function getStatusLabel(status: EmailNotificationLog["delivery_status"]) {
    const labels: Record<EmailNotificationLog["delivery_status"], string> = {
        pending: "Pending",
        sent: "Sent",
        failed: "Failed",
    };

    return labels[status];
}

export function EmailNotificationLogPanel({
                                              logs,
                                          }: EmailNotificationLogPanelProps) {
    if (logs.length === 0) {
        return (
            <section className="panel">
                <div className="panel-header">
                    <h2>Email Notifications</h2>
                    <span>0 records</span>
                </div>

                <div className="empty-state">
                    <h3>No email notifications found</h3>
                    <p>
                        Email records will appear here when a request is submitted,
                        approved, not approved, recalled, cancelled, or has more information
                        requested.
                    </p>
                </div>
            </section>
        );
    }

    return (
        <section className="panel">
            <div className="panel-header">
                <h2>Email Notifications</h2>
                <span>{logs.length} records</span>
            </div>

            <div className="email-log-list">
                {logs.map((log) => (
                    <article key={log.id} className="email-log-row">
                        <div className="email-log-icon">
                            <Mail size={18} />
                        </div>

                        <div className="email-log-main">
                            <div className="email-log-topline">
                                <strong>{log.recipient_email}</strong>

                                <span className={`email-delivery-badge ${log.delivery_status}`}>
                  {getStatusIcon(log.delivery_status)}
                                    {getStatusLabel(log.delivery_status)}
                </span>
                            </div>

                            <div className="email-log-subject">{log.subject}</div>

                            <div className="email-log-meta">
                                <span>{getNotificationTypeLabel(log.notification_type)}</span>
                                <span>Queued: {formatDateTime(log.created_at)}</span>
                                <span>Sent: {formatDateTime(log.sent_at)}</span>
                            </div>

                            {log.error_message && (
                                <div className="email-log-error">{log.error_message}</div>
                            )}
                        </div>
                    </article>
                ))}
            </div>
        </section>
    );
}