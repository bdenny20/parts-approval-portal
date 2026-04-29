import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { RequestStatusBadge } from "../components/requests/RequestStatusBadge";
import { formatCurrency, formatDateTime } from "../lib/formatters";
import { supabase } from "../lib/supabaseClient";
import type { ApprovalAction, PartsQuote, PartsRequest } from "../types/domain";
import { ApprovalActionPanel } from "../components/requests/ApprovalActionPanel";

export function RequestDetailPage() {
    const { requestId } = useParams<{ requestId: string }>();

    const [request, setRequest] = useState<PartsRequest | null>(null);
    const [quotes, setQuotes] = useState<PartsQuote[]>([]);
    const [actions, setActions] = useState<ApprovalAction[]>([]);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");

    async function loadDetail() {
        if (!requestId) {
            setErrorMessage("Missing request ID.");
            setLoading(false);
            return;
        }

        setLoading(true);
        setErrorMessage("");

        const requestResponse = await supabase
            .from("parts_requests")
            .select("*")
            .eq("id", requestId)
            .maybeSingle();

        if (requestResponse.error) {
            console.error("Failed to load request:", requestResponse.error);
            setErrorMessage(requestResponse.error.message);
            setRequest(null);
            setLoading(false);
            return;
        }

        if (!requestResponse.data) {
            setErrorMessage("Request not found.");
            setRequest(null);
            setLoading(false);
            return;
        }

        setRequest(requestResponse.data as PartsRequest);

        const quotesResponse = await supabase
            .from("parts_quotes")
            .select("*")
            .eq("request_id", requestId)
            .order("quote_number", { ascending: true });

        if (quotesResponse.error) {
            console.error("Failed to load quotes:", quotesResponse.error);
            setQuotes([]);
        } else {
            setQuotes((quotesResponse.data ?? []) as PartsQuote[]);
        }

        const actionsResponse = await supabase
            .from("approval_actions")
            .select("*, profiles(full_name, email)")
            .eq("request_id", requestId)
            .order("created_at", { ascending: false });

        if (actionsResponse.error) {
            console.error("Failed to load actions:", actionsResponse.error);
            setActions([]);
        } else {
            setActions((actionsResponse.data ?? []) as ApprovalAction[]);
        }

        setLoading(false);
    }

    useEffect(() => {
        void loadDetail();
    }, [requestId]);

    if (loading) {
        return (
            <section className="panel">
                <div className="empty-state">Loading request detail...</div>
            </section>
        );
    }

    if (errorMessage || !request) {
        return (
            <div className="page-stack">
                <Link to="/" className="secondary-button link-button">
                    <ArrowLeft size={18} />
                    Back to Dashboard
                </Link>

                <section className="panel">
                    <div className="empty-state">
                        <h3>Unable to load request</h3>
                        <p>{errorMessage || "Request not found."}</p>
                    </div>
                </section>
            </div>
        );
    }

    return (
        <div className="page-stack">
            <div className="page-title-row">
                <div>
                    <Link to="/" className="secondary-button link-button">
                        <ArrowLeft size={18} />
                        Back
                    </Link>

                    <div style={{ marginTop: 16 }}>
                        <h2>{request.title}</h2>
                        <p>{request.request_number}</p>
                    </div>
                </div>

                <RequestStatusBadge status={request.status} />
            </div>

            <section className="detail-grid">
                <article className="panel">
                    <div className="panel-header">
                        <h2>Request Header</h2>
                    </div>

                    <dl className="detail-list">
                        <div>
                            <dt>Required Authority</dt>
                            <dd>{request.required_approval_role ?? "Not calculated yet"}</dd>
                        </div>

                        <div>
                            <dt>Status</dt>
                            <dd>
                                <RequestStatusBadge status={request.status} />
                            </dd>
                        </div>

                        <div>
                            <dt>Aircraft Tail</dt>
                            <dd>{request.aircraft_tail}</dd>
                        </div>

                        <div>
                            <dt>Work Order</dt>
                            <dd>{request.work_order_number}</dd>
                        </div>

                        <div>
                            <dt>Part Number</dt>
                            <dd>{request.part_number}</dd>
                        </div>

                        <div>
                            <dt>Quantity</dt>
                            <dd>{request.quantity}</dd>
                        </div>

                        <div className="detail-span">
                            <dt>Description</dt>
                            <dd>{request.part_description}</dd>
                        </div>

                        <div>
                            <dt>Requested Amount</dt>
                            <dd>{formatCurrency(request.requested_amount)}</dd>
                        </div>

                        <div>
                            <dt>Priority</dt>
                            <dd>{request.priority}</dd>
                        </div>

                        <div>
                            <dt>Submitted At</dt>
                            <dd>{formatDateTime(request.submitted_at)}</dd>
                        </div>

                        <div>
                            <dt>Approved At</dt>
                            <dd>{formatDateTime(request.approved_at)}</dd>
                        </div>

                        <div className="detail-span">
                            <dt>Justification</dt>
                            <dd>{request.justification}</dd>
                        </div>

                        <div className="detail-span">
                            <dt>Notes</dt>
                            <dd>{request.notes ?? "—"}</dd>
                        </div>

                        <div className="detail-span">
                            <dt>Approver Comments</dt>
                            <dd>{request.approver_comments ?? "—"}</dd>
                        </div>
                    </dl>
                </article>

                <article className="panel">
                    <div className="panel-header">
                        <h2>Approval Actions</h2>
                    </div>

                    <ApprovalActionPanel
                        request={request}
                        onRequestUpdated={loadDetail}
                    />
                </article>
            </section>

            <section className="panel">
                <div className="panel-header">
                    <h2>Quote Comparison</h2>
                    <span>{quotes.length} quotes</span>
                </div>

                {quotes.length === 0 ? (
                    <div className="empty-state">No quotes found.</div>
                ) : (
                    <div className="quote-grid">
                        {quotes.map((quote) => (
                            <article
                                key={quote.id}
                                className={`quote-card ${quote.is_selected ? "selected" : ""}`}
                            >
                                <div className="quote-card-header">
                                    <h3>Quote {quote.quote_number}</h3>
                                    {quote.is_selected && <span>Selected</span>}
                                </div>

                                <dl className="quote-list">
                                    <div>
                                        <dt>Vendor</dt>
                                        <dd>{quote.vendor_name}</dd>
                                    </div>

                                    <div>
                                        <dt>Cost</dt>
                                        <dd>{formatCurrency(quote.quoted_cost)}</dd>
                                    </div>

                                    <div>
                                        <dt>Condition</dt>
                                        <dd>{quote.part_condition}</dd>
                                    </div>

                                    <div>
                                        <dt>Lead Time</dt>
                                        <dd>{quote.lead_time}</dd>
                                    </div>

                                    <div>
                                        <dt>Warranty</dt>
                                        <dd>{quote.warranty}</dd>
                                    </div>

                                    <div>
                                        <dt>Purchase Type</dt>
                                        <dd>{quote.purchase_type}</dd>
                                    </div>

                                    <div>
                                        <dt>Core Charge</dt>
                                        <dd>{formatCurrency(quote.core_charge)}</dd>
                                    </div>

                                    <div>
                                        <dt>Expiration</dt>
                                        <dd>{quote.quote_expiration_date ?? "—"}</dd>
                                    </div>

                                    <div>
                                        <dt>Notes</dt>
                                        <dd>{quote.notes ?? "—"}</dd>
                                    </div>
                                </dl>
                            </article>
                        ))}
                    </div>
                )}
            </section>

            <section className="panel">
                <div className="panel-header">
                    <h2>Audit Trail</h2>
                    <span>{actions.length} actions</span>
                </div>

                {actions.length === 0 ? (
                    <div className="empty-state">No audit actions found.</div>
                ) : (
                    <div className="timeline">
                        {actions.map((action) => (
                            <article key={action.id} className="timeline-item">
                                <div>
                                    <strong>{action.action_type.replaceAll("_", " ")}</strong>
                                    <p>{action.comments ?? "No comments"}</p>
                                </div>

                                <div className="timeline-meta">
                                    <span>{action.profiles?.full_name ?? "Unknown actor"}</span>
                                    <span>{formatDateTime(action.created_at)}</span>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}