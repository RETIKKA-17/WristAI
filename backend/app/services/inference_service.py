import os
import json
import time
import threading
import gc
from PIL import Image
import torch
import torch.nn as nn
from torchvision import transforms, models

class WristFractureInferenceService:
    def __init__(self, 
                 checkpoint_path=None, 
                 class_names_path=None, 
                 preprocessing_path=None):
        
        base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
        self.checkpoint_path = checkpoint_path or os.path.join(base_dir, "models", "wrist_fracture_model.pth")
        self.class_names_path = class_names_path or os.path.join(base_dir, "models", "class_names.json")
        self.preprocessing_path = preprocessing_path or os.path.join(base_dir, "models", "preprocessing.json")
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        if self.device == "cpu":
            # Constrain CPU threads to prevent thread-pool memory explosion on multi-core cloud containers
            torch.set_num_threads(1)

        if not os.path.exists(self.checkpoint_path):
            raise FileNotFoundError(f"Model checkpoint not found: {self.checkpoint_path}")
        
        # Verify checkpoint is actual binary weights and not an unpulled Git LFS pointer (<10KB)
        if os.path.getsize(self.checkpoint_path) < 10000:
            print(f"[InferenceService] WARNING: Checkpoint at {self.checkpoint_path} is a Git LFS pointer. Downloading full weights...")
            try:
                import urllib.request
                lfs_url = "https://media.githubusercontent.com/media/RETIKKA-17/WristAI/main/models/wrist_fracture_model.pth"
                urllib.request.urlretrieve(lfs_url, self.checkpoint_path)
                print(f"[InferenceService] Successfully fetched model checkpoint ({os.path.getsize(self.checkpoint_path)} bytes).")
            except Exception as e:
                raise RuntimeError(f"Model checkpoint is a Git LFS pointer and automatic download failed: {e}")
        if not os.path.exists(self.class_names_path):
            raise FileNotFoundError(f"Class names config not found: {self.class_names_path}")
        if not os.path.exists(self.preprocessing_path):
            raise FileNotFoundError(f"Preprocessing config not found: {self.preprocessing_path}")

        # Load class names
        with open(self.class_names_path, "r") as f:
            raw_classes = json.load(f)
            self.class_names = {int(k): v for k, v in raw_classes.items()}

        # Load preprocessing specs
        with open(self.preprocessing_path, "r") as f:
            self.prep_config = json.load(f)

        # Build consistent preprocessing transform (exact match to training & evaluation)
        self.transform = transforms.Compose([
            transforms.Resize((self.prep_config["resize_dimension"], self.prep_config["resize_dimension"])),
            transforms.CenterCrop(self.prep_config["crop_dimension"]),
            transforms.ToTensor(),
            transforms.Normalize(
                mean=self.prep_config["normalization"]["mean"],
                std=self.prep_config["normalization"]["std"]
            )
        ])

        # Reproduce exact ResNet-18 architecture with Dropout(0.2) + Linear(512, 2)
        self.model = models.resnet18(weights=None)
        in_features = self.model.fc.in_features
        self.model.fc = nn.Sequential(
            nn.Dropout(p=0.2),
            nn.Linear(in_features, self.prep_config["num_classes"])
        )

        # Load trained weights with memory mapping (mmap=True) to avoid allocating RAM for unneeded optimizer states
        checkpoint = torch.load(self.checkpoint_path, map_location=self.device, mmap=True)
        self.model.load_state_dict(checkpoint["model_state_dict"])
        # Release unneeded raw checkpoint dictionary & optimizer states immediately
        del checkpoint
        gc.collect()

        self.model.to(self.device)
        self.model.eval()
        print(f"[Inference Service] Successfully loaded ResNet-18 checkpoint from '{self.checkpoint_path}' on {self.device}.")

    def run_inference(self, image_input):
        """
        Executes FRESH inference on the provided image input.
        Does NOT cache results or rely on previous static outputs.
        """
        start_time = time.perf_counter()

        # Handle file path or PIL image
        if isinstance(image_input, str):
            if not os.path.exists(image_input):
                raise FileNotFoundError(f"File not found: {image_input}")
            img_pil = Image.open(image_input).convert("RGB")
        elif isinstance(image_input, Image.Image):
            img_pil = image_input.convert("RGB")
        else:
            raise ValueError(f"Unsupported image input type: {type(image_input)}")

        # Transform and add batch dimension
        tensor_img = self.transform(img_pil).unsqueeze(0).to(self.device)

        # Run model forward pass dynamically with inference_mode for minimal memory overhead
        with torch.inference_mode():
            logits = self.model(tensor_img)
            probs = torch.softmax(logits, dim=1).cpu().numpy()[0]
            pred_idx = int(torch.argmax(logits, dim=1).item())

        elapsed_ms = round((time.perf_counter() - start_time) * 1000.0, 2)

        normal_score = round(float(probs[0]), 4)
        fracture_score = round(float(probs[1]), 4)
        confidence = round(float(probs[pred_idx]) * 100.0, 2)
        predicted_label = self.class_names[pred_idx] # "NORMAL" or "FRACTURE"

        # Determine if case is uncertain (e.g. if neither score dominates above 65%)
        # But still provide primary predicted_label
        is_uncertain = (0.35 <= fracture_score <= 0.65)
        decision_label = "UNCERTAIN" if is_uncertain else predicted_label

        return {
            "prediction": predicted_label,
            "decision_status": decision_label,
            "confidence": confidence,
            "normal_score": normal_score,
            "fracture_score": fracture_score,
            "model_scores": {
                "NORMAL": normal_score,
                "FRACTURE": fracture_score
            },
            "inference_time_ms": elapsed_ms,
            "raw_logits": [round(float(l), 4) for l in logits.cpu().numpy()[0]]
        }

# Global singleton instance with thread-safe lock
_inference_instance = None
_inference_init_lock = threading.Lock()

def get_inference_service() -> WristFractureInferenceService:
    global _inference_instance
    if _inference_instance is None:
        with _inference_init_lock:
            if _inference_instance is None:
                _inference_instance = WristFractureInferenceService()
    return _inference_instance
