# WristAI: Wrist Fracture Classification Pipeline (Experimental Prototype)

A PyTorch-based deep learning binary classifier designed to detect fractures from wrist X-ray radiographs, trained exclusively on clean radiographs extracted from `wrist_xray_dataset.pdf`.

> [!WARNING]
> **CRITICAL DATA LIMITATION & CLINICAL DISCLAIMER:**
> - **Sample Size:** This pipeline is trained on **only 5 independent radiographic examples** (4 Fracture, 1 Normal) extracted from a 9-page PDF document.
> - **Overfitting Risk:** Because deep neural network parameters (11.18M parameters in ResNet-18) vastly exceed the sample count, the model memorizes these specific examples.
> - **No Clinical Validity:** This software is an **experimental proof-of-concept pipeline**. It is **NOT** a certified medical device, does **NOT** possess clinical accuracy, and **MUST NOT** be used for diagnostic, triage, or clinical decision support purposes. It will **not generalize** reliably to arbitrary unseen wrist radiographs.

---

## 1. Project Directory Structure

```
wristAI/
├── wrist_xray_dataset.pdf         # Primary PDF data source (9 pages)
├── requirements.txt               # Python package dependencies
├── README.md                      # Project documentation and usage guide
├── data/
│   ├── raw/                       # 9 raw PNG images extracted directly from PDF streams
│   │   ├── page_01_xref_5.png
│   │   └── ...
│   ├── processed/                 # 5 verified clean training images
│   │   ├── fracture/              # 4 Fracture images (2 obvious, 2 subtle)
│   │   └── normal/                # 1 Normal wrist image
│   ├── labels.csv                 # Dataset manifest
│   └── labels_audited.csv         # Detailed audit manifest with conflict notes
├── training/
│   ├── extract_pdf.py             # Extracts images & detects annotation overlays
│   ├── prepare_dataset.py         # Curates clean samples & creates contact sheet
│   ├── train.py                   # PyTorch ResNet-18 training script
│   └── evaluate.py                # Standalone verification & fresh inference engine
├── models/
│   ├── wrist_fracture_model.pth   # Trained PyTorch model checkpoint state_dict
│   ├── class_names.json           # Class mapping {"0": "NORMAL", "1": "FRACTURE"}
│   └── preprocessing.json         # Normalized preprocessing specification
└── outputs/
    ├── dataset_preview.png        # Contact sheet showing clean vs annotated pairs
    ├── training_history.png       # Loss and accuracy curves over 25 epochs
    └── training_report.json       # Detailed audit, metrics, and verification table
```

---

## 2. Dataset Extraction & Verification Audit

The 9 pages of `wrist_xray_dataset.pdf` were analyzed and classified into **5 unique patient cases** and **4 annotated verification duplicates**:

| Case ID | Clean Source | Class Label | Subtype | View | Key Finding | PDF Anomaly / Duplicate |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **CASE_01** | **Page 1** | `FRACTURE` | Obvious | Lateral | Distal radius cortical disruption with dorsal displacement | Page 2 is annotated counterpart (Red box + arrow) |
| **CASE_02** | **Page 3** | `FRACTURE` | Obvious | AP | Comminuted intra-articular distal radius fracture | Page 4 is annotated counterpart (Red box + arrow). *PDF caption mistakenly said 'NORMAL'* |
| **CASE_03** | **Page 5** | `NORMAL` | Normal | AP | Smooth cortices, intact radioulnar joint, normal carpal arcs | No duplicate (uninjured anatomy) |
| **CASE_04** | **Page 6** | `FRACTURE` | Subtle | AP | Subtle transverse metaphyseal fracture line | Page 7 is annotated counterpart (Red box + arrow) |
| **CASE_05** | **Page 8** | `FRACTURE` | Subtle | AP | Subtle radial styloid cortical fracture line | Page 9 is annotated counterpart (Red circle + arrow) |

*All 4 annotated copies (Pages 2, 4, 7, and 9) were strictly excluded from the training dataset to prevent shortcut learning on red annotation markings.*

---

## 3. Model Architecture & Preprocessing

- **Backbone:** ResNet-18 (`torchvision.models.resnet18`)
- **Classifier Head:** Dropout(p=0.2) $\rightarrow$ Linear(512 $\rightarrow$ 2)
- **Loss Function:** Weighted Cross-Entropy Loss (Class weights: `[4.0, 1.0]` to balance 1 Normal vs 4 Fracture cases)
- **Optimizer:** AdamW (`lr=1e-4`, `weight_decay=1e-3`)
- **Augmentation (Medically Conservative):**
  - Slight Rotation: $\pm 7^\circ$
  - Affine Translation: $\pm 2\%$
  - Scaling: $0.98\times$ to $1.02\times$
  - Contrast & Brightness Jitter: $\pm 5\%$
  *(No vertical flipping to maintain proximal-distal anatomical orientation)*
- **Preprocessing Pipeline (Consistent for Train & Inference):**
  1. RGB conversion (3 channels)
  2. Resize to $256 \times 256$
  3. Center crop to $224 \times 224$
  4. PyTorch ToTensor normalization (Mean: `[0.485, 0.456, 0.406]`, Std: `[0.229, 0.224, 0.225]`)

---

## 4. How to Run

### Installation
```bash
pip install -r requirements.txt
```

### Step 1: Extract Images from PDF
```bash
python training/extract_pdf.py
```

### Step 2: Organize Clean Dataset & Preview
```bash
python training/prepare_dataset.py
```

### Step 3: Train Classifier
```bash
python training/train.py
```

### Step 4: Evaluate & Perform Fresh Inference
```bash
python training/evaluate.py
```

### Programmatic Inference on New Images
```python
from training.evaluate import WristFracturePredictor

predictor = WristFracturePredictor(
    checkpoint_path="models/wrist_fracture_model.pth",
    class_names_path="models/class_names.json",
    preprocessing_path="models/preprocessing.json"
)

# Accepts image filepath, PIL Image, or numpy array
result = predictor.predict("path/to/wrist_xray.png")
print("Prediction:", result["predicted_class"])
print("Confidence:", result["confidence"], "%")
print("Probabilities:", result["probabilities"])
```
*Every call performs dynamic, fresh tensor preprocessing and forward computation without any cached outputs.*

---

## 5. Verification Results on Training Dataset

| Image Sample | Source | View | Ground Truth | Prediction | Confidence | Latency |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `wrist_case_01_obvious_fracture_p01.png` | Page 1 | Lateral | `FRACTURE` | **FRACTURE** | 99.92% | ~380ms |
| `wrist_case_02_obvious_fracture_p03.png` | Page 3 | AP | `FRACTURE` | **FRACTURE** | 96.00% | ~127ms |
| `wrist_case_03_normal_p05.png` | Page 5 | AP | `NORMAL` | **NORMAL** | 99.99% | ~132ms |
| `wrist_case_04_subtle_fracture_p06.png` | Page 6 | AP | `FRACTURE` | **FRACTURE** | 85.98% | ~127ms |
| `wrist_case_05_subtle_fracture_p08.png` | Page 8 | AP | `FRACTURE` | **FRACTURE** | 84.20% | ~124ms |

> **Note on Training Accuracy:** All 5 samples achieve 100% training verification. As emphasized throughout this documentation, this reflects training set convergence on a 5-sample prototype dataset and **must not** be reported as independent test or clinical accuracy.
