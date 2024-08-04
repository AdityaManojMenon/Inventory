from flask import Flask, request, jsonify
import openai
from flask_cors import CORS
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Set your OpenAI API key here
api_key = os.getenv('OPENAI_API_KEY')
print(f"Loaded OpenAI API key: {api_key}")
openai.api_key = api_key

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})  # Allow all origins; modify as needed

@app.route('/generate-recipe', methods=['POST'])
def generate_recipe():
    data = request.json
    print(f"Request data: {data}")
    ingredients = data.get('ingredients', [])
    
    if not ingredients:
        print("No ingredients provided")
        return jsonify({'error': 'No ingredients provided'}), 400

    # Generate a prompt for the recipe
    prompt = (
        f"Create a recipe using the following ingredients: {', '.join(ingredients)}. "
        f"Format the recipe in HTML with a bold title for the recipe, a list of ingredients, and the procedure."
    )
    print(f"Prompt: {prompt}")

    try:
        # Call OpenAI API using the new method
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=500,  # Increase max_tokens to get the complete recipe
            temperature=0.7
        )
        recipe = response.choices[0].message['content'].strip()
        print(f"Recipe: {recipe}")
        return jsonify({'recipe': recipe})
    except Exception as e:
        print(f"Error generating recipe: {e}")  # Debug log
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    import sys
    print(f"Python executable: {sys.executable}")
    app.run(host='0.0.0.0', port=5005)
