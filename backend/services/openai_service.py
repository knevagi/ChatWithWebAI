import openai
openai.api_key = "YOUR_API_KEY"

def ask_openai(page_text, question):
    prompt = f"Webpage: {page_text}\n\nQuestion: {question}"
    response = openai.ChatCompletion.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": prompt}
        ]
    )
    return response["choices"][0]["message"]["content"]