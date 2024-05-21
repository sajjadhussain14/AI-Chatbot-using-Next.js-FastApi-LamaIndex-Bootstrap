# services.py
from fastapi import HTTPException
from datetime import datetime
from urllib.parse import urlparse
from bs4 import BeautifulSoup
import os
import requests
from fake_useragent import UserAgent
from datetime import datetime
from src.save_content.models import TextInput

def save_url_content(url: str):
    try:
        headers = {'User-Agent': UserAgent().random}  # Generate a random user agent
        response = requests.get(url, headers=headers)
        response.raise_for_status()  # Raise an HTTPError for non-200 status codes
        soup = BeautifulSoup(response.text, 'html.parser')
        # Check if soup.body is not None before calling .get_text()
        if soup.body is not None:
            body_content = soup.body.get_text(separator='\n')
            # Save body_content to a text file or do other processing
        else:
            print("No <body> tag found in the HTML content.")
        # Extract words from the URL to construct the filename
        parsed_url = urlparse(url)
        words_in_path = parsed_url.path.split('/')
        filename = '_'.join(words_in_path)
        if not filename:
            filename = "url_content.txt"
        else:
            filename = filename[:100]  # Limit the filename length to avoid too long filenames
            filename = "fromURL_" + filename

            # Ensure file has .txt extension
            if not filename.endswith('.txt'):
                filename += '.txt'
        # Add current date and time to filename before extension
        current_datetime = datetime.now().strftime("%Y%m%d-%H%M%S")
        file_name_with_datetime = os.path.splitext(filename)[0] + "-" + current_datetime + ".txt"
        # Save content to file
        directory_path = "data"  # Define the directory path for saving files
        file_path = os.path.join(directory_path, file_name_with_datetime)
        with open(file_path, "w", encoding="utf-8") as file:
            file.write(body_content)
        return {"message": f"URL content inside <body> tag saved as '{file_name_with_datetime}'"}
    except requests.HTTPError as http_err:
        if response.status_code == 403:
            raise HTTPException(status_code=403, detail=f"Access to URL '{url}' is forbidden.")
        else:
            raise HTTPException(status_code=response.status_code, detail=f"Failed to fetch URL '{url}'.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save URL content: {str(e)}")


def save_text_as_file(text_input: TextInput):
    try:
        text = text_input.text.strip()
        if not text:
            raise HTTPException(status_code=400, detail="Text is empty")

        filename = generate_filename_from_text(text)
        directory_path = "data"  # Define the directory path for saving files
        file_path = os.path.join(directory_path, filename)

        with open(file_path, "w", encoding="utf-8") as file:
            file.write(text)

        return {"message": f"Text saved as '{filename}'"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save text as file: {str(e)}")

def generate_filename_from_text(text: str) -> str:
    """Generate a filename based on text content."""
    words_from_text = extract_words(text)
    if len(words_from_text) > 10:
        relevant_words = "_".join(words_from_text[:5])
    else:
        relevant_words = "_".join(words_from_text)

    current_datetime = datetime.now().strftime("%Y%m%d-%H%M%S")
    return f"fromTEXT_{relevant_words}_{current_datetime}.txt"

def extract_words(text: str) -> list:
    """Extract relevant words from text."""
    common_words = ["a", "an", "the", "is", "are"]  # Add more if necessary
    return [word for word in text.split() if word.lower() not in common_words]    
