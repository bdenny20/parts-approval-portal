export type UserRole =
    | "originator"
    | "dom"
    | "evp_maintenance"
    | "ceo"
    | "owner"
    | "admin";

export type RequestStatus =
    | "draft"
    | "submitted"
    | "in_review"
    | "more_info_requested"
    | "approved"
    | "not_approved"
    | "recalled"
    | "cancelled";

export type Priority = "Routine" | "Expedited" | "AOG";

export type PartCondition =
    | "New"
    | "Overhauled"
    | "Serviceable"
    | "As Removed"
    | "Repairable"
    | "Other";

export type PurchaseType = "Exchange" | "Outright";

export interface Profile {
    id: string;
    auth_user_id: string;
    full_name: string;
    email: string;
    role: UserRole;
    approval_level: number;
    can_approve: boolean;
    can_manage_users: boolean;
    department: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface PartsRequest {
    id: string;
    request_number: string;
    title: string;
    originator_id: string;
    aircraft_tail: string;
    work_order_number: string;
    part_number: string;
    part_description: string;
    quantity: number;
    requested_amount: number;
    priority: Priority;
    justification: string;
    selected_quote_id: string | null;
    required_approval_level: number | null;
    required_approval_role: string | null;
    status: RequestStatus;
    submitted_at: string | null;
    approved_at: string | null;
    not_approved_at: string | null;
    final_action_by: string | null;
    approver_comments: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
    profiles?: Pick<Profile, "full_name" | "email"> | null;
}

export interface PartsQuote {
    id: string;
    request_id: string;
    quote_number: number;
    vendor_name: string;
    quoted_cost: number;
    part_condition: PartCondition;
    lead_time: string;
    warranty: string;
    purchase_type: PurchaseType;
    core_charge: number | null;
    quote_expiration_date: string | null;
    notes: string | null;
    attachment_url: string | null;
    is_selected: boolean;
    created_at: string;
    updated_at: string;
}

export interface ApprovalAction {
    id: string;
    request_id: string;
    actor_id: string;
    action_type:
        | "created"
        | "submitted"
        | "marked_in_review"
        | "requested_more_info"
        | "approved"
        | "not_approved"
        | "recalled"
        | "cancelled"
        | "commented";
    previous_status: string | null;
    new_status: string | null;
    actor_approval_level: number | null;
    required_approval_level: number | null;
    comments: string | null;
    created_at: string;
    profiles?: Pick<Profile, "full_name" | "email"> | null;
}
export interface EmailNotificationLog {
    id: string;
    request_id: string;
    recipient_profile_id: string | null;
    recipient_email: string;
    notification_type:
        | "submitted"
        | "more_info_requested"
        | "approved"
        | "not_approved"
        | "recalled"
        | "cancelled";
    subject: string;
    sent_at: string | null;
    delivery_status: "pending" | "sent" | "failed";
    error_message: string | null;
    created_at: string;
}