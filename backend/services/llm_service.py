import os
import json
from langchain_openai import ChatOpenAI
from backend.config import settings
from typing import Dict, Any

class LLMService:
    def __init__(self, model_type: str = "extraction"):
        api_key = os.getenv("OPENROUTER_API_KEY", getattr(settings, "OPENROUTER_API_KEY", ""))
        base_model = os.getenv("OPENROUTER_MODEL", "minimax/minimax-m3:free")
        
        if model_type == "extraction":
            model_name = os.getenv("OPENROUTER_EXTRACTION_MODEL", base_model)
        elif model_type == "reasoning":
            model_name = os.getenv("OPENROUTER_REASONING_MODEL", base_model)
        else:
            model_name = base_model
            
        self.llm = ChatOpenAI(
            api_key=api_key,
            base_url="https://openrouter.ai/api/v1",
            model=model_name,
            temperature=0,
            model_kwargs={"response_format": {"type": "json_object"}}
        )

    def generate_json_response(self, system_prompt: str, user_prompt: str) -> Dict[str, Any]:
        from langchain_core.messages import SystemMessage, HumanMessage
        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=user_prompt)
        ]
        
        response = self.llm.invoke(messages)
        try:
            return json.loads(response.content)
        except Exception as e:
            # Fallback if json parsing fails
            import re
            json_match = re.search(r'\{.*\}', response.content, re.DOTALL)
            if json_match:
                try:
                    return json.loads(json_match.group(0))
                except:
                    pass
            raise ValueError(f"Failed to parse LLM JSON response: {response.content}")
