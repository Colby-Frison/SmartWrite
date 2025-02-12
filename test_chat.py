from chat_handler import GeminiChat

def test_chat():
    chat = GeminiChat()
    response = chat.generate_response("Test message: What is AI?")
    print(f"Response: {response}")

if __name__ == "__main__":
    test_chat() 