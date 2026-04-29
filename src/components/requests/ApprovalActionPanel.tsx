import { type FormEvent, useMemo, useState } from "react";
import {
    CheckCircle2,
    MessageSquarePlus,
    RotateCcw,
    Send,
    XCircle,
} from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../lib/auth";
import type { PartsRequest } from "../../types/domain";

interface ApprovalActionPanelProps {
    request: PartsRequest;
    onRequestUpdated: () => Promise<void>;
}

type ActionName =
    | "mark_in_review"
    | "approve"
    | "not_approve"
    | "request_more_info"
    | "comment";

const openStatuses = ["submitted", "in_review", "more_info_requested"];

export function ApprovalActionPanel({
                                        request,
                                        onRequestUpdated,
                                    }: ApprovalActionPanelProps) {
    const { profile } = useAuth();

    const [comments, setComments] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [activeAction, setActiveAction] = useState<ActionName | null>(null);

    const canApproveRequest = useMemo(() => {
        if (!profile) {
            return false;
        }

        if (!profile.can_approve) {
            return false;
        }

        if (!request.required_approval_level) {
            return false;
        }

        return profile.approval_level >= request.required_approval_level;
    }, [profile, request.required_approval_level]);

    const canTakeApprovalAction =
        canApproveRequest && openStatuses.includes(request.status);

    const canMarkInReview =
        canApproveRequest &&
        ["submitted", "more_info_requested"].includes(request.status);

    const isFinalStatus = ["approved", "not_approved", "cancelled"].includes(
        request.status
    );

    async function runRpcAction(action: ActionName) {
        setErrorMessage("");
        setSuccessMessage("");
        setActiveAction(action);

        try {
            if (action === "not_approve" && !comments.trim()) {
                setErrorMessage("Comments are required when not approving a request.");
                return;
            }

            if (action === "request_more_info" && !comments.trim()) {
                setErrorMessage("Comments are required when requesting more information.");
                return;
            }

            if (action === "comment" && !comments.trim()) {
                setErrorMessage("Comment cannot be empty.");
                return;
            }

            let rpcName = "";
            let rpcPayload: Record<string, string> = {
                p_request_id: request.id,
            };

            if (action === "mark_in_review") {
                rpcName = "mark_request_in_review";
                rpcPayload = {
                    ...rpcPayload,
                    p_comments: comments.trim() || "Marked in review.",
                };
            }

            if (action === "approve") {
                rpcName = "approve_parts_request";
                rpcPayload = {
                    ...rpcPayload,
                    p_comments: comments.trim() || "Approved.",
                };
            }

            if (action === "not_approve") {
                rpcName = "not_approve_parts_request";
                rpcPayload = {
                    ...rpcPayload,
                    p_comments: comments.trim(),
                };
            }

            if (action === "request_more_info") {
                rpcName = "request_more_info_parts_request";
                rpcPayload = {
                    ...rpcPayload,
                    p_comments: comments.trim(),
                };
            }

            if (action === "comment") {
                rpcName = "comment_on_parts_request";
                rpcPayload = {
                    ...rpcPayload,
                    p_comments: comments.trim(),
                };
            }

            const { error } = await supabase.rpc(rpcName, rpcPayload);

            if (error) {
                setErrorMessage(error.message);
                return;
            }

            const successByAction: Record<ActionName, string> = {
                mark_in_review: "Request marked in review.",
                approve: "Request approved successfully.",
                not_approve: "Request marked as not approved.",
                request_more_info: "More information requested from originator.",
                comment: "Comment added successfully.",
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

    if (!profile) {
        return (
            <div className="empty-state">
                <h3>No active profile</h3>
                <p>Your profile could not be loaded.</p>
            </div>
        );
    }

    return (
        <form className="approval-panel" onSubmit={handleSubmit}>
            <div className="approval-summary">
                <div>
                    <span>Your Approval Level</span>
                    <strong>{profile.approval_level}</strong>
                </div>

                <div>
                    <span>Required Level</span>
                    <strong>{request.required_approval_level ?? "—"}</strong>
                </div>

                <div>
                    <span>Authority</span>
                    <strong>{canApproveRequest ? "Authorized" : "Not Authorized"}</strong>
                </div>
            </div>

            {!canApproveRequest && (
                <div className="form-warning">
                    You can view this request, but you do not have approval authority for
                    this dollar tier.
                </div>
            )}

            {isFinalStatus && (
                <div className="form-warning">
                    This request is already in a final status. Approval actions are closed.
                </div>
            )}

            <label className="form-field">
                Comments
                <textarea
                    className="form-textarea"
                    rows={5}
                    value={comments}
                    onChange={(event) => setComments(event.target.value)}
                    placeholder="Add approval comments, rejection reason, or request for more information."
                />
            </label>

            {errorMessage && <div className="form-error">{errorMessage}</div>}
            {successMessage && <div className="form-success">{successMessage}</div>}

            <div className="approval-button-grid">
                <button
                    className="secondary-button"
                    type="button"
                    disabled={!canMarkInReview || activeAction !== null}
                    onClick={() => void runRpcAction("mark_in_review")}
                >
                    <RotateCcw size={18} />
                    {activeAction === "mark_in_review" ? "Updating..." : "Mark In Review"}
                </button>

                <button
                    className="primary-button"
                    type="button"
                    disabled={!canTakeApprovalAction || activeAction !== null}
                    onClick={() => void runRpcAction("approve")}
                >
                    <CheckCircle2 size={18} />
                    {activeAction === "approve" ? "Approving..." : "Approve"}
                </button>

                <button
                    className="danger-button"
                    type="button"
                    disabled={!canTakeApprovalAction || activeAction !== null}
                    onClick={() => void runRpcAction("not_approve")}
                >
                    <XCircle size={18} />
                    {activeAction === "not_approve" ? "Updating..." : "Not Approve"}
                </button>

                <button
                    className="secondary-button"
                    type="button"
                    disabled={!canTakeApprovalAction || activeAction !== null}
                    onClick={() => void runRpcAction("request_more_info")}
                >
                    <Send size={18} />
                    {activeAction === "request_more_info"
                        ? "Sending..."
                        : "Request More Info"}
                </button>

                <button
                    className="secondary-button approval-comment-button"
                    type="button"
                    disabled={activeAction !== null || !comments.trim()}
                    onClick={() => void runRpcAction("comment")}
                >
                    <MessageSquarePlus size={18} />
                    {activeAction === "comment" ? "Adding..." : "Add Comment"}
                </button>
            </div>
        </form>
    );
}