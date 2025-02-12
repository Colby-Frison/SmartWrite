from chat_handler import GeminiChat

def test_api():
    try:
        # Initialize chat
        chat = GeminiChat()
        print("Chat initialized successfully")
        
        # Test message
        test_message = "What is artificial intelligence?"
        print(f"\nSending test message: {test_message}")
        
        # Get response
        response = chat.generate_response(test_message)
        print("\nReceived response:")
        print(response)
        
        return True
    except Exception as e:
        print(f"Error testing API: {e}")
        return False

if __name__ == "__main__":
    success = test_api()
    print(f"\nTest {'successful' if success else 'failed'}") 