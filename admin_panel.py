import gradio as gr
from services.call_registry import set_user_name, get_all_user_names
from services.analytics import get_recent_calls, get_emotion_distribution, get_stats
from services.telephony import trigger_outbound_call
from services.system_status import get_env_status
from memory.browser import list_all_memories


def trigger_call(phone_number: str) -> str:
    result = trigger_outbound_call(phone_number)
    if result["ok"]:
        return f"Call initiated! SID: {result['sid']}"
    return f"Error: {result['error']}"


def refresh_memories():
    rows = list_all_memories()
    if not rows:
        return [["—", "—", "No memories stored yet."]]
    return [[r["date"], r["user"], r["fact"]] for r in rows]


def check_status():
    lines = []
    for key, ok in get_env_status().items():
        status = "✅" if ok else "❌"
        lines.append(f"{status}  {key}")
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
