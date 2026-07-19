export async function callOllama(prompt: string, model = 'qwen3.6:27b-gpu-128k'): Promise<string> {
  const res = await fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, prompt, stream: false }),
  });
  const data = await res.json();
  return data.response;
}

export async function callOllamaChat(messages: Array<{role: string, content: string}>, model = 'qwen3.6:27b-gpu-128k'): Promise<string> {
  const res = await fetch('http://localhost:11434/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages, stream: false }),
  });
  const data = await res.json();
  return data.message.content;
}
