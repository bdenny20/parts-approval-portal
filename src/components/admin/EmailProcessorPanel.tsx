import { useState } from "react";
import { MailCheck, Send } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";

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

export function EmailProcessorPanel() {
    const [processing, setProcessing] = useState(false);
    const [result, setResult] = useState<ProcessEmailResponse | null>(null);
    const [errorMessage, setErrorMessage] = useState("");

    async function processEmails() {
        setProcessing(true);
        setResult(null);
        setErrorMessage("");

        try {
            const { data, error } = await supabase.functions.invoke(
                "process-email-notifications",
                {
                    body: {
                        limit: 25,
                    },
                },
            );

            if (error) {
                setErrorMessage(error.message);
                return;
            }

            setResult(data as ProcessEmailResponse);
        } catch (error) {
            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : "Unknown email processing error.",
            );
        } finally {
            setProcessing(false);
        }
    }

    return (
        <section className="panel">
            <div className="panel-header">
                <h2>Email Notifications</h2>
                <span>Process pending email queue</span>
            </div>

            <div className="email-processor-panel">
                <div className="email-processor-copy">
                    <MailCheck size={28} />
                    <div>
                        <h3>Pending Notification Processor</h3>
                        <p>
                            Sends pending rows from the email notification log and marks them
                            as sent or failed.
                        </p>
                    </div>
                </div>

                {errorMessage && <div className="form-error">{errorMessage}</div>}

                {result && (
                    <div className="form-success">
                        Processed {result.processed}. Sent {result.sent}. Failed{" "}
                        {result.failed}.
                    </div>
                )}

                {result?.results?.length ? (
                    <div className="email-result-list">
                        {result.results.map((item) => (
                            <div key={item.notification_id} className="email-result-row">
                                <span>{item.recipient_email}</span>
                                <strong className={item.status === "sent" ? "sent" : "failed"}>
                                    {item.status}
                                </strong>
                                {item.error && <small>{item.error}</small>}
                            </div>
                        ))}
                    </div>
                ) : null}

                <button
                    className="primary-button"
                    type="button"
                    onClick={processEmails}
                    disabled={processing}
                >
                    <Send size={18} />
                    {processing ? "Processing..." : "Process Pending Emails"}
                </button>
            </div>
        </section>
    );
}