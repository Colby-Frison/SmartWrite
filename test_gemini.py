from chat_handler import GeminiChat

def test():
    try:
        chat = GeminiChat()
        response = chat.generate_response("Hello, what is AI?")
        print(f"Test response: {response}")
        return True
    except Exception as e:
        print(f"Test failed: {e}")
        return False

if __name__ == "__main__":
    success = test()
    print(f"Test {'succeeded' if success else 'failed'}") 