import { type FormEvent, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Ban, Pencil, RotateCcw, SendHorizonal } from "lucide-react";
import { useAuth } from "../../lib/auth";
import { supabase } from "../../lib/supabaseClient";
import type { PartsRequest } from "../../types/domain";

interface OriginatorActionPanelProps {
    request: PartsRequest;
    onRequestUpdated: () => Promise<void>;
}

type OriginatorActionName = "recall" | "cancel" | "resubmit";

export function OriginatorActionPanel({
                                          request,
                                          onRequestUpdated,
                                      }: OriginatorActionPanelProps) {
    const { profile } = useAuth();

    const [comments, setComments] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [activeAction, setActiveAction] = useState<OriginatorActionName | null>(
        null
    );

    const isOriginatorOwner = profile?.id === request.originator_id;

    const canEdit = useMemo(() => {
        return (
            isOriginatorOwner &&
            ["draft", "recalled", "more_info_requested"].includes(request.status)
        );
    }, [isOriginatorOwner, request.status]);

    const canRecall = useMemo(() => {
        return (
            isOriginatorOwner &&
            ["submitted", "in_review", "more_info_requested"].includes(request.status)
        );
    }, [isOriginatorOwner, request.status]);

    const canCancel = useMemo(() => {
        return (
            isOriginatorOwner &&
            !["approved", "not_approved", "cancelled"].includes(request.status)
        );
    }, [isOriginatorOwner, request.status]);

    const canResubmit = useMemo(() => {
        return (
            isOriginatorOwner &&
            ["recalled", "more_info_requested"].includes(request.status)
        );
    }, [isOriginatorOwner, request.status]);

    const hasAnyAction = canEdit || canRecall || canCancel || canResubmit;

    async function runAction(action: OriginatorActionName) {
        setErrorMessage("");
        setSuccessMessage("");
        setActiveAction(action);

        try {
            let rpcName = "";

            const payload = {
                p_request_id: request.id,
                p_comments: comments.trim() || null,
            };

            if (action === "recall") {
                rpcName = "recall_parts_request";
            }

            if (action === "cancel") {
                rpcName = "cancel_parts_request";
            }

            if (action === "resubmit") {
                rpcName = "submit_parts_request";
            }

            const { error } = await supabase.rpc(rpcName, payload);

            if (error) {
                setErrorMessage(error.message);
                return;
            }

            const successByAction: Record<OriginatorActionName, string> = {
                recall: "Request recalled successfully.",
                cancel: "Request cancelled successfully.",
                resubmit: "Request resubmitted successfully.",
            };

            setSuccessMessage(successByAction[action]);
            setComments("");
            await onRequestUpdated();
        } finally {
            setActiveAction(null);
        }
    }

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
    }

    if (!profile || !isOriginatorOwner) {
        return (
            <div className="empty-state">
                <h3>No originator actions</h3>
                <p>Only the request originator can recall, cancel, edit, or resubmit.</p>
            </div>
        );
    }

    return (
        <form className="originator-panel" onSubmit={handleSubmit}>
            <div className="originator-action-summary">
                <div>
                    <span>Originator Actions</span>
                    <strong>{hasAnyAction ? "Available" : "No action available"}</strong>
                </div>

                <div>
                    <span>Current Status</span>
                    <strong>{request.status.replaceAll("_", " ")}</strong>
                </div>
            </div>

            {!hasAnyAction && (
                <div className="form-warning">
                    No originator action is currently available for this request status.
                </div>
            )}

            <label className="form-field">
                Comments
                <textarea
                    className="form-textarea"
                    rows={4}
                    value={comments}
                    onChange={(event) => setComments(event.target.value)}
                    placeholder="Optional comments for recall, cancellation, or resubmission."
                />
            </label>

            {errorMessage && <div className="form-error">{errorMessage}</div>}
            {successMessage && <div className="form-success">{successMessage}</div>}

            <div className="originator-button-grid">
                <Link
                    to={`/requests/${request.id}/edit`}
                    className={`secondary-button link-button ${
                        !canEdit ? "disabled-link-button" : ""
                    }`}
                    onClick={(event) => {
                        if (!canEdit) {
                            event.preventDefault();
                        }
                    }}
                >
                    <Pencil size={18} />
                    Edit Request
                </Link>

                <button
                    className="secondary-button"
                    type="button"
                    disabled={!canRecall || activeAction !== null}
                    onClick={() => void runAction("recall")}
                >
                    <RotateCcw size={18} />
                    {activeAction === "recall" ? "Recalling..." : "Recall Request"}
                </button>

                <button
                    className="primary-button"
                    type="button"
                    disabled={!canResubmit || activeAction !== null}
                    onClick={() => void runAction("resubmit")}
                >
                    <SendHorizonal size={18} />
                    {activeAction === "resubmit" ? "Resubmitting..." : "Resubmit Request"}
                </button>

                <button
                    className="danger-button"
                    type="button"
                    disabled={!canCancel || activeAction !== null}
                    onClick={() => void runAction("cancel")}
                >
                    <Ban size={18} />
                    {activeAction === "cancel" ? "Cancelling..." : "Cancel Request"}
                </button>
            </div>
        </form>
    );
}