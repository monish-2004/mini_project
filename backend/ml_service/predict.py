import sys
import json
import numpy as np
import os
import tensorflow as tf
from tensorflow.keras.models import load_model
from tensorflow.keras.layers import Layer
import tensorflow.keras.backend as K

# =============================================================================
# Custom Attention Layer (Copied directly from your training script)
# =============================================================================
class AttentionLayer(Layer):
    def __init__(self, **kwargs):
        super(AttentionLayer, self).__init__(**kwargs)

    def build(self, input_shape):
        self.W = self.add_weight(
            name="att_weight",
            shape=(input_shape[-1], 1),
            initializer="glorot_uniform",
            trainable=True
        )
        self.b = self.add_weight(
            name="att_bias",
            shape=(input_shape[1], 1),
            initializer="zeros",
            trainable=True
        )
        super(AttentionLayer, self).build(input_shape)

    def call(self, x):
        e = K.tanh(K.dot(x, self.W) + self.b)
        a = K.softmax(e, axis=1)
        output = x * a
        return K.sum(output, axis=1)

    def get_config(self):
        config = super(AttentionLayer, self).get_config()
        return config

    @classmethod
    def from_config(cls, config):
        return cls(**config)


# =============================================================================
# Model Loading Function
# =============================================================================
def load_emotion_model():
    script_dir = os.path.dirname(__file__)
    model_path = os.path.join(script_dir, 'model', 'cnn_gru_attention_emotion_model.h5')

    if not os.path.exists(model_path):
        print(f"Error: Model not found at {model_path}", file=sys.stderr)
        sys.exit(1)

    try:
        model = load_model(model_path, custom_objects={'AttentionLayer': AttentionLayer})
        return model
    except Exception as e:
        print(f"Error loading model from {model_path}: {e}", file=sys.stderr)
        sys.exit(1)

# =============================================================================
# Main Prediction Logic
# =============================================================================
if __name__ == "__main__":
    try:
        features_json = sys.argv[1]
        features = json.loads(features_json)

        features_array = np.array(features, dtype=np.float32).reshape(1, 9, 1)

        model = load_emotion_model()

        # Perform the prediction
        # IMPORTANT CHANGE: Added verbose=0 to suppress the progress bar
        emotion_probabilities = model.predict(features_array, verbose=0).tolist()[0]

        # Output the probabilities as a JSON string to stdout
        print(json.dumps({"emotionProbs": emotion_probabilities}))

    except IndexError:
        print("Error: No feature vector provided. Usage: python predict.py '[features_json_string]'", file=sys.stderr)
        sys.exit(1)
    except json.JSONDecodeError:
        print("Error: Invalid JSON format for features.", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"An unexpected error occurred during prediction: {e}", file=sys.stderr)
        sys.exit(1)

