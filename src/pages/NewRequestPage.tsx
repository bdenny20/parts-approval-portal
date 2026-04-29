import { FormEvent, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Save, SendHorizonal } from "lucide-react";
import { useAuth } from "../lib/auth";
import { supabase } from "../lib/supabaseClient";
import type { PartCondition, Priority, PurchaseType } from "../types/domain";

interface RequestFormState {
    title: string;
    aircraft_tail: string;
    work_order_number: string;
    part_number: string;
    part_description: string;
    quantity: string;
    requested_amount: string;
    priority: Priority;
    justification: string;
    notes: string;
}

interface QuoteFormState {
    quote_number: number;
    vendor_name: string;
    quoted_cost: string;
    part_condition: PartCondition;
    lead_time: string;
    warranty: string;
    purchase_type: PurchaseType;
    core_charge: string;
    quote_expiration_date: string;
    notes: string;
}

const emptyRequestForm: RequestFormState = {
    title: "",
    aircraft_tail: "",
    work_order_number: "",
    part_number: "",
    part_description: "",
    quantity: "1",
    requested_amount: "",
    priority: "Routine",
    justification: "",
    notes: "",
};

const initialQuotes: QuoteFormState[] = [1, 2, 3].map((quoteNumber) => ({
    quote_number: quoteNumber,
    vendor_name: "",
    quoted_cost: "",
    part_condition: "Serviceable",
    lead_time: "",
    warranty: "",
    purchase_type: "Outright",
    core_charge: "",
    quote_expiration_date: "",
    notes: "",
}));

const priorityOptions: Priority[] = ["Routine", "Expedited", "AOG"];

const partConditionOptions: PartCondition[] = [
    "New",
    "Overhauled",
    "Serviceable",
    "As Removed",
    "Repairable",
    "Other",
];

const purchaseTypeOptions: PurchaseType[] = ["Exchange", "Outright"];

function toNumber(value: string): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
}

