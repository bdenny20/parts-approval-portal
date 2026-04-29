import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { corsHeaders } from "../_shared/cors.ts";

type DeliveryStatus = "pending" | "sent" | "failed";

type NotificationType =
    | "submitted"
    | "more_info_requested"
    | "approved"
    | "not_approved"
    | "recalled"
    | "cancelled";

interface EmailNotificationRow {
    id: string;
    request_id: string;
    recipient_profile_id: string | null;
    recipient_email: string;
    notification_type: NotificationType;
    subject: string;
    sent_at: string | null;
    delivery_status: DeliveryStatus;
    error_message: string | null;
    created_at: string;
}

interface PartsRequestRow {
    id: string;
    request_number: string;
    title: string;
    aircraft_tail: string;
    work_order_number: string;
    part_number: string;
    requested_amount: number;
    required_approval_role: string | null;
    required_approval_level: number | null;
    status: string;
    originator_id: string;
    profiles?: {
        full_name: string;
        email: string;
    } | null;
}

interface ProfileRow {
    id: string;
    auth_user_id: string;
    full_name: string;
    email: string;
    can_manage_users: boolean;
    is_active: boolean;
}

interface ProcessResult {
    notification_id: string;
    recipient_email: string;
    status: "sent" | "failed";
    error?: string;
}

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const resendApiKey = Deno.env.get("RESEND_API_KEY");
const emailFrom = Deno.env.get("PAP_EMAIL_FROM");
const appBaseUrl = Deno.env.get("PAP_APP_BASE_URL");
const cronSecret = Deno.env.get("PAP_EMAIL_CRON_SECRET");
const testEmailTo = Deno.env.get("PAP_TEST_EMAIL_TO");

if (!supabaseUrl) {
    throw new Error("Missing SUPABASE_URL.");
}

if (!serviceRoleKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY.");
}

if (!resendApiKey) {
    throw new Error("Missing RESEND_API_KEY.");
}

if (!emailFrom) {
    throw new Error("Missing PAP_EMAIL_FROM.");
}

if (!appBaseUrl) {
    throw new Error("Missing PAP_APP_BASE_URL.");
}

const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
    },
});

function jsonResponse(body: unknown, status = 200): Response {
    return new Response(JSON.stringify(body, null, 2), {
        status,
        headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
        },
    });
}

function formatCurrency(value: number | null | undefined): string {
    if (value === null || value === undefined || Number.isNaN(value)) {
        return "$0.00";
    }

    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
    }).format(value);
}

function getNotificationIntro(type: NotificationType): string {
    const copy: Record<NotificationType, string> = {
        submitted: "A parts approval request has been submitted.",
        more_info_requested:
            "More information has been requested for a parts approval request.",
        approved: "A parts approval request has been approved.",
        not_approved: "A parts approval request has not been approved.",
        recalled: "A parts approval request has been recalled by the originator.",
        cancelled: "A parts approval request has been cancelled by the originator.",
    };

    return copy[type];
}

function getNotificationHeading(type: NotificationType): string {
    const headings: Record<NotificationType, string> = {
        submitted: "Parts Approval Request Submitted",
        more_info_requested: "More Information Requested",
        approved: "Parts Approval Request Approved",
        not_approved: "Parts Approval Request Not Approved",
        recalled: "Parts Approval Request Recalled",
        cancelled: "Parts Approval Request Cancelled",
    };

    return headings[type];
}

function buildRequestUrl(requestId: string): string {
    return `${appBaseUrl.replace(/\/$/, "")}/requests/${requestId}`;
}

function buildTextEmail(
    notification: EmailNotificationRow,
    request: PartsRequestRow,
): string {
    return [
        getNotificationHeading(notification.notification_type),
        "",
        getNotificationIntro(notification.notification_type),
        "",
        `Request #: ${request.request_number}`,
        `Request Title: ${request.title}`,
        `Originator: ${request.profiles?.full_name ?? "Unknown"}`,
        `Aircraft Tail: ${request.aircraft_tail}`,
        `Work Order: ${request.work_order_number}`,
        `Part Number: ${request.part_number}`,
        `Requested Amount: ${formatCurrency(request.requested_amount)}`,
        `Required Approval Authority: ${
            request.required_approval_role ?? "Not calculated"
        }`,
        `Current Status: ${request.status}`,
        "",
        `Open Request: ${buildRequestUrl(request.id)}`,
        "",
        "This is an internal Parts Approval Portal notification.",
    ].join("\n");
}

