import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, SendHorizonal } from "lucide-react";
import { RequestStatusBadge } from "../components/requests/RequestStatusBadge";
import { useAuth } from "../lib/auth";
import { supabase } from "../lib/supabaseClient";
import type {
    PartCondition,
    PartsQuote,
    PartsRequest,
    Priority,
    PurchaseType,
} from "../types/domain";

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
    id: string;
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

const editableStatuses = ["draft", "recalled", "more_info_requested"];

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

function moneyToInput(value: number | null | undefined): string {
    if (value === null || value === undefined) {
        return "";
    }

    return String(value);
}

function dateToInput(value: string | null | undefined): string {
    if (!value) {
        return "";
    }

    return value.slice(0, 10);
}

export function EditRequestPage() {
    const { requestId } = useParams<{ requestId: string }>();
    const { profile } = useAuth();
    const navigate = useNavigate();

    const [request, setRequest] = useState<PartsRequest | null>(null);
    const [requestForm, setRequestForm] = useState<RequestFormState | null>(null);
    const [quotes, setQuotes] = useState<QuoteFormState[]>([]);
    const [selectedQuoteNumber, setSelectedQuoteNumber] = useState<number>(1);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const requestedAmount = useMemo(() => {
        return toNumber(requestForm?.requested_amount ?? "");
    }, [requestForm?.requested_amount]);

    const canEdit = useMemo(() => {
        if (!profile || !request) {
            return false;
        }

        return (
            profile.id === request.originator_id &&
            editableStatuses.includes(request.status)
        );
    }, [profile, request]);

    useEffect(() => {
        async function loadRequestForEdit() {
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
                setErrorMessage(requestResponse.error.message);
                setLoading(false);
                return;
            }

            if (!requestResponse.data) {
                setErrorMessage("Request not found.");
                setLoading(false);
                return;
            }

            const loadedRequest = requestResponse.data as PartsRequest;
            setRequest(loadedRequest);

            setRequestForm({
                title: loadedRequest.title ?? "",
                aircraft_tail: loadedRequest.aircraft_tail ?? "",
                work_order_number: loadedRequest.work_order_number ?? "",
                part_number: loadedRequest.part_number ?? "",
                part_description: loadedRequest.part_description ?? "",
                quantity: String(loadedRequest.quantity ?? 1),
                requested_amount: moneyToInput(loadedRequest.requested_amount),
                priority: loadedRequest.priority ?? "Routine",
                justification: loadedRequest.justification ?? "",
                notes: loadedRequest.notes ?? "",
            });

            const quotesResponse = await supabase
                .from("parts_quotes")
                .select("*")
                .eq("request_id", requestId)
                .order("quote_number", { ascending: true });

            if (quotesResponse.error) {
                setErrorMessage(quotesResponse.error.message);
                setLoading(false);
                return;
            }

            const loadedQuotes = (quotesResponse.data ?? []) as PartsQuote[];

            setQuotes(
                loadedQuotes.map((quote) => ({
                    id: quote.id,
                    quote_number: quote.quote_number,
                    vendor_name: quote.vendor_name ?? "",
                    quoted_cost: moneyToInput(quote.quoted_cost),
                    part_condition: quote.part_condition,
                    lead_time: quote.lead_time ?? "",
                    warranty: quote.warranty ?? "",
                    purchase_type: quote.purchase_type,
                    core_charge: moneyToInput(quote.core_charge),
                    quote_expiration_date: dateToInput(quote.quote_expiration_date),
                    notes: quote.notes ?? "",
                }))
            );

            const selectedQuote = loadedQuotes.find((quote) => quote.is_selected);

            if (selectedQuote) {
                setSelectedQuoteNumber(selectedQuote.quote_number);
            }

            setLoading(false);
        }

        void loadRequestForEdit();
    }, [requestId]);

    function updateRequestField<K extends keyof RequestFormState>(
        field: K,
        value: RequestFormState[K]
    ) {
        setRequestForm((current) => {
            if (!current) {
                return current;
            }

            return {
                ...current,
                [field]: value,
            };
        });
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

        if (!request) {
            return "Request could not be loaded.";
        }

        if (!requestForm) {
            return "Request form could not be loaded.";
        }

        if (!canEdit) {
            return "This request cannot be edited in its current status.";
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

        if (quotes.length !== 3) {
            return "Exactly three quotes are required.";
        }

        for (const quote of quotes) {
            if (!quote.vendor_name.trim()) {
                return `Vendor name is required for Quote ${quote.quote_number}.`;
            }

            if (!quote.quoted_cost.trim() || toNumber(quote.quoted_cost) < 0) {
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

    async function saveChanges(): Promise<boolean> {
        const validationError = validateForm();

        if (validationError) {
            setErrorMessage(validationError);
            return false;
        }

        if (!request || !requestForm) {
            setErrorMessage("Request data is missing.");
            return false;
        }

        setErrorMessage("");
        setSuccessMessage("");

        const { error: requestError } = await supabase
            .from("parts_requests")
            .update({
                title: requestForm.title.trim(),
                aircraft_tail: requestForm.aircraft_tail.trim().toUpperCase(),
                work_order_number: requestForm.work_order_number.trim(),
                part_number: requestForm.part_number.trim().toUpperCase(),
                part_description: requestForm.part_description.trim(),
                quantity: toNumber(requestForm.quantity),
                requested_amount: requestedAmount,
                priority: requestForm.priority,
                justification: requestForm.justification.trim(),
                notes: requestForm.notes.trim() || null,
            })
            .eq("id", request.id);

        if (requestError) {
            setErrorMessage(requestError.message);
            return false;
        }

        for (const quote of quotes) {
            const { error: quoteError } = await supabase
                .from("parts_quotes")
                .update({
                    vendor_name: quote.vendor_name.trim(),
                    quoted_cost: toNumber(quote.quoted_cost),
                    part_condition: quote.part_condition,
                    lead_time: quote.lead_time.trim(),
                    warranty: quote.warranty.trim(),
                    purchase_type: quote.purchase_type,
                    core_charge: toNullableNumber(quote.core_charge),
                    quote_expiration_date: toNullableDate(quote.quote_expiration_date),
                    notes: quote.notes.trim() || null,
                    is_selected: quote.quote_number === selectedQuoteNumber,
                })
                .eq("id", quote.id);

            if (quoteError) {
                setErrorMessage(quoteError.message);
                return false;
            }
        }

        const selectedQuote = quotes.find(
            (quote) => quote.quote_number === selectedQuoteNumber
        );

        if (!selectedQuote) {
            setErrorMessage("Selected quote could not be found.");
            return false;
        }

        const { error: selectedQuoteError } = await supabase
            .from("parts_requests")
            .update({
                selected_quote_id: selectedQuote.id,
            })
            .eq("id", request.id);

        if (selectedQuoteError) {
            setErrorMessage(selectedQuoteError.message);
            return false;
        }

        return true;
    }

    async function handleSaveChanges() {
        setSaving(true);

        try {
            const saved = await saveChanges();

            if (saved && request) {
                setSuccessMessage("Request changes saved.");
                navigate(`/requests/${request.id}`);
            }
        } finally {
            setSaving(false);
        }
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        setSubmitting(true);

        try {
            const saved = await saveChanges();

            if (!saved || !request) {
                return;
            }

            const { error } = await supabase.rpc("submit_parts_request", {
                p_request_id: request.id,
                p_comments:
                    request.status === "recalled"
                        ? "Resubmitted after recall."
                        : request.status === "more_info_requested"
                            ? "Resubmitted with additional information."
                            : "Submitted from edit screen.",
            });

            if (error) {
                setErrorMessage(error.message);
                return;
            }

            setSuccessMessage("Request submitted successfully.");
            navigate(`/requests/${request.id}`);
        } finally {
            setSubmitting(false);
        }
    }

    if (loading) {
        return (
            <section className="panel">
                <div className="empty-state">Loading request editor...</div>
            </section>
        );
    }

    if (errorMessage && (!request || !requestForm)) {
        return (
            <div className="page-stack">
                <Link to="/" className="secondary-button link-button">
                    <ArrowLeft size={18} />
                    Back to Dashboard
                </Link>

                <section className="panel">
                    <div className="empty-state">
                        <h3>Unable to edit request</h3>
                        <p>{errorMessage}</p>
                    </div>
                </section>
            </div>
        );
    }

    if (!request || !requestForm) {
        return (
            <section className="panel">
                <div className="empty-state">Request not found.</div>
            </section>
        );
    }

    if (!canEdit) {
        return (
            <div className="page-stack">
                <Link to={`/requests/${request.id}`} className="secondary-button link-button">
                    <ArrowLeft size={18} />
                    Back to Request
                </Link>

                <section className="panel">
                    <div className="empty-state">
                        <h3>This request cannot be edited</h3>
                        <p>
                            Only the originator can edit requests that are Draft, Recalled, or
                            More Info Requested.
                        </p>
                        <RequestStatusBadge status={request.status} />
                    </div>
                </section>
            </div>
        );
    }

    return (
        <form className="page-stack" onSubmit={handleSubmit}>
            <div className="page-title-row">
                <div>
                    <Link to={`/requests/${request.id}`} className="secondary-button link-button">
                        <ArrowLeft size={18} />
                        Back to Request
                    </Link>

                    <div style={{ marginTop: 16 }}>
                        <h2>Edit Parts Approval Request</h2>
                        <p>
                            {request.request_number} ·{" "}
                            <RequestStatusBadge status={request.status} />
                        </p>
                    </div>
                </div>

                <div className="button-row">
                    <button
                        className="secondary-button"
                        type="button"
                        onClick={handleSaveChanges}
                        disabled={saving || submitting}
                    >
                        <Save size={18} />
                        {saving ? "Saving..." : "Save Changes"}
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
                    <span>Edit request details before resubmission</span>
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
                        />
                    </label>
                </div>
            </section>

            <section className="panel">
                <div className="panel-header">
                    <h2>Quote Comparison</h2>
                    <span>Update quotes and selected vendor</span>
                </div>

                <div className="quote-form-grid">
                    {quotes.map((quote) => (
                        <article
                            key={quote.id}
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