import os
import httpx
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("OPENROUTER_API_KEY")
model = os.getenv("OPENROUTER_MODEL")

print(f"Testing OpenRouter with model: {model}")

response = httpx.post(
    url="https://openrouter.ai/api/v1/chat/completions",
    headers={
        "Authorization": f"Bearer {api_key}",
        "HTTP-Referer": "https://legaldocs-ai.netlify.app",
        "X-Title": "LegalDocs AI Test",
    },
    json={
        "model": model,
        "messages": [
            {"role": "user", "content": "Say hello"}
        ]
    }
)

print(f"Status Code: {response.status_code}")
print(f"Response: {response.text}")
