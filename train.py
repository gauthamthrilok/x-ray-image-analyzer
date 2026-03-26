import os
import cv2
import shutil
import pandas as pd
import numpy as np
import tensorflow as tf
from tensorflow.keras import layers, models, Model
from tensorflow.keras.applications import DenseNet121
from sklearn.model_selection import train_test_split

# --- 1. ROBUST ENVIRONMENT SETUP ---
drive_dataset_path = '/content/drive/MyDrive/dataset'
local_dataset_path = '/content/dataset'

if not os.path.exists(local_dataset_path):
    print("Transferring 5000+ images from Drive to local SSD. Please wait...")
    os.system(f"cp -r '{drive_dataset_path}' '{local_dataset_path}'")
    print("Transfer complete!")
else:
    print("Local dataset already exists. Skipping copy.")

IMAGES_DIR = os.path.join(local_dataset_path, 'images')
DATASET_CSV_PATH = os.path.join(local_dataset_path, 'dataset.xlsx')
IMG_SIZE = (320, 320)
BATCH_SIZE = 16
EPOCHS = 100

# --- 2. ADVANCED MODEL ARCHITECTURE (ATTENTION + SWISH) ---
def squeeze_excite_block(input_tensor, ratio=16):
    init = input_tensor
    filters = init.shape[-1]
    se = layers.GlobalAveragePooling2D()(init)
    se = layers.Reshape((1, 1, filters))(se)
    se = layers.Dense(filters // ratio, activation='relu', kernel_initializer='he_normal', use_bias=False)(se)
    se = layers.Dense(filters, activation='sigmoid', kernel_initializer='he_normal', use_bias=False)(se)
    return layers.multiply([init, se])

def build_advanced_model(num_bone_classes, num_view_classes):
    inputs = layers.Input(shape=(IMG_SIZE[0], IMG_SIZE[1], 3))

    # Medically realistic augmentation
    x = layers.RandomFlip("horizontal")(inputs) # Vertical flips removed for anatomical accuracy
    x = layers.RandomRotation(0.1)(x)
    x = layers.RandomZoom(height_factor=(-0.1, 0.1), width_factor=(-0.1, 0.1))(x) # Zoom to catch tiny cracks
    x = layers.RandomTranslation(0.1, 0.1)(x)

    base_model = DenseNet121(include_top=False, weights='imagenet', input_tensor=x)

    attended_features = squeeze_excite_block(base_model.output)
    gap = layers.GlobalAveragePooling2D()(attended_features)

    # BONE BRANCH
    b = layers.Dense(256, activation='swish')(gap)
    b = layers.BatchNormalization()(b)
    b = layers.Dropout(0.3)(b)
    bone_output = layers.Dense(num_bone_classes, activation='sigmoid', name='bone_output')(b)

    # FRACTURE BRANCH
    f = layers.Dense(512, activation='swish')(gap)
    f = layers.BatchNormalization()(f)
    f = layers.Dropout(0.4)(f)
    f = layers.Dense(128, activation='swish')(f)
    f = layers.BatchNormalization()(f)
    fracture_output = layers.Dense(1, activation='sigmoid', name='fracture_output')(f)

    # VIEW BRANCH
    v = layers.Dense(128, activation='swish')(gap)
    v = layers.BatchNormalization()(v)
    v = layers.Dropout(0.3)(v)
    view_output = layers.Dense(num_view_classes, activation='softmax', name='view_output')(v)

    return Model(inputs=inputs, outputs=[bone_output, fracture_output, view_output]), base_model

# --- 3. DATA LOADING & PREPROCESSING ---
def load_image_cv2(path_tensor):
    if isinstance(path_tensor, bytes):
        path = path_tensor.decode('utf-8')
    else:
        path = path_tensor.numpy().decode('utf-8')

    try:
        img = cv2.imread(path)
        if img is None:
            return np.zeros((IMG_SIZE[0], IMG_SIZE[1], 3), dtype=np.uint8)

        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        enhanced = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8,8)).apply(gray)
        img = cv2.cvtColor(enhanced, cv2.COLOR_GRAY2RGB)
        img = cv2.resize(img, (IMG_SIZE[1], IMG_SIZE[0]))
        return img.astype(np.float32)
    except Exception:
        return np.zeros((IMG_SIZE[0], IMG_SIZE[1], 3), dtype=np.uint8)

def load_and_preprocess_image(path):
    image = tf.numpy_function(load_image_cv2, [path], tf.float32)
    image.set_shape([IMG_SIZE[0], IMG_SIZE[1], 3])
    return (image - 127.5) / 127.5

def process_path(path, bone_label, fracture_label, view_label):
    image = load_and_preprocess_image(path)
    return image, {'bone_output': bone_label, 'fracture_output': fracture_label, 'view_output': view_label}

