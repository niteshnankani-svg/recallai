"""
Read-only instrumentation of the Anthropic client inside services/agent_service.

Why: `get_ai_response_streaming` yields text only, so from outside it is
impossible to know whether a reply was cut off by max_tokens=120 or ended
naturally. That distinction is the whole point of Layer A's truncation check.

This wraps the module-level client in a recording proxy. It changes no agent
behaviour — same model, same kwargs, same stream — it only captures
stop_reason and usage on the way past. Every number derived from it is tagged
`instrumented` in the report.
"""

from dataclasses import dataclass, field


@dataclass
class CallRecord:
    model: str = ""
    max_tokens: int = 0
    temperature: float = 0.0
    stop_reason: str | None = None
    input_tokens: int = 0
    output_tokens: int = 0
    system_blocks: int = 0
    n_messages: int = 0
    system_text: str = ""
    error: str | None = None


@dataclass
class Sink:
    records: list[CallRecord] = field(default_factory=list)

    def last(self) -> CallRecord | None:
        return self.records[-1] if self.records else None

    def clear(self) -> None:
        self.records.clear()


class _RecordingStream:
    def __init__(self, cm, record: CallRecord):
        self._cm = cm
        self._record = record
        self._stream = None

    async def __aenter__(self):
        self._stream = await self._cm.__aenter__()
        return self._stream

    async def __aexit__(self, *exc):
        try:
            msg = await self._stream.get_final_message()
            self._record.stop_reason = getattr(msg, "stop_reason", None)
            usage = getattr(msg, "usage", None)
            if usage is not None:
                self._record.input_tokens = getattr(usage, "input_tokens", 0) or 0
                self._record.output_tokens = getattr(usage, "output_tokens", 0) or 0
        except Exception as e:                      # never mask the real error
            self._record.error = f"{type(e).__name__}: {e}"
        return await self._cm.__aexit__(*exc)


class _MessagesProxy:
    def __init__(self, real, sink: Sink):
        self._real = real
        self._sink = sink

    def __getattr__(self, name):
        return getattr(self._real, name)

    def stream(self, **kwargs):
        system = kwargs.get("system") or []
        rec = CallRecord(
            model=kwargs.get("model", ""),
            max_tokens=kwargs.get("max_tokens", 0),
            temperature=kwargs.get("temperature", 0.0),
            system_blocks=len(system) if isinstance(system, list) else 1,
            n_messages=len(kwargs.get("messages") or []),
            system_text="\n".join(
                b.get("text", "") for b in system if isinstance(b, dict)
            ) if isinstance(system, list) else str(system),
        )
        self._sink.records.append(rec)
        return _RecordingStream(self._real.stream(**kwargs), rec)


class _ClientProxy:
    def __init__(self, real, sink: Sink):
        self._real = real
        self._messages = _MessagesProxy(real.messages, sink)

    def __getattr__(self, name):
        return getattr(self._real, name)

    @property
    def messages(self):
        return self._messages


def attach(agent_service_module, sink: Sink):
    """Swap in the recording proxy. Returns a restore() callable."""
    original = agent_service_module._client
    agent_service_module._client = _ClientProxy(original, sink)

    def restore():
        agent_service_module._client = original

    return restore
