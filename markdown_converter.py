import sys
import json
import os
import re
from pathlib import Path
import markdown2
from urllib.parse import quote

def find_root_media_dir(file_path):
    """Find the media directory at the root level with numbered folders"""
    # Start from the file's directory and walk up until we find the media folder
    current_dir = os.path.dirname(file_path)
    
    print(f"\nSearching for media directory starting from: {current_dir}", file=sys.stderr)
    
    while current_dir and current_dir != '/':
        parent_dir = os.path.dirname(current_dir)
        media_dir = os.path.join(parent_dir, 'media')
        
        print(f"Checking directory: {parent_dir}", file=sys.stderr)
        
        if os.path.exists(parent_dir):
            dir_contents = os.listdir(parent_dir)
            print(f"Contents: {dir_contents}", file=sys.stderr)
            
            has_numbered_folders = any(name.startswith(('000', '100', '200', '300', '400')) for name in dir_contents)
            if has_numbered_folders and 'media' in dir_contents:
                print(f"✓ Found root directory with media folder: {parent_dir}", file=sys.stderr)
                return media_dir
        
        current_dir = parent_dir
    
    print("✗ Could not find media directory in any parent folder", file=sys.stderr)
    return None

def convert_image_links(markdown_text, file_path):
    print(f"\nStarting markdown conversion", file=sys.stderr)
    print(f"Input markdown: {markdown_text}", file=sys.stderr)
    
    def replace_image(match):
        image_name = match.group(1)
        print(f"\nProcessing image: {image_name}", file=sys.stderr)
        
        media_dir = find_root_media_dir(file_path)
        if not media_dir:
            return f'<div style="color: red;">Media directory not found at root level</div>'

        image_path = os.path.join(media_dir, image_name)
        
        print(f"Full image path: {image_path}", file=sys.stderr)
        print(f"File exists: {os.path.exists(image_path)}", file=sys.stderr)
        
        if os.path.exists(image_path):
            abs_path = os.path.abspath(image_path)
            url_path = 'file:///' + quote(abs_path)
            return f'<img src="{url_path}" alt="{image_name}" />'
        else:
            return f'<div style="color: red;">Image not found: {image_name}<br>Looked in: {image_path}</div>'

    # Match Obsidian-style image syntax
    obsidian_pattern = r'!\[\[(.*?)\]\]'
    processed = re.sub(obsidian_pattern, replace_image, markdown_text)
    
    print(f"\nProcessed markdown: {processed}", file=sys.stderr)
    return processed

def main():
    try:
        print("\n=== Starting Markdown Converter ===", file=sys.stderr)
        
        # Read input from stdin
        input_text = sys.stdin.read()
        print(f"\nReceived input: {input_text}", file=sys.stderr)
        
        input_data = json.loads(input_text)
        markdown_text = input_data['markdown']
        file_path = input_data['filePath']

        print(f"\nParsed input:", file=sys.stderr)
        print(f"Markdown text: {markdown_text}", file=sys.stderr)
        print(f"File path: {file_path}", file=sys.stderr)

        # Convert image links
        processed_markdown = convert_image_links(markdown_text, file_path)
        
        # Convert to HTML
        html = markdown2.markdown(
            processed_markdown,
            extras=[
                'fenced-code-blocks',
                'tables',
                'break-on-newline',
                'header-ids'
            ]
        )
        
        print(f"\nFinal HTML output: {html}", file=sys.stderr)
        print(html)  # Output to stdout
        
    except Exception as e:
        print(f"Error in markdown conversion: {str(e)}", file=sys.stderr)
        print(f"Error type: {type(e)}", file=sys.stderr)
        print(f"Error traceback:", file=sys.stderr)
        import traceback
        traceback.print_exc(file=sys.stderr)
        raise

if __name__ == "__main__":
    main() 