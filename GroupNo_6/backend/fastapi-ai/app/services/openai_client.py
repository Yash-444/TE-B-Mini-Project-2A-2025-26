import os
import openai
import logging

logger = logging.getLogger(__name__)

openai.api_key = os.getenv("OPENAI_API_KEY")

async def generate_caption(prompt: str) -> str:
    try:
        response = await openai.ChatCompletion.acreate(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are a helpful fashion assistant."},
                {"role": "user", "content": prompt},
            ],
            max_tokens=60,
            temperature=0.7,
        )
        caption = response.choices[0].message.content.strip()
        return caption
    except Exception as e:
        logger.error(f"OpenAI caption generation failed: {e}")
        return "Personalized outfit recommendations curated just for you."