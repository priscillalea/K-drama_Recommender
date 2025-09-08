# K-drama_Recommender
K-drama recommendations based on similarity between a user-selected title and other titles. Similarity is computed from the combined **Genres** and **Styles** text using TF-IDF vectorization and cosine similarity (scikit-learn). The frontend renders results as cards with genre tags and “platform” (e.g., Netflix, Viki), all driven by a CSV dataset.
