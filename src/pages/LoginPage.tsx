import { type FormEvent, useState } from "react";
import { ClipboardCheck, LockKeyhole } from "lucide-react";
import { supabase } from "../lib/supabaseClient";

export function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [submitting, setSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        setSubmitting(true);
        setErrorMessage("");

        const { error } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
        });

        if (error) {
            setErrorMessage(error.message);
            setSubmitting(false);
            return;
        }

        setSubmitting(false);
    }

    return (
        <div className="login-page">
            <section className="login-card">
                <div className="login-brand">
                    <div className="login-brand-mark">
                        <ClipboardCheck size={32} />
                    </div>

                    <div>
                        <h1>Parts Approval Portal</h1>
                        <p>Internal aircraft parts approval workflow</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    <label>
                        Email
                        <input
                            type="email"
                            autoComplete="email"
                            value={email}
                            placeholder="name@jetexcellence.com"
                            onChange={(event) => setEmail(event.target.value)}
                            required
                        />
                    </label>

                    <label>
                        Password
                        <input
                            type="password"
                            autoComplete="current-password"
                            value={password}
                            placeholder="Enter your password"
                            onChange={(event) => setPassword(event.target.value)}
                            required
                        />
                    </label>

                    {errorMessage && <div className="form-error">{errorMessage}</div>}

                    <button className="primary-button" type="submit" disabled={submitting}>
                        <LockKeyhole size={18} />
                        {submitting ? "Signing in..." : "Sign In"}
                    </button>
                </form>
            </section>
        </div>
    );
}