def create_dataset(image_paths, bone_labels, fracture_labels, view_labels, is_training=False):
    dataset = tf.data.Dataset.from_tensor_slices((image_paths, bone_labels, fracture_labels, view_labels))
    if is_training: dataset = dataset.shuffle(len(image_paths))
    return dataset.map(process_path, num_parallel_calls=tf.data.AUTOTUNE).batch(BATCH_SIZE).prefetch(tf.data.AUTOTUNE)

# --- 4. MAIN EXECUTION ---
def main():
    print("Loading and indexing dataset...")
    df = pd.read_excel(DATASET_CSV_PATH)
    df.columns = df.columns.str.strip()
    df = df.fillna(0)

    bone_cols = ['hand', 'finger', 'wrist', 'forearm', 'elbow', 'humerus', 'shoulder', 'hip', 'leg', 'knee', 'tibia', 'ankle', 'foot', 'toe', 'spine']
    bone_cols = [c for c in bone_cols if c in df.columns]
    view_cols = [c for c in ['frontal', 'lateral', 'oblique'] if c in df.columns]

    print("Scanning local storage for all files...")
    all_files_map = {}
    for root, dirs, files in os.walk(IMAGES_DIR):
        for f in files:
            name_no_ext = os.path.splitext(f)[0].lower().strip()
            all_files_map[name_no_ext] = os.path.join(root, f)

    def find_path(img_id):
        img_id_str = str(img_id).lower().strip()
        return all_files_map.get(img_id_str) or all_files_map.get(os.path.splitext(img_id_str)[0])

    df['valid_path'] = df['image_id'].apply(find_path)
    found_count = df['valid_path'].notna().sum()

    print(f"\n--- DATASET REPORT ---")
    print(f"Total Rows in Excel: {len(df)}")
    print(f"Images Successfully Located: {found_count}")

    df = df.dropna(subset=['valid_path'])
    if len(df) == 0: return

    train_idx, val_idx = train_test_split(np.arange(len(df)), test_size=0.10, random_state=42)

    train_ds = create_dataset(df['valid_path'].iloc[train_idx].values, df[bone_cols].iloc[train_idx].values, df['fractured'].iloc[train_idx].values, df[view_cols].iloc[train_idx].values, True)
    val_ds = create_dataset(df['valid_path'].iloc[val_idx].values, df[bone_cols].iloc[val_idx].values, df['fractured'].iloc[val_idx].values, df[view_cols].iloc[val_idx].values, False)

    model, base_model = build_advanced_model(len(bone_cols), len(view_cols))

    # UPGRADED TARGETED LOSS CONFIGURATION
    loss_cfg = {
        'bone_output': tf.keras.losses.BinaryCrossentropy(label_smoothing=0.05),
        'fracture_output': tf.keras.losses.BinaryFocalCrossentropy(gamma=2.0, alpha=0.25, label_smoothing=0.05),
        'view_output': tf.keras.losses.CategoricalCrossentropy(label_smoothing=0.05)
    }

    loss_weights = {
        'bone_output': 0.5,
        'fracture_output': 4.0,
        'view_output': 0.5
    }
    metrics_cfg = {
        'bone_output': 'acc',
        'fracture_output': [tf.keras.metrics.BinaryAccuracy(name='acc'), tf.keras.metrics.AUC(name='auc')],
        'view_output': 'acc'
    }

    print("\n--- Phase 1: Warming Up Top Layers ---")
    base_model.trainable = False
    model.compile(optimizer=tf.keras.optimizers.Adam(1e-3, clipnorm=1.0),
                  loss=loss_cfg, loss_weights=loss_weights, metrics=metrics_cfg)
    model.fit(train_ds, validation_data=val_ds, epochs=5)

    print("\n--- Phase 2: Deep Fine-Tuning ---")
    base_model.trainable = True
    lr_schedule = tf.keras.optimizers.schedules.CosineDecay(1e-5, EPOCHS * len(train_idx) // BATCH_SIZE)
    model.compile(optimizer=tf.keras.optimizers.AdamW(learning_rate=lr_schedule, weight_decay=1e-4, clipnorm=1.0),
                  loss=loss_cfg, loss_weights=loss_weights, metrics=metrics_cfg)

    callbacks = [
        tf.keras.callbacks.ModelCheckpoint('/content/drive/MyDrive/best_xray_model.keras', save_best_only=True, monitor='val_loss'),
        tf.keras.callbacks.EarlyStopping(patience=8, restore_best_weights=True, monitor='val_loss', verbose=1)
    ]

    model.fit(train_ds, validation_data=val_ds, epochs=EPOCHS, callbacks=callbacks)

if __name__ == '__main__':
    main()