"""
Concept Dependency Risk Analyzer
Graph-based AI model to predict learning risk based on concept mastery
"""

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, GradientBoostingRegressor
from sklearn.preprocessing import StandardScaler
import joblib
import json
from typing import Dict, List, Tuple

class ConceptRiskPredictor:
    """
    Predicts learning risk: If weak in Topic A → risk in Topic B
    Uses graph-based features and historical performance data
    """
    
    def __init__(self):
        self.risk_model = GradientBoostingRegressor(
            n_estimators=100,
            learning_rate=0.1,
            max_depth=5,
            random_state=42
        )
        self.scaler = StandardScaler()
        self.is_trained = False
        
    def extract_graph_features(self, concept_graph: Dict, source_concept: str, target_concept: str) -> np.ndarray:
        """
        Extract features from knowledge graph for risk prediction
        
        Features:
        1. Dependency weight (direct edge strength)
        2. Path length (shortest path between concepts)
        3. In-degree of target (how many prerequisites it has)
        4. Out-degree of source (how many concepts depend on it)
        5. Dependency type encoding
        6. Historical failure rate
        7. Confidence score
        """
        features = []
        
        # Direct dependency weight
        direct_weight = concept_graph.get('edges', {}).get(
            (source_concept, target_concept), {}
        ).get('weight', 0.0)
        features.append(direct_weight)
        
        # Path length (shortest path)
        path_length = self._shortest_path_length(concept_graph, source_concept, target_concept)
        features.append(path_length if path_length < 10 else 10.0)
        
        # In-degree of target (number of prerequisites)
        target_in_degree = len(concept_graph.get('incoming', {}).get(target_concept, []))
        features.append(target_in_degree)
        
        # Out-degree of source (number of dependents)
        source_out_degree = len(concept_graph.get('outgoing', {}).get(source_concept, []))
        features.append(source_out_degree)
        
        # Dependency type (one-hot encoded)
        dep_type = concept_graph.get('edges', {}).get(
            (source_concept, target_concept), {}
        ).get('type', 'prerequisite')
        type_encoding = {
            'prerequisite': 1.0,
            'strongly_related': 0.8,
            'weakly_related': 0.4,
            'blocks': 0.9
        }
        features.append(type_encoding.get(dep_type, 0.5))
        
        # Historical failure rate
        historical_rate = concept_graph.get('edges', {}).get(
            (source_concept, target_concept), {}
        ).get('historical_failure_rate', 0.5)
        features.append(historical_rate)
        
        # Confidence score
        confidence = concept_graph.get('edges', {}).get(
            (source_concept, target_concept), {}
        ).get('confidence', 0.5)
        features.append(confidence)
        
        return np.array(features)
    
    def _shortest_path_length(self, graph: Dict, source: str, target: str) -> float:
        """BFS to find shortest path length between concepts"""
        if source == target:
            return 0.0
        
        queue = [(source, 0)]
        visited = {source}
        
        while queue:
            current, distance = queue.pop(0)
            
            for neighbor in graph.get('outgoing', {}).get(current, []):
                if neighbor == target:
                    return float(distance + 1)
                
                if neighbor not in visited:
                    visited.add(neighbor)
                    queue.append((neighbor, distance + 1))
        
        return 10.0  # No path found (max distance)
    
    def predict_risk(self, concept_graph: Dict, source_concept: str, target_concept: str, 
                    source_mastery: float) -> Dict:
        """
        Predict risk in target concept given weakness in source concept
        
        Args:
            concept_graph: Knowledge graph structure
            source_concept: Concept ID where student is weak
            target_concept: Concept ID to predict risk for
            source_mastery: Mastery level of source (0.0 = weak, 1.0 = mastered)
        
        Returns:
            Dict with risk_score, risk_level, and explanation
        """
        if not self.is_trained:
            # Fallback to rule-based prediction
            return self._rule_based_risk(concept_graph, source_concept, target_concept, source_mastery)
        
        # Extract features
        features = self.extract_graph_features(concept_graph, source_concept, target_concept)
        features = features.reshape(1, -1)
        features_scaled = self.scaler.transform(features)
        
        # Predict risk (0.0 = low risk, 1.0 = high risk)
        base_risk = self.risk_model.predict(features_scaled)[0]
        
        # Adjust based on source mastery (if weak, risk increases)
        weakness_factor = 1.0 - source_mastery
        adjusted_risk = min(1.0, base_risk * (1.0 + weakness_factor))
        
        # Determine risk level
        if adjusted_risk < 0.3:
            risk_level = 'low'
        elif adjusted_risk < 0.6:
            risk_level = 'medium'
        else:
            risk_level = 'high'
        
        return {
            'risk_score': float(adjusted_risk),
            'risk_level': risk_level,
            'base_risk': float(base_risk),
            'weakness_impact': float(weakness_factor),
            'explanation': self._generate_explanation(concept_graph, source_concept, target_concept, adjusted_risk)
        }
    
    def _rule_based_risk(self, graph: Dict, source: str, target: str, mastery: float) -> Dict:
        """Fallback rule-based risk prediction"""
        edge = graph.get('edges', {}).get((source, target), {})
        weight = edge.get('weight', 0.5)
        dep_type = edge.get('type', 'prerequisite')
        
        # Base risk from dependency
        if dep_type == 'prerequisite' or dep_type == 'blocks':
            base_risk = weight * 0.8
        elif dep_type == 'strongly_related':
            base_risk = weight * 0.6
        else:
            base_risk = weight * 0.3
        
        # Adjust for mastery
        weakness = 1.0 - mastery
        risk_score = min(1.0, base_risk + (weakness * 0.4))
        
        if risk_score < 0.3:
            level = 'low'
        elif risk_score < 0.6:
            level = 'medium'
        else:
            level = 'high'
        
        return {
            'risk_score': float(risk_score),
            'risk_level': level,
            'base_risk': float(base_risk),
            'weakness_impact': float(weakness),
            'explanation': f"Rule-based prediction: {dep_type} dependency with weight {weight:.2f}"
        }
    
    def _generate_explanation(self, graph: Dict, source: str, target: str, risk: float) -> str:
        """Generate human-readable explanation of risk"""
        edge = graph.get('edges', {}).get((source, target), {})
        dep_type = edge.get('type', 'prerequisite')
        
        if risk > 0.7:
            return f"High risk: {target} strongly depends on {source}. Master {source} first."
        elif risk > 0.4:
            return f"Medium risk: {target} has a {dep_type} relationship with {source}."
        else:
            return f"Low risk: {target} has minimal dependency on {source}."
    
    def train(self, training_data: List[Dict]):
        """
        Train the risk prediction model
        
        training_data: List of {
            'source_concept': str,
            'target_concept': str,
            'source_mastery': float,
            'target_performance': float,  # Actual outcome (0-1)
            'concept_graph': Dict
        }
        """
        if not training_data:
            print("No training data provided, using rule-based prediction")
            return
        
        X = []
        y = []
        
        for sample in training_data:
            features = self.extract_graph_features(
                sample['concept_graph'],
                sample['source_concept'],
                sample['target_concept']
            )
            # Adjust features by source mastery
            weakness = 1.0 - sample['source_mastery']
            features = np.append(features, weakness)
            
            X.append(features)
            y.append(1.0 - sample['target_performance'])  # Risk = 1 - performance
        
        X = np.array(X)
        y = np.array(y)
        
        # Scale features
        X_scaled = self.scaler.fit_transform(X)
        
        # Train model
        self.risk_model.fit(X_scaled, y)
        self.is_trained = True
        
        print(f"Model trained on {len(training_data)} samples")
    
    def save_model(self, filepath: str):
        """Save trained model"""
        joblib.dump({
            'model': self.risk_model,
            'scaler': self.scaler,
            'is_trained': self.is_trained
        }, filepath)
    
    def load_model(self, filepath: str):
        """Load trained model"""
        data = joblib.load(filepath)
        self.risk_model = data['model']
        self.scaler = data['scaler']
        self.is_trained = data['is_trained']


if __name__ == '__main__':
    # Example usage
    predictor = ConceptRiskPredictor()
    
    # Example graph
    graph = {
        'edges': {
            ('stoichiometry', 'mole_concept'): {'weight': 0.9, 'type': 'prerequisite'},
            ('mole_concept', 'balancing_equations'): {'weight': 0.8, 'type': 'prerequisite'}
        },
        'outgoing': {
            'stoichiometry': ['mole_concept'],
            'mole_concept': ['balancing_equations']
        },
        'incoming': {
            'mole_concept': ['stoichiometry'],
            'balancing_equations': ['mole_concept']
        }
    }
    
    # Predict risk
    result = predictor.predict_risk(
        graph,
        'stoichiometry',
        'balancing_equations',
        source_mastery=0.3  # Weak in stoichiometry
    )
    
    print(json.dumps(result, indent=2))
