import os
import json
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.impute import SimpleImputer
from sklearn.metrics import classification_report, confusion_matrix, ConfusionMatrixDisplay

import tensorflow as tf
from tensorflow.keras.models import Model
from tensorflow.keras.layers import Input, Dense, Conv1D, MaxPooling1D, GRU, Layer
from tensorflow.keras.callbacks import EarlyStopping
import tensorflow.keras.backend as K


# =============================================================================
# 1. Configuration / Paths
# =============================================================================
DATA_PATH = r'C:\Users\monis\Downloads\balanced_dataset_mini_project.csv'
OUTPUT_DIR = './ml_service/model'  # Save outputs here
MODEL_NAME = 'cnn_gru_attention_emotion_model.h5'
SCALER_NAME = 'scaler.json'
ENCODER_NAME = 'encoder.json'

os.makedirs(OUTPUT_DIR, exist_ok=True)


# =============================================================================
# 2. Load & Prepare Data
# =============================================================================
df = pd.read_csv(DATA_PATH)

feature_columns = [
    'Num_of_Fixations',
    'Mean_Fixation_Duration',
    'SD_Fixation_Duration',
    'Num_of_Saccade',
    'Mean_Saccade_Duration',
    'Mean_Saccade_Amplitude',
    'Num_of_Blink',
    'Mean_Blink_Duration',
    'Num_of_Microsac'
]
X = df[feature_columns].values
y = df['emotion_state'].values


# =============================================================================
# 3. Encode Labels → Save encoder.json
# =============================================================================
le = LabelEncoder()
y_encoded = le.fit_transform(y)
class_labels = le.classes_.tolist()
y_cat = tf.keras.utils.to_categorical(y_encoded)

encoder_path = os.path.join(OUTPUT_DIR, ENCODER_NAME)
with open(encoder_path, 'w') as f_enc:
    json.dump({"classes": class_labels}, f_enc)
print(f"✔️ Saved encoder classes → {encoder_path}")


# =============================================================================
# 4. Train/Test Split
# =============================================================================
X_train, X_test, y_train, y_test = train_test_split(
    X, y_cat, test_size=0.20, random_state=42, stratify=y_cat
)


# =============================================================================
# 5. Impute Missing Values
# =============================================================================
imputer = SimpleImputer(strategy='mean')
X_train = imputer.fit_transform(X_train)
X_test = imputer.transform(X_test)


# =============================================================================
# 6. Standardize & Save scaler.json
# =============================================================================
scaler = StandardScaler()
X_train = scaler.fit_transform(X_train)
X_test = scaler.transform(X_test)

scaler_data = {
    "mean": scaler.mean_.tolist(),
    "variance": scaler.var_.tolist()
}
scaler_path = os.path.join(OUTPUT_DIR, SCALER_NAME)
with open(scaler_path, 'w') as f_scaler:
    json.dump(scaler_data, f_scaler)
print(f"✔️ Saved scaler mean/variance → {scaler_path}")


# =============================================================================
# 7. Data Augmentation (Add Noise)
# =============================================================================
noise = np.random.normal(0, 0.1, X_train.shape)
X_train = X_train + noise


# =============================================================================
# 8. Reshape for CNN + GRU
# =============================================================================
X_train_cnn = np.expand_dims(X_train, axis=2)
X_test_cnn = np.expand_dims(X_test, axis=2)


# =============================================================================
# 9. Custom Attention Layer
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


# =============================================================================
# 10. Build Model
# =============================================================================
input_layer = Input(shape=(X_train_cnn.shape[1], 1))
x = Conv1D(32, 3, activation='relu', padding='same')(input_layer)
x = MaxPooling1D(2)(x)
x = GRU(32, return_sequences=True)(x)
x = AttentionLayer()(x)
output_layer = Dense(y_train.shape[1], activation='softmax')(x)

model = Model(inputs=input_layer, outputs=output_layer)
model.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])

print("\n📝 Model Summary:")
model.summary()


# =============================================================================
# 11. Train Model
# =============================================================================
early_stop = EarlyStopping(monitor='val_loss', patience=10, restore_best_weights=True)

history = model.fit(
    X_train_cnn, y_train,
    epochs=30,
    batch_size=32,
    validation_split=0.20,
    callbacks=[early_stop],
    verbose=2
)


# =============================================================================
# 12. Save Model
# =============================================================================
model_path = os.path.join(OUTPUT_DIR, MODEL_NAME)
model.save(model_path)
print(f"✔️ Saved Keras model → {model_path}")


# =============================================================================
# 13. Evaluate Model
# =============================================================================
loss, test_acc = model.evaluate(X_test_cnn, y_test, verbose=0)
print(f"\n🔍 Test accuracy: {test_acc:.4f}")

y_pred_probs = model.predict(X_test_cnn)
y_pred = np.argmax(y_pred_probs, axis=1)
y_true = np.argmax(y_test, axis=1)

print("\n📊 Classification Report:")
print(classification_report(y_true, y_pred, target_names=class_labels))

cm = confusion_matrix(y_true, y_pred)
disp = ConfusionMatrixDisplay(confusion_matrix=cm, display_labels=class_labels)
disp.plot(cmap=plt.cm.Blues)
plt.title("Confusion Matrix")
plt.savefig(os.path.join(OUTPUT_DIR, 'confusion_matrix.png'))
plt.show()
