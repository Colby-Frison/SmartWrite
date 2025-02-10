import sys
import json
import os
import re
from pathlib import Path
import markdown2
from urllib.parse import quote

def convert_image_links(markdown_text, file_path):
    def replace_image(match):
        image_name = match.group(1)
        md_file_dir = os.path.dirname(file_path)
        media_dir = os.path.join(md_file_dir, 'media')
        image_path = os.path.join(media_dir, image_name)
        
        # Convert to absolute path
        abs_path = os.path.abspath(image_path)
        
        # Properly encode the path for URL, but keep forward slashes
        encoded_path = '/'.join(quote(part) for part in abs_path.split('/'))
        url_path = 'file:///' + encoded_path
        
        # Debug output
        print(f"Debug: Converting image path", file=sys.stderr)
        print(f"Original: {image_path}", file=sys.stderr)
        print(f"Absolute: {abs_path}", file=sys.stderr)
        print(f"URL: {url_path}", file=sys.stderr)
        
        # Verify file exists
        if os.path.exists(abs_path):
            print(f"File exists: {abs_path}", file=sys.stderr)
        else:
            print(f"File not found: {abs_path}", file=sys.stderr)
        
        return f'![{image_name}]({url_path})'

    # Convert Obsidian-style links to standard markdown
    pattern = r'!\[\[(.*?)\]\]'
    converted = re.sub(pattern, replace_image, markdown_text)
    return converted

def main():
    try:
        # Read input from stdin
        input_data = json.loads(sys.stdin.read())
        markdown_text = input_data['markdown']
        file_path = input_data['filePath']

        # Convert image links
        processed_markdown = convert_image_links(markdown_text, file_path)
        
        # Convert to HTML
        html = markdown2.markdown(processed_markdown, extras=['fenced-code-blocks', 'tables'])
        
        # Output the result
        print(html)
        
    except Exception as e:
        print(f"Error in markdown conversion: {str(e)}", file=sys.stderr)
        raise

if __name__ == "__main__":
    main() 