from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

app = Flask(__name__)
CORS(app)

# Load CSV data
df = pd.read_csv("kdramas.csv")

# Ensures that the Platform column exists (avoids KeyError if missing from CSV)
if 'Platform' not in df.columns:
    df['Platform'] = ''

# Vectorisation by genre + style (maintains its logic)
df['features'] = df['Genres'].fillna('') + ", " + df['Styles'].fillna('')
vectorizer = TfidfVectorizer()
genre_vectors = vectorizer.fit_transform(df['features'])

@app.route("/recommend")
def recommend():
    title = request.args.get("title", "").strip().lower()
    if not title:
        return jsonify({"error": "Títle not found"}), 400

    titles_lower = df['Title'].str.lower().values
    if title not in titles_lower:
        return jsonify({"error": "Title not found"}), 404

    # extra parameters
    limit = int(request.args.get("limit", 6))
    platform_qs = request.args.get("platform", "").strip().lower()  # ex: "netflix,viki"
    only_platform = request.args.get("only_platform", "0") == "1"

    # entry title index
    idx = df[df['Title'].str.lower() == title].index[0]

    # similarity
    cosine_sim = cosine_similarity(genre_vectors[idx], genre_vectors).flatten()
    ranked = cosine_sim.argsort()[::-1]
    ranked = [i for i in ranked if i != idx]  # removes itself

    # filter per platform (optional)
    def matches_platform(value: str, filters: list[str]) -> bool:
        if not isinstance(value, str):
            return False
        v = value.lower()
        return any(f in v for f in filters)

    selected_indices = []
    if platform_qs:
        wanted = [p.strip() for p in platform_qs.split(",") if p.strip()]
        # first, items that match the platform(s)
        filtered = [i for i in ranked if matches_platform(df.iloc[i]['Platform'], wanted)]
        if only_platform:
            selected_indices = filtered[:limit]
        else:
            # prioritise those on the platform and complete with the rest
            remainder = [i for i in ranked if i not in filtered]
            selected_indices = (filtered + remainder)[:limit]
    else:
        selected_indices = ranked[:limit]

    # Build the answer
    recommendations = []
    for i in selected_indices:
        recommendations.append({
            "title": df.iloc[i]['Title'],
            "genres": df.iloc[i]['Genres'],
            "styles": df.iloc[i]['Styles'],
            "platform": df.iloc[i]['Platform'],
            "description": df.iloc[i]['Description'],
            "similarity": round(cosine_sim[i] * 100, 2)
        })
    # Return the full JSON response consumed by the frontend
    return jsonify({
        "input": df.iloc[idx]['Title'],
        "input_platform": df.iloc[idx]['Platform'],
        "input_description": df.iloc[idx]['Description'],
        "recommendations": recommendations
    })

if __name__ == "__main__":
     # Run Flask's development server with auto-reload and debug pages.
    app.run(debug=True)
