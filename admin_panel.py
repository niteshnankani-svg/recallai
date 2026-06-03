import os
import gradio as gr
import chromadb
from services.call_registry import set_user_name, get_all_user_names


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


with gr.Blocks(theme=gr.themes.Soft(), title="RecallAI Admin") as demo:
    gr.Markdown("# RecallAI — Admin Panel\n**Voice AI Wellness Companion**")

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
        status_output = gr.Textbox(label="Environment Keys", interactive=False, lines=6)
        status_btn.click(fn=check_status, inputs=None, outputs=status_output)
