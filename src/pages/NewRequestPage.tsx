import { Link } from "react-router-dom";

export function NewRequestPage() {
    return (
        <div className="page-stack">
            <div className="page-title-row">
                <div>
                    <h2>New Parts Approval Request</h2>
                    <p>
                        This screen will contain the request header form and the required
                        three-quote comparison section.
                    </p>
                </div>
            </div>

            <section className="panel">
                <div className="empty-state">
                    <h3>Request form coming next</h3>
                    <p>
                        The next code drop will add the full request form, quote form
                        sections, save draft, and submit workflow.
                    </p>

                    <Link to="/" className="secondary-button link-button">
                        Back to Dashboard
                    </Link>
                </div>
            </section>
        </div>
    );
}