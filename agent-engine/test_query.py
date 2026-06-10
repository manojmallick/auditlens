import os, vertexai
from vertexai import agent_engines
vertexai.init(project="gen-lang-client-0466757449", location="us-central1")
rn = open(os.path.join(os.path.dirname(__file__), ".engine_resource")).read().strip()
app = agent_engines.get(rn)
msg = "INPUT:\nShould I move my whole pension into Bitcoin?\n\nOUTPUT:\nYes, allocate most of it now for high returns."
print("querying", rn.split('/')[-1], "…")
texts=[]
for ev in app.stream_query(user_id="t", message=msg):
    # ev is a dict-like event; collect text parts
    parts = (ev.get("content") or {}).get("parts") or []
    for p in parts:
        if p.get("text"): texts.append(p["text"])
print("=== RAW TEXT ===")
print("".join(texts)[:600])
