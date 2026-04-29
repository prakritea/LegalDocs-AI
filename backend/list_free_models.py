import httpx

response = httpx.get("https://openrouter.ai/api/v1/models")
models = response.json()["data"]
free_models = [m["id"] for m in models if m.get("pricing", {}).get("prompt") == "0"]

print("Free Models on OpenRouter:")
for m in sorted(free_models):
    if "gemini" in m.lower():
        print(m)
