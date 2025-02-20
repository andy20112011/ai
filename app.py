# -*- coding: utf-8 -*-
from flask import Flask, render_template, request, jsonify
import tiktoken

app = Flask(__name__)

# Initialize the cl100k_base encoding
enc = tiktoken.get_encoding("o200k_base")

def compute_boundaries(text, tokens):
    boundaries = []
    pos = 0
    for token in tokens:
        token_str = enc.decode([token])
        # Check if the substring in the text matches the token_str
        if text[pos:pos+len(token_str)] != token_str:
            # If not, try removing a leading space (which often appears in tokenization)
            token_str_stripped = token_str.lstrip()
            if text[pos:pos+len(token_str_stripped)] == token_str_stripped:
                token_str = token_str_stripped
        start = pos
        end = pos + len(token_str)
        boundaries.append({"start": start, "end": end})
        pos = end
    return boundaries



@app.route("/")
def index():
    return render_template("index.html")

@app.route("/tokenize", methods=["POST"])
def tokenize():
    data = request.get_json()
    text = data.get("text", "")
    tokens = enc.encode(text)
    token_strings = [enc.decode([t]) for t in tokens]
    boundaries = compute_boundaries(text, tokens)
    return jsonify({
        "token_count": len(tokens),
        "tokens": token_strings,
        "token_ids": tokens,
        "boundaries": boundaries
    })


if __name__ == "__main__":
    app.run(debug=True)

