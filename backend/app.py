from flask import Flask, jsonify
from flask_cors import CORS
import networkx as nx
import random

app = Flask(__name__)
CORS(app)
def generate_city():
    city = nx.Graph()
    for i in range(10):
        for j in range(10):
            # Convert grid positions to lat/lng (simple scaling example)
            lat = 37.7749 + i * 0.01  # Adjust as per your required scaling
            lng = -122.4194 + j * 0.01  # Adjust as per your required scaling
            city.add_node((lat, lng), type=random.choice(['residential', 'commercial', 'industrial', 'public']))
            
            # Adding edges (for city connections)
            if i > 0:
                city.add_edge((lat - 0.01, lng), (lat, lng))
            if j > 0:
                city.add_edge((lat, lng - 0.01), (lat, lng))
    return city

@app.route('/generate_city', methods=['GET'])
def get_city():
    city = generate_city()
    city_data = nx.node_link_data(city)
    return jsonify(city_data)

if __name__ == '__main__':
    app.run(debug=True)
