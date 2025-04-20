import sys
import os
import json
from sentence_transformers import SentenceTransformer, util

# Get the folder path from the command-line arguments
folder_path = sys.argv[1]

# Load the model
model = SentenceTransformer('all-MiniLM-L6-v2')

# Read and store all valid text documents
documents = {}
for filename in os.listdir(folder_path):
    full_path = os.path.join(folder_path, filename)
    if os.path.isfile(full_path):  # ✅ no longer checking file extension
        try:
            with open(full_path, "r", encoding="utf-8") as f:
                documents[filename] = f.read()
        except Exception as e:
            print(f"Error reading {filename}: {e}", file=sys.stderr)

# Prepare texts and names
doc_names = list(documents.keys())
doc_texts = list(documents.values())

# If fewer than 2 valid documents, return empty list
if len(doc_texts) < 2:
    print(json.dumps([]))
    sys.exit()

# Generate embeddings and compute cosine similarity
embeddings = model.encode(doc_texts, convert_to_tensor=True)
similarity_matrix = util.pytorch_cos_sim(embeddings, embeddings)

# Collect similarity results
results = []
for i, name1 in enumerate(doc_names):
    for j, name2 in enumerate(doc_names):
        if i < j:
            similarity = similarity_matrix[i][j].item()
            results.append({
                "doc1": name1,
                "doc2": name2,
                "similarity": round(similarity, 4)
            })

# Output as JSON
print(json.dumps(results))