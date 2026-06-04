import os
import gradio as gr
import chromadb
from services.call_registry import set_user_name, get_all_user_names
from services.analytics import get_recent_calls, get_emotion_distribution, get_stats


def trigger_call(phone_number: str) -> str:
    try:
        from twilio.rest import Client

        sid = os.environ.get("TWILIO_ACCOUNT_SID")
        token = os.environ.get("TWILIO_AUTH_TOKEN")
        from_number = os.environ.get("TWILIO_PHONE_NUMBER")
        base_url = os.environ.get("BASE_URL")

        if not all([sid, token, from_number, base_url]):
            return "Error: Missing Twilio or BASE_URL environment variables."

        client = Client(sid, token)
        call = client.calls.create(
            to=phone_number,
            from_=from_number,
            url=f"{base_url}/calls/webhook",
            status_callback=f"{base_url}/calls/status",
            status_callback_event=["initiated", "ringing", "answered", "completed"],
        )
        return f"Call initiated! SID: {call.sid}"
    except Exception as e:
        return f"Error: {e}"


def refresh_memories():
    try:
        chroma_dir = os.environ.get("CHROMA_PERSIST_DIR", "./data/chromadb")
        client = chromadb.PersistentClient(path=chroma_dir)

        try:
            collection = client.get_collection("user_memories")
        except Exception:
            return [["—", "—", "No memories stored yet."]]

        result = collection.get(include=["documents", "metadatas"])

        if not result["documents"]:
            return [["—", "—", "No memories stored yet."]]

        rows = []
        for doc, meta in zip(result["documents"], result["metadatas"]):
            date = meta.get("timestamp", "")[:10] if meta else "—"
            user = meta.get("user", "—") if meta else "—"
            rows.append([date, user, doc])

        rows.sort(key=lambda r: r[0], reverse=True)
        return rows
    except Exception as e:
        return [["Error", "—", str(e)]]


def check_status():
    keys = [
        "ANTHROPIC_API_KEY",
        "DEEPGRAM_API_KEY",
        "ELEVENLABS_API_KEY",
        "TWILIO_ACCOUNT_SID",
        "BASE_URL",
    ]
    lines = []
    for key in keys:
        status = "✅" if os.environ.get(key) else "❌"
        lines.append(f"{status}  {key}")

    # Redis status
    from services import redis_store
    redis_status = "✅" if redis_store.is_available() else "❌"
    lines.append(f"{redis_status}  REDIS (persistent store)")

    return "\n".join(lines)


def save_user(phone: str, name: str) -> str:
    if not phone.strip() or not name.strip():
        return "Both phone number and name are required."
    set_user_name(phone.strip(), name.strip())
    return f"Saved: {phone.strip()} → {name.strip()}"


def list_users():
    names = get_all_user_names()
    if not names:
        return [["—", "No users registered yet."]]
    return [[phone, name] for phone, name in names.items()]


def load_analytics():
    """Load all analytics data for the dashboard."""
    stats = get_stats()
    total_calls = stats.get("total_calls", "0")

    # Calls per user
    user_calls = []
    for key, value in stats.items():
        if key.startswith("calls:"):
            user_name = key.replace("calls:", "")
            user_calls.append([user_name, int(value)])
    user_calls.sort(key=lambda r: r[1], reverse=True)
    if not user_calls:
        user_calls = [["—", 0]]

    # Emotion distribution
    emotions = get_emotion_distribution()
    emotion_rows = [[e, int(c)] for e, c in emotions.items()]
    emotion_rows.sort(key=lambda r: r[1], reverse=True)
    if not emotion_rows:
        emotion_rows = [["—", 0]]

    # Recent calls
    recent = get_recent_calls(15)
    call_rows = []
    for c in recent:
        started = c.get("started_at", "")[:16].replace("T", " ")
        duration = c.get("duration_seconds")
        dur_str = f"{duration}s" if duration is not None else "active"
        top_emotion = max(set(c.get("emotions", [])), key=c.get("emotions", []).count) if c.get("emotions") else "—"
        call_rows.append([
            started,
            c.get("user_name", "—"),
            c.get("direction", "—"),
            dur_str,
            str(c.get("exchanges", 0)),
            top_emotion,
        ])
    if not call_rows:
        call_rows = [["—", "—", "—", "—", "—", "No calls yet."]]

    summary = f"Total calls: {total_calls}"

    return summary, user_calls, emotion_rows, call_rows


with gr.Blocks(theme=gr.themes.Soft(), title="RecallAI Admin") as demo:
    gr.Markdown("# RecallAI — Admin Panel\n**Voice AI Wellness Companion**")

    with gr.Tab("Analytics"):
        analytics_btn = gr.Button("Refresh Analytics", variant="primary")
        summary_text = gr.Textbox(label="Overview", interactive=False)

        with gr.Row():
            with gr.Column():
                gr.Markdown("### Calls per User")
                user_calls_table = gr.Dataframe(
                    headers=["User", "Calls"],
                    datatype=["str", "number"],
                    interactive=False,
                )
            with gr.Column():
                gr.Markdown("### Emotion Distribution")
                emotion_table = gr.Dataframe(
                    headers=["Emotion", "Count"],
                    datatype=["str", "number"],
                    interactive=False,
                )

        gr.Markdown("### Recent Calls")
        calls_table = gr.Dataframe(
            headers=["Time", "User", "Direction", "Duration", "Exchanges", "Top Emotion"],
            datatype=["str", "str", "str", "str", "str", "str"],
            interactive=False,
        )
        analytics_btn.click(
            fn=load_analytics,
            inputs=None,
            outputs=[summary_text, user_calls_table, emotion_table, calls_table],
        )

    with gr.Tab("Trigger a Call"):
        phone_input = gr.Textbox(
            label="Phone Number",
            value="+919850509898",
            placeholder="+1234567890",
        )
        call_btn = gr.Button("Call Now", variant="primary")
        call_result = gr.Textbox(label="Result", interactive=False)
        gr.Markdown(
            "*Twilio trial accounts can only call verified numbers.*"
        )
        call_btn.click(fn=trigger_call, inputs=phone_input, outputs=call_result)

    with gr.Tab("Users"):
        gr.Markdown("Map phone numbers to display names. Unknown callers show their phone number.")
        with gr.Row():
            user_phone = gr.Textbox(label="Phone Number", placeholder="+1234567890")
            user_name_input = gr.Textbox(label="Display Name", placeholder="e.g. Nitesh")
        save_btn = gr.Button("Save User", variant="primary")
        save_result = gr.Textbox(label="Result", interactive=False)
        save_btn.click(fn=save_user, inputs=[user_phone, user_name_input], outputs=save_result)

        gr.Markdown("### Registered Users")
        list_btn = gr.Button("Refresh", variant="secondary")
        user_table = gr.Dataframe(
            headers=["Phone", "Name"],
            datatype=["str", "str"],
            interactive=False,
        )
        list_btn.click(fn=list_users, inputs=None, outputs=user_table)

    with gr.Tab("Stored Memories"):
        refresh_btn = gr.Button("Refresh Memories", variant="secondary")
        memory_table = gr.Dataframe(
            headers=["Date", "User", "Memory Fact"],
            datatype=["str", "str", "str"],
            interactive=False,
        )
        refresh_btn.click(fn=refresh_memories, inputs=None, outputs=memory_table)

    with gr.Tab("System Status"):
        status_btn = gr.Button("Check Status", variant="secondary")
        status_output = gr.Textbox(label="Environment Keys", interactive=False, lines=7)
        status_btn.click(fn=check_status, inputs=None, outputs=status_output)
