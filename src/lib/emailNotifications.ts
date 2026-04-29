import { supabase } from "./supabaseClient";

interface ProcessEmailResponse {
    processed: number;
    sent: number;
    failed: number;
    results: Array<{
        notification_id: string;
        recipient_email: string;
        status: "sent" | "failed";
        error?: string;
    }>;
}

export async function processPendingEmailNotifications(
    limit = 25
): Promise<ProcessEmailResponse | null> {
    const { data, error } = await supabase.functions.invoke(
        "process-email-notifications",
        {
            body: {
                limit,
            },
        }
    );

    if (error) {
        console.error("Failed to process email notifications:", error.message);
        return null;
    }

    return data as ProcessEmailResponse;
}