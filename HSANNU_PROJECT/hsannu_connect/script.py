# react_string_extractor.py
import os
import re
import json
import argparse
from collections import OrderedDict

def extract_strings_from_project(project_path):
    """
    Scans a React project directory to extract user-facing strings for translation.

    This function walks through the specified directory, reads files with
    .js, .jsx, .ts, and .tsx extensions, and uses regular expressions
    to find and extract strings that are likely to be displayed to the user.

    It specifically looks for:
    1. Text content between JSX tags (e.g., <div>Hello World</div>).
    2. Strings assigned to common translatable attributes like placeholder,
       alt, title, and aria-label.

    All unique, non-empty strings are collected and saved to a JSON file.

    Args:
        project_path (str): The absolute or relative path to the React project directory.

    Returns:
        None. The output is written to 'extracted_strings.json'.
    """
    print(f"🔍 Starting to scan project at: {project_path}")

    # A set is used to automatically handle duplicate strings.
    unique_strings = set()

    # Define the file extensions to scan.
    target_extensions = ('.js', '.jsx', '.ts', '.tsx')

    # --- Regular Expressions to find strings ---

    # Regex 1: Finds text between JSX tags.
    # Example: >Hello World<
    # It ignores content with curly braces to avoid capturing variables.
    jsx_text_regex = re.compile(r'>([^<>{}`]+?)<')

    # Regex 2: Finds strings in common translatable attributes.
    # Example: placeholder="Enter your name" or alt={'An image'}
    # This handles double quotes, single quotes, and template literals in props.
    attribute_regex = re.compile(
        r'(?:placeholder|alt|title|aria-label|label)\s*=\s*(?:["\']([^"\']+)["\']|\{[`\']([^`\']+)[\'`]\}|\{"([^"]+)"\})'
    )

    # Walk through every file and directory in the project path.
    for root, _, files in os.walk(project_path):
        # Ignore node_modules directory for efficiency.
        if 'node_modules' in root:
            continue

        for file in files:
            if file.endswith(target_extensions):
                file_path = os.path.join(root, file)
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()

                        # Find all matches for both regex patterns in the file content.
                        jsx_text_matches = jsx_text_regex.findall(content)
                        attribute_matches = attribute_regex.findall(content)

                        # Process matches from JSX text content.
                        for match in jsx_text_matches:
                            # Clean up the string by removing leading/trailing whitespace.
                            cleaned_string = match.strip()
                            if cleaned_string:  # Ensure the string is not empty.
                                unique_strings.add(cleaned_string)

                        # Process matches from attributes. The result is a tuple
                        # because of the multiple groups in the regex, so we merge them.
                        for match_tuple in attribute_matches:
                            # The tuple will have empty strings for non-matching groups,
                            # so we find the one that actually captured the text.
                            actual_match = next((s for s in match_tuple if s), None)
                            if actual_match:
                                cleaned_string = actual_match.strip()
                                if cleaned_string:
                                    unique_strings.add(cleaned_string)

                except Exception as e:
                    print(f"Could not read file {file_path}: {e}")

    print(f"\n✅ Scan complete. Found {len(unique_strings)} unique strings.")

    # --- Prepare and save the output ---

    # Create an ordered dictionary for the JSON file.
    # The key is the original string, and the value is where the translation will go.
    translation_template = OrderedDict()
    for s in sorted(list(unique_strings)): # Sort for consistent output
        translation_template[s] = ""

    # Define the output file name.
    output_filename = 'extracted_strings.json'

    # Write the dictionary to a JSON file.
    try:
        with open(output_filename, 'w', encoding='utf-8') as f:
            # `ensure_ascii=False` preserves special characters.
            # `indent=2` makes the file human-readable.
            json.dump(translation_template, f, ensure_ascii=False, indent=2)
        print(f"Successfully saved strings to '{output_filename}'")
    except Exception as e:
        print(f"Error writing to JSON file: {e}")


if __name__ == '__main__':
    # --- Command-Line Argument Parser ---
    # This allows you to run the script with the project path as an argument.
    parser = argparse.ArgumentParser(
        description="Extract user-facing strings from a React project for translation."
    )
    parser.add_argument(
        'project_path',
        type=str,
        help="The path to the root directory of your React project."
    )

    args = parser.parse_args()

    # Check if the provided path is a valid directory.
    if not os.path.isdir(args.project_path):
        print(f"Error: The path '{args.project_path}' is not a valid directory.")
    else:
        extract_strings_from_project(args.project_path)