function toNullableNumber(value: string): number | null {
    if (!value.trim()) {
        return null;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
}

function toNullableDate(value: string): string | null {
    return value.trim() ? value : null;
}

export function NewRequestPage() {
    const { profile } = useAuth();
    const navigate = useNavigate();

    const [requestForm, setRequestForm] =
        useState<RequestFormState>(emptyRequestForm);

    const [quotes, setQuotes] = useState<QuoteFormState[]>(initialQuotes);
    const [selectedQuoteNumber, setSelectedQuoteNumber] = useState<number>(1);
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [saving, setSaving] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const requestedAmount = useMemo(
        () => toNumber(requestForm.requested_amount),
        [requestForm.requested_amount]
    );

    function updateRequestField<K extends keyof RequestFormState>(
        field: K,
        value: RequestFormState[K]
    ) {
        setRequestForm((current) => ({
            ...current,
            [field]: value,
        }));
    }

    function updateQuoteField<K extends keyof QuoteFormState>(
        quoteNumber: number,
        field: K,
        value: QuoteFormState[K]
    ) {
        setQuotes((currentQuotes) =>
            currentQuotes.map((quote) =>
                quote.quote_number === quoteNumber
                    ? {
                        ...quote,
                        [field]: value,
                    }
                    : quote
            )
        );
    }

    function validateForm(): string | null {
        if (!profile) {
            return "Your active profile could not be found.";
        }

        if (!requestForm.title.trim()) {
            return "Request title is required.";
        }

        if (!requestForm.aircraft_tail.trim()) {
            return "Aircraft tail number is required.";
        }

        if (!requestForm.work_order_number.trim()) {
            return "Work order number is required.";
        }

        if (!requestForm.part_number.trim()) {
            return "Part number is required.";
        }

        if (!requestForm.part_description.trim()) {
            return "Part description is required.";
        }

        if (toNumber(requestForm.quantity) <= 0) {
            return "Quantity must be greater than zero.";
        }

        if (requestedAmount <= 3000) {
            return "Requested amount must be greater than $3,000.";
        }

        if (!requestForm.justification.trim()) {
            return "Reason / justification is required.";
        }

        for (const quote of quotes) {
            if (!quote.vendor_name.trim()) {
                return `Vendor name is required for Quote ${quote.quote_number}.`;
            }

            if (toNumber(quote.quoted_cost) < 0 || !quote.quoted_cost.trim()) {
                return `Quoted cost is required for Quote ${quote.quote_number}.`;
            }

            if (!quote.lead_time.trim()) {
                return `Lead time is required for Quote ${quote.quote_number}.`;
            }

            if (!quote.warranty.trim()) {
                return `Warranty is required for Quote ${quote.quote_number}.`;
            }
        }

        if (![1, 2, 3].includes(selectedQuoteNumber)) {
            return "Please select a preferred quote.";
        }

        return null;
    }

    async function createDraftRequest(): Promise<string | null> {
        const validationError = validateForm();

        if (validationError) {
            setErrorMessage(validationError);
            return null;
        }

        if (!profile) {
            setErrorMessage("Active user profile not found.");
            return null;
        }

        setErrorMessage("");
        setSuccessMessage("");

        const { data: requestData, error: requestError } = await supabase
            .from("parts_requests")
            .insert({
                title: requestForm.title.trim(),
                originator_id: profile.id,
                aircraft_tail: requestForm.aircraft_tail.trim().toUpperCase(),
                work_order_number: requestForm.work_order_number.trim(),
                part_number: requestForm.part_number.trim().toUpperCase(),
                part_description: requestForm.part_description.trim(),
                quantity: toNumber(requestForm.quantity),
                requested_amount: requestedAmount,
                priority: requestForm.priority,
                justification: requestForm.justification.trim(),
                notes: requestForm.notes.trim() || null,
                status: "draft",
            })
            .select("*")
            .single();

        if (requestError || !requestData) {
            setErrorMessage(
                requestError?.message ?? "Failed to create draft request."
            );
            return null;
        }

        const requestId = requestData.id as string;

        const quoteRows = quotes.map((quote) => ({
            request_id: requestId,
            quote_number: quote.quote_number,
            vendor_name: quote.vendor_name.trim(),
            quoted_cost: toNumber(quote.quoted_cost),
            part_condition: quote.part_condition,
            lead_time: quote.lead_time.trim(),
            warranty: quote.warranty.trim(),
            purchase_type: quote.purchase_type,
            core_charge: toNullableNumber(quote.core_charge),
            quote_expiration_date: toNullableDate(quote.quote_expiration_date),
            notes: quote.notes.trim() || null,
            attachment_url: null,
            is_selected: quote.quote_number === selectedQuoteNumber,
        }));

        const { data: quoteData, error: quoteError } = await supabase
            .from("parts_quotes")
            .insert(quoteRows)
            .select("*");

        if (quoteError || !quoteData) {
            setErrorMessage(quoteError?.message ?? "Failed to create quote records.");
            return null;
        }

        const selectedQuote = quoteData.find(
            (quote) => quote.quote_number === selectedQuoteNumber
        );

        if (!selectedQuote) {
            setErrorMessage("Selected quote could not be found after save.");
            return null;
        }

        const { error: updateError } = await supabase
            .from("parts_requests")
            .update({
                selected_quote_id: selectedQuote.id,
            })
            .eq("id", requestId);

        if (updateError) {
            setErrorMessage(updateError.message);
            return null;
        }

        return requestId;
    }

    async function handleSaveDraft() {
        setSaving(true);

        try {
            const requestId = await createDraftRequest();

            if (requestId) {
                setSuccessMessage("Draft request saved successfully.");
                navigate(`/requests/${requestId}`);
            }
        } finally {
            setSaving(false);
        }
    }

    async function handleSubmitRequest(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        setSubmitting(true);

        try {
            const requestId = await createDraftRequest();

            if (!requestId) {
                return;
            }

            const { error } = await supabase.rpc("submit_parts_request", {
                p_request_id: requestId,
                p_comments: "Submitted from Parts Approval Portal.",
            });

            if (error) {
                setErrorMessage(error.message);
                return;
            }

            setSuccessMessage("Request submitted successfully.");
            navigate(`/requests/${requestId}`);
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <form className="page-stack" onSubmit={handleSubmitRequest}>
            <div className="page-title-row">
                <div>
                    <h2>New Parts Approval Request</h2>
                    <p>
                        Complete the request details and provide the required three vendor
                        quotes.
                    </p>
                </div>

                <div className="button-row">
                    <button
                        className="secondary-button"
                        type="button"
                        onClick={handleSaveDraft}
                        disabled={saving || submitting}
                    >
                        <Save size={18} />
                        {saving ? "Saving..." : "Save Draft"}
                    </button>

                    <button
                        className="primary-button"
                        type="submit"
                        disabled={saving || submitting}
                    >
                        <SendHorizonal size={18} />
                        {submitting ? "Submitting..." : "Submit Request"}
                    </button>
                </div>
            </div>

            {errorMessage && <div className="form-error">{errorMessage}</div>}

            {successMessage && <div className="form-success">{successMessage}</div>}

            <section className="panel">
                <div className="panel-header">
                    <h2>Request Header</h2>
                    <span>Required for approval workflow</span>
                </div>

                <div className="form-grid">
                    <label className="form-field form-span-2">
                        Request Title
                        <input
                            className="form-input"
                            value={requestForm.title}
                            onChange={(event) =>
                                updateRequestField("title", event.target.value)
                            }
                            placeholder="Example: N123JE Main Landing Gear Actuator"
                            required
                        />
                    </label>

                    <label className="form-field">
                        Aircraft Tail Number
                        <input
                            className="form-input"
                            value={requestForm.aircraft_tail}
                            onChange={(event) =>
                                updateRequestField("aircraft_tail", event.target.value)
                            }
                            placeholder="N123JE"
                            required
                        />
                    </label>

                    <label className="form-field">
                        Work Order Number
                        <input
                            className="form-input"
                            value={requestForm.work_order_number}
                            onChange={(event) =>
                                updateRequestField("work_order_number", event.target.value)
                            }
                            placeholder="WO-12345"
                            required
                        />
                    </label>

                    <label className="form-field">
                        Part Number
                        <input
                            className="form-input"
                            value={requestForm.part_number}
                            onChange={(event) =>
                                updateRequestField("part_number", event.target.value)
                            }
                            placeholder="PN-123456"
                            required
                        />
                    </label>

                    <label className="form-field">
                        Quantity
                        <input
                            className="form-input"
                            type="number"
                            min="1"
                            value={requestForm.quantity}
                            onChange={(event) =>
                                updateRequestField("quantity", event.target.value)
                            }
                            required
                        />
                    </label>

                    <label className="form-field form-span-2">
                        Part Description
                        <input
                            className="form-input"
                            value={requestForm.part_description}
                            onChange={(event) =>
                                updateRequestField("part_description", event.target.value)
                            }
                            placeholder="Describe the aircraft part being purchased"
                            required
                        />
                    </label>

                    <label className="form-field">
                        Requested Purchase Amount
                        <input
                            className="form-input"
                            type="number"
                            min="3000.01"
                            step="0.01"
                            value={requestForm.requested_amount}
                            onChange={(event) =>
                                updateRequestField("requested_amount", event.target.value)
                            }
                            placeholder="3001.00"
                            required
                        />
                    </label>

                    <label className="form-field">
                        Priority
                        <select
                            className="form-select"
                            value={requestForm.priority}
                            onChange={(event) =>
                                updateRequestField("priority", event.target.value as Priority)
                            }
                        >
                            {priorityOptions.map((priority) => (
                                <option key={priority} value={priority}>
                                    {priority}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="form-field form-span-2">
                        Reason / Justification
                        <textarea
                            className="form-textarea"
                            rows={4}
                            value={requestForm.justification}
                            onChange={(event) =>
                                updateRequestField("justification", event.target.value)
                            }
                            placeholder="Explain why this purchase is required."
                            required
                        />
                    </label>

                    <label className="form-field form-span-2">
                        Notes
                        <textarea
                            className="form-textarea"
                            rows={3}
                            value={requestForm.notes}
                            onChange={(event) =>
                                updateRequestField("notes", event.target.value)
                            }
                            placeholder="Optional notes"
                        />
                    </label>
                </div>
            </section>

            <section className="panel">
                <div className="panel-header">
                    <h2>Required Quote Comparison</h2>
                    <span>Three quotes required for purchases over $3,000</span>
                </div>

                <div className="quote-form-grid">
                    {quotes.map((quote) => (
                        <article
                            key={quote.quote_number}
                            className={`quote-form-card ${
                                selectedQuoteNumber === quote.quote_number ? "selected" : ""
                            }`}
                        >
                            <div className="quote-card-header">
                                <h3>Quote {quote.quote_number}</h3>

                                <label className="selected-quote-control">
                                    <input
                                        type="radio"
                                        name="selectedQuote"
                                        checked={selectedQuoteNumber === quote.quote_number}
                                        onChange={() => setSelectedQuoteNumber(quote.quote_number)}
                                    />
                                    Selected
                                </label>
                            </div>

                            <div className="quote-form-fields">
                                <label className="form-field">
                                    Vendor Name
                                    <input
                                        className="form-input"
                                        value={quote.vendor_name}
                                        onChange={(event) =>
                                            updateQuoteField(
                                                quote.quote_number,
                                                "vendor_name",
                                                event.target.value
                                            )
                                        }
                                        required
                                    />
                                </label>

                                <label className="form-field">
                                    Quoted Cost
                                    <input
                                        className="form-input"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={quote.quoted_cost}
                                        onChange={(event) =>
                                            updateQuoteField(
                                                quote.quote_number,
                                                "quoted_cost",
                                                event.target.value
                                            )
                                        }
                                        required
                                    />
                                </label>

                                <label className="form-field">
                                    Part Condition
                                    <select
                                        className="form-select"
                                        value={quote.part_condition}
                                        onChange={(event) =>
                                            updateQuoteField(
                                                quote.quote_number,
                                                "part_condition",
                                                event.target.value as PartCondition
                                            )
                                        }
                                    >
                                        {partConditionOptions.map((condition) => (
                                            <option key={condition} value={condition}>
                                                {condition}
                                            </option>
                                        ))}
                                    </select>
                                </label>

                                <label className="form-field">
                                    Lead Time
                                    <input
                                        className="form-input"
                                        value={quote.lead_time}
                                        onChange={(event) =>
                                            updateQuoteField(
                                                quote.quote_number,
                                                "lead_time",
                                                event.target.value
                                            )
                                        }
                                        placeholder="Example: 3-5 business days"
                                        required
                                    />
                                </label>

                                <label className="form-field">
                                    Warranty
                                    <input
                                        className="form-input"
                                        value={quote.warranty}
                                        onChange={(event) =>
                                            updateQuoteField(
                                                quote.quote_number,
                                                "warranty",
                                                event.target.value
                                            )
                                        }
                                        placeholder="Example: 6 months"
                                        required
                                    />
                                </label>

                                <label className="form-field">
                                    Purchase Type
                                    <select
                                        className="form-select"
                                        value={quote.purchase_type}
                                        onChange={(event) =>
                                            updateQuoteField(
                                                quote.quote_number,
                                                "purchase_type",
                                                event.target.value as PurchaseType
                                            )
                                        }
                                    >
                                        {purchaseTypeOptions.map((purchaseType) => (
                                            <option key={purchaseType} value={purchaseType}>
                                                {purchaseType}
                                            </option>
                                        ))}
                                    </select>
                                </label>

                                <label className="form-field">
                                    Core Charge
                                    <input
                                        className="form-input"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={quote.core_charge}
                                        onChange={(event) =>
                                            updateQuoteField(
                                                quote.quote_number,
                                                "core_charge",
                                                event.target.value
                                            )
                                        }
                                        placeholder="Optional"
                                    />
                                </label>

                                <label className="form-field">
                                    Quote Expiration Date
                                    <input
                                        className="form-input"
                                        type="date"
                                        value={quote.quote_expiration_date}
                                        onChange={(event) =>
                                            updateQuoteField(
                                                quote.quote_number,
                                                "quote_expiration_date",
                                                event.target.value
                                            )
                                        }
                                    />
                                </label>

                                <label className="form-field quote-notes-field">
                                    Quote Notes
                                    <textarea
                                        className="form-textarea"
                                        rows={3}
                                        value={quote.notes}
                                        onChange={(event) =>
                                            updateQuoteField(
                                                quote.quote_number,
                                                "notes",
                                                event.target.value
                                            )
                                        }
                                        placeholder="Optional quote notes"
                                    />
                                </label>
                            </div>
                        </article>
                    ))}
                </div>
            </section>
        </form>
    );
}