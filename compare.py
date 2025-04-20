import sys
import os
import json
from sentence_transformers import SentenceTransformer, util

folder_path = sys.argv[1]
model = SentenceTransformer('all-MiniLM-L6-v2')

documents = {}
for filename in os.listdir(folder_path):
    if filename.endswith(".txt"):
        with open(os.path.join(folder_path, filename), "r", encoding="utf-8") as f:
            documents[filename] = f.read()

doc_names = list(documents.keys())
doc_texts = list(documents.values())
embeddings = model.encode(doc_texts, convert_to_tensor=True)
similarity_matrix = util.pytorch_cos_sim(embeddings, embeddings)

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

print(json.dumps(results))