function buildHtmlEmail(
    notification: EmailNotificationRow,
    request: PartsRequestRow,
): string {
    const requestUrl = buildRequestUrl(request.id);

    return `
<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,sans-serif;color:#0f172a;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:24px;">
      <tr>
        <td align="center">
          <table role="presentation" width="640" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;">
            <tr>
              <td style="background:#0f172a;color:#ffffff;padding:22px 26px;">
                <h1 style="margin:0;font-size:22px;">${getNotificationHeading(
        notification.notification_type,
    )}</h1>
                <p style="margin:8px 0 0;color:#cbd5e1;">Parts Approval Portal</p>
              </td>
            </tr>

            <tr>
              <td style="padding:26px;">
                <p style="font-size:16px;line-height:1.5;margin:0 0 18px;">
                  ${getNotificationIntro(notification.notification_type)}
                </p>

                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:18px 0;">
                  ${emailRow("Request #", request.request_number)}
                  ${emailRow("Request Title", request.title)}
                  ${emailRow(
        "Originator",
        request.profiles?.full_name ?? "Unknown",
    )}
                  ${emailRow("Aircraft Tail", request.aircraft_tail)}
                  ${emailRow("Work Order", request.work_order_number)}
                  ${emailRow("Part Number", request.part_number)}
                  ${emailRow(
        "Requested Amount",
        formatCurrency(request.requested_amount),
    )}
                  ${emailRow(
        "Required Authority",
        request.required_approval_role ?? "Not calculated",
    )}
                  ${emailRow("Current Status", request.status)}
                </table>

                <p style="margin:24px 0;">
                  <a href="${requestUrl}" style="display:inline-block;background:#0ea5e9;color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 18px;border-radius:10px;">
                    Open Request
                  </a>
                </p>

                <p style="font-size:13px;color:#64748b;line-height:1.5;margin:22px 0 0;">
                  All approvers may receive submitted-request notifications for transparency.
                  Only users with sufficient approval authority can approve the request.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;
}

function emailRow(label: string, value: string): string {
    return `
<tr>
  <td style="border-bottom:1px solid #e2e8f0;padding:10px 8px;color:#64748b;font-size:13px;width:210px;">
    ${escapeHtml(label)}
  </td>
  <td style="border-bottom:1px solid #e2e8f0;padding:10px 8px;color:#0f172a;font-size:14px;font-weight:bold;">
    ${escapeHtml(value)}
  </td>
</tr>
`;
}

function escapeHtml(value: string): string {
    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

async function assertAuthorized(req: Request): Promise<void> {
    const incomingCronSecret = req.headers.get("x-cron-secret");

    if (cronSecret && incomingCronSecret && incomingCronSecret === cronSecret) {
        return;
    }

    const authorization = req.headers.get("Authorization");

    if (!authorization) {
        throw new Error("Missing Authorization header.");
    }

    const token = authorization.replace("Bearer ", "").trim();

    if (!token) {
        throw new Error("Missing bearer token.");
    }

    const userClient = createClient(supabaseUrl!, serviceRoleKey!, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
        },
        global: {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        },
    });

    const {
        data: { user },
        error: userError,
    } = await userClient.auth.getUser(token);

    if (userError || !user) {
        throw new Error("Invalid user token.");
    }

    const { data: profile, error: profileError } = await adminClient
        .from("profiles")
        .select("id, auth_user_id, full_name, email, can_manage_users, is_active")
        .eq("auth_user_id", user.id)
        .eq("is_active", true)
        .maybeSingle();

    if (profileError) {
        throw new Error(profileError.message);
    }

    const typedProfile = profile as ProfileRow | null;

    if (!typedProfile?.can_manage_users) {
        throw new Error("User is not authorized to process email notifications.");
    }
}

async function loadPendingNotifications(
    limit: number,
): Promise<EmailNotificationRow[]> {
    const { data, error } = await adminClient
        .from("email_notification_log")
        .select("*")
        .eq("delivery_status", "pending")
        .order("created_at", { ascending: true })
        .limit(limit);

    if (error) {
        throw new Error(error.message);
    }

    return (data ?? []) as EmailNotificationRow[];
}

async function loadRequest(requestId: string): Promise<PartsRequestRow | null> {
    const { data, error } = await adminClient
        .from("parts_requests")
        .select(
            `
      *,
      profiles!parts_requests_originator_id_fkey (
        full_name,
        email
      )
    `
        )
        .eq("id", requestId)
        .maybeSingle();

    if (error) {
        throw new Error(error.message);
    }

    return data as PartsRequestRow | null;
}

async function markNotificationSent(notificationId: string): Promise<void> {
    const { error } = await adminClient
        .from("email_notification_log")
        .update({
            delivery_status: "sent",
            sent_at: new Date().toISOString(),
            error_message: null,
        })
        .eq("id", notificationId);

    if (error) {
        throw new Error(error.message);
    }
}

async function markNotificationFailed(
    notificationId: string,
    errorMessage: string,
): Promise<void> {
    const { error } = await adminClient
        .from("email_notification_log")
        .update({
            delivery_status: "failed",
            error_message: errorMessage.slice(0, 1000),
        })
        .eq("id", notificationId);

    if (error) {
        console.error("Failed to mark notification failed:", error.message);
    }
}

async function sendEmail(
    notification: EmailNotificationRow,
    request: PartsRequestRow,
): Promise<void> {
    const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            from: emailFrom,
            to: [testEmailTo || notification.recipient_email],
            subject: testEmailTo
                ? `[TEST - originally to ${notification.recipient_email}] ${notification.subject}`
                : notification.subject,ject: notification.subject,
            text: buildTextEmail(notification, request),
            html: buildHtmlEmail(notification, request),
        }),
    });

    if (!response.ok) {
        const responseText = await response.text();
        throw new Error(`Resend API error ${response.status}: ${responseText}`);
    }
}

async function processNotification(
    notification: EmailNotificationRow,
): Promise<ProcessResult> {
    try {
        const request = await loadRequest(notification.request_id);

        if (!request) {
            throw new Error("Request not found for notification.");
        }

        await sendEmail(notification, request);
        await markNotificationSent(notification.id);

        return {
            notification_id: notification.id,
            recipient_email: notification.recipient_email,
            status: "sent",
        };
    } catch (error) {
        const errorMessage =
            error instanceof Error ? error.message : "Unknown email processing error.";

        await markNotificationFailed(notification.id, errorMessage);

        return {
            notification_id: notification.id,
            recipient_email: notification.recipient_email,
            status: "failed",
            error: errorMessage,
        };
    }
}

Deno.serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", {
            headers: corsHeaders,
        });
    }

    if (req.method !== "POST") {
        return jsonResponse({ error: "Method not allowed." }, 405);
    }

    try {
        await assertAuthorized(req);

        const body = await req.json().catch(() => ({}));
        const limit = Math.min(Math.max(Number(body.limit ?? 25), 1), 100);

        const pendingNotifications = await loadPendingNotifications(limit);

        const results: ProcessResult[] = [];

        for (const notification of pendingNotifications) {
            const result = await processNotification(notification);
            results.push(result);
        }

        return jsonResponse({
            processed: results.length,
            sent: results.filter((result) => result.status === "sent").length,
            failed: results.filter((result) => result.status === "failed").length,
            results,
        });
    } catch (error) {
        const errorMessage =
            error instanceof Error ? error.message : "Unknown server error.";

        return jsonResponse(
            {
                error: errorMessage,
            },
            500,
        );
    }
});