import os
import sys
import json
import traceback
import google.generativeai as genai
from dotenv import load_dotenv

def log(message):
    """Write log message to stderr with flush"""
    print(f"PYTHON LOG: {message}", file=sys.stderr, flush=True)

class GeminiChat:
    def __init__(self):
        log("Initializing GeminiChat")
        load_dotenv()
        
        api_key = os.getenv('GEMINI_API_KEY')
        if not api_key:
            raise ValueError("GEMINI_API_KEY not found in environment")
            
        log(f"API key found (starts with: {api_key[:5]}...)")
        
        try:
            genai.configure(api_key=api_key)
            self.model = genai.GenerativeModel('gemini-1.5-flash')
            log("Gemini API configured successfully")
        except Exception as e:
            log(f"Failed to configure Gemini API: {str(e)}")
            raise

    def generate_response(self, message):
        try:
            log(f"Generating response for message: {message}")
            
            response = self.model.generate_content(message)
            log(f"Raw response from API: {response}")
            
            if not response or not hasattr(response, 'text'):
                raise ValueError("Invalid response from API")
            
            response_text = response.text.strip()
            log(f"Processed response: {response_text}")
            
            if not response_text:
                raise ValueError("Empty response from API")
                
            return response_text
            
        except Exception as e:
            log(f"Error in generate_response: {str(e)}")
            log(f"Traceback: {traceback.format_exc()}")
            raise

def main():
    log("Starting chat handler")
    try:
        # Read and validate input
        input_data = sys.stdin.read()
        log(f"Received raw input: {input_data}")
        
        if not input_data:
            raise ValueError("No input received")
            
        # Parse JSON
        try:
            data = json.loads(input_data)
        except json.JSONDecodeError as e:
            raise ValueError(f"Invalid JSON input: {str(e)}")
            
        # Get message
        message = data.get('message')
        if not message:
            raise ValueError("No message found in input")
            
        log(f"Processing message: {message}")
        
        # Generate response
        chat = GeminiChat()
        response = chat.generate_response(message)
        
        # Send response
        result = {
            'success': True,
            'response': response
        }
        
        log(f"Sending response: {result}")
        json_response = json.dumps(result)
        print(json_response, flush=True)
        log("Response sent successfully")
        
    except Exception as e:
        log(f"Error in main: {str(e)}")
        log(f"Traceback: {traceback.format_exc()}")
        
        error_response = {
            'success': False,
            'error': str(e)
        }
        
        print(json.dumps(error_response), flush=True)

if __name__ == "__main__":
    main() 