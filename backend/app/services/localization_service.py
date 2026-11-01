import os
import json
import hashlib
import threading
import gc
import cv2
import numpy as np
from typing import Optional, Dict, Any, List
from PIL import Image
import torch
from torchvision import transforms, models

from backend.app.services.inference_service import get_inference_service

class LocalizationService:
    def __init__(self, annotations_path: Optional[str] = None):
        base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
        self.base_dir = base_dir
        self.annotations_path = annotations_path or os.path.join(base_dir, "data", "localization_annotations.json")
        self.raw_dir = os.path.join(base_dir, "data", "raw")
        self.uploads_dir = os.getenv("UPLOADS_DIR", os.path.join(base_dir, "backend", "uploads"))
        os.makedirs(self.uploads_dir, exist_ok=True)
        
        self.annotations: List[Dict[str, Any]] = []
        self.ref_cases: Dict[str, Dict[str, Any]] = {}
        self.file_hashes: Dict[str, str] = {}   # sha256 -> case_id
        self.md5_hashes: Dict[str, str] = {}    # md5 -> case_id
        self.pixel_hashes: Dict[str, str] = {}  # sha256(grayscale_bytes) -> case_id
        self.dhashes: Dict[str, int] = {}       # case_id -> 64-bit int

        # SIFT & Feature Bank
        self.sift = cv2.SIFT_create(nfeatures=2000)
        self.bf = cv2.BFMatcher(cv2.NORM_L2, crossCheck=False)
        self.sift_bank: List[Dict[str, Any]] = []
        
        self._load_reference_data()

    def _compute_dhash(self, img_gray, hash_size=8) -> int:
        """Computes difference hash (dHash) for perceptual image matching."""
        resized = cv2.resize(img_gray, (hash_size + 1, hash_size))
        diff = resized[:, 1:] > resized[:, :-1]
        val = 0
        for bit in diff.flatten():
            val = (val << 1) | int(bit)
        return val

    def _hamming_distance(self, h1: int, h2: int) -> int:
        return bin(h1 ^ h2).count('1')

    def _compute_ssim(self, img1: np.ndarray, img2: np.ndarray) -> float:
        """Computes Structural Similarity Index (SSIM) between two normalized 512x512 images."""
        C1 = (0.01) ** 2
        C2 = (0.03) ** 2
        mu1 = cv2.GaussianBlur(img1, (11, 11), 1.5)
        mu2 = cv2.GaussianBlur(img2, (11, 11), 1.5)
        mu1_sq = mu1 ** 2
        mu2_sq = mu2 ** 2
        mu1_mu2 = mu1 * mu2
        sigma1_sq = cv2.GaussianBlur(img1 ** 2, (11, 11), 1.5) - mu1_sq
        sigma2_sq = cv2.GaussianBlur(img2 ** 2, (11, 11), 1.5) - mu2_sq
        sigma12 = cv2.GaussianBlur(img1 * img2, (11, 11), 1.5) - mu1_mu2
        ssim_map = ((2 * mu1_mu2 + C1) * (2 * sigma12 + C2)) / ((mu1_sq + mu2_sq + C1) * (sigma1_sq + sigma2_sq + C2))
        return float(np.mean(ssim_map))

    def _load_reference_data(self):
        if not os.path.exists(self.annotations_path):
            print(f"[Localization Service] Warning: Annotations file not found at {self.annotations_path}")
            return
            
        with open(self.annotations_path, "r") as f:
            self.annotations = json.load(f)

        cache_path = os.path.join(self.base_dir, "data", "sift_reference_cache.npz")
        if os.path.exists(cache_path):
            try:
                cache_data = np.load(cache_path, allow_pickle=True)
                meta = json.loads(str(cache_data["metadata_json"][0]))
                self.file_hashes = meta["hashes"]["file_hashes"]
                self.md5_hashes = meta["hashes"]["md5_hashes"]
                self.pixel_hashes = meta["hashes"]["pixel_hashes"]
                dhashes = meta["hashes"]["dhashes"]

                for item in meta["items"]:
                    idx = item["idx"]
                    kp_arr = cache_data[f"kp_{idx}"]
                    des = cache_data[f"des_{idx}"]
                    shape = tuple(cache_data[f"shape_{idx}"])
                    kp = [
                        cv2.KeyPoint(
                            x=float(p[0]), y=float(p[1]), size=float(p[2]), angle=float(p[3]),
                            response=float(p[4]), octave=int(p[5]), class_id=int(p[6])
                        )
                        for p in kp_arr
                    ]
                    self.sift_bank.append({
                        "case_id": item["case_id"],
                        "filename": item["filename"],
                        "is_annotated": item["is_annotated"],
                        "kp": kp,
                        "des": des,
                        "shape": shape,
                        "box": item["box"],
                        "pair": item["pair"]
                    })

                    cid = item["case_id"]
                    if not item["is_annotated"] and cid not in self.ref_cases:
                        img_512 = cache_data[f"img512_{cid}"]
                        found_path = os.path.join(self.raw_dir, item["filename"])
                        if not os.path.exists(found_path):
                            found_path = os.path.join(self.base_dir, "extracted_pages", item["filename"])
                        self.ref_cases[cid] = {
                            "entry": item["pair"],
                            "img_path": found_path,
                            "img_512": img_512,
                            "img_512_f32": img_512.astype(np.float32) / 255.0,
                            "shape": shape,
                            "dhash": dhashes.get(cid, 0)
                        }

                print(f"[Localization Service] Initialized from fast cache: {len(self.ref_cases)} reference cases, {len(self.sift_bank)} SIFT feature sets, {len(self.file_hashes)} file hashes.")
                return
            except Exception as e:
                print(f"[Localization Service] Warning: Fast cache load failed ({e}), falling back to direct computation.")
                self.sift_bank.clear()
                self.ref_cases.clear()

        # Fallback to direct computation if cache is missing or corrupt
        reference_pairs = [
            {
                "case_id": "CASE_01",
                "clean_file": "page_01_xref_5.png",
                "ann_file": "page_02_xref_9.png",
                "source_pdf_page": 1,
                "annotated_pdf_page": 2,
                "marking_type": "RED_RECTANGLE",
                "box": [0.37045, 0.39460, 0.67077, 0.52097]
            },
            {
                "case_id": "CASE_02",
                "clean_file": "page_03_xref_12.png",
                "ann_file": "page_04_xref_15.png",
                "source_pdf_page": 3,
                "annotated_pdf_page": 4,
                "marking_type": "RED_RECTANGLE",
                "box": [0.32515, 0.41418, 0.58317, 0.54965]
            },
            {
                "case_id": "CASE_03",
                "clean_file": "page_05_xref_18.png",
                "ann_file": None,
                "source_pdf_page": 5,
                "annotated_pdf_page": None,
                "marking_type": "NONE_NORMAL",
                "box": None
            },
            {
                "case_id": "CASE_04",
                "clean_file": "page_06_xref_21.png",
                "ann_file": "page_07_xref_24.png",
                "source_pdf_page": 6,
                "annotated_pdf_page": 7,
                "marking_type": "RED_RECTANGLE",
                "box": [0.30577, 0.47628, 0.51496, 0.56615]
            },
            {
                "case_id": "CASE_05",
                "clean_file": "page_08_xref_27.png",
                "ann_file": "page_09_xref_30.png",
                "source_pdf_page": 8,
                "annotated_pdf_page": 9,
                "marking_type": "RED_DASHED_CIRCLE",
                "box": [0.32447, 0.43785, 0.45839, 0.53867]
            }
        ]

        search_dirs = [
            self.raw_dir,
            os.path.join(self.base_dir, "data", "processed", "fracture"),
            os.path.join(self.base_dir, "data", "processed", "normal"),
            os.path.join(self.base_dir, "extracted_pages"),
            self.uploads_dir
        ]

        for pair in reference_pairs:
            cid = pair["case_id"]
            for is_ann, fname in [(False, pair["clean_file"]), (True, pair["ann_file"])]:
                if not fname:
                    continue
                found_path = None
                for sdir in search_dirs:
                    candidate = os.path.join(sdir, fname)
                    if os.path.exists(candidate):
                        found_path = candidate
                        break
                if not found_path:
                    continue

                # Hashes
                with open(found_path, "rb") as fp:
                    content = fp.read()
                    self.file_hashes[hashlib.sha256(content).hexdigest()] = cid
                    self.md5_hashes[hashlib.md5(content).hexdigest()] = cid

                img_gray = cv2.imread(found_path, cv2.IMREAD_GRAYSCALE)
                if img_gray is not None:
                    h, w = img_gray.shape
                    self.pixel_hashes[hashlib.sha256(img_gray.tobytes()).hexdigest()] = cid

                    # Precompute SIFT features
                    kp, des = self.sift.detectAndCompute(img_gray, None)
                    if des is not None and len(kp) > 0:
                        self.sift_bank.append({
                            "case_id": cid,
                            "filename": fname,
                            "is_annotated": is_ann,
                            "kp": kp,
                            "des": des,
                            "shape": (h, w),
                            "box": pair["box"],
                            "pair": pair
                        })

                    # Store clean image for template/SSIM checks
                    if not is_ann:
                        img_512 = cv2.resize(img_gray, (512, 512))
                        self.ref_cases[cid] = {
                            "entry": pair,
                            "img_path": found_path,
                            "img_512": img_512,
                            "img_512_f32": img_512.astype(np.float32) / 255.0,
                            "shape": (h, w),
                            "dhash": self._compute_dhash(img_gray)
                        }

        print(f"[Localization Service] Initialized: {len(self.ref_cases)} reference cases, {len(self.sift_bank)} SIFT feature sets, {len(self.file_hashes)} file hashes.")

    def match_reference(self, image_path: str, predicted_label: str = "FRACTURE") -> Dict[str, Any]:
        """
        Matches an input X-ray image against the verified PDF reference cases.
        Strict Rules:
        - NORMAL images (CASE_03 or normal diagnosis) never receive a fracture bounding box.
        - PDF reference boxes are ONLY assigned if matching is authentic.
        - Any unmatched or novel upload returns UNAVAILABLE without copying or fabricating coordinates.
        Uses:
        1. Exact SHA-256 / MD5 file matching.
        2. Uncompressed bitmap pixel matching.
        3. SIFT feature matching with RANSAC-based geometric transformation (handles resize, crop, rotation, compression).
        4. Multi-metric SSIM / Correlation matching.
        """
        if not os.path.exists(image_path):
            return {
                "has_localization": False,
                "localization_type": "UNAVAILABLE",
                "localization_label": "Fracture localization unavailable",
                "bounding_box": None,
                "source": None,
                "reference_case_id": None,
                "match_score": 0.0,
                "match_method": "NONE",
                "explanation": "Image file not found on server."
            }

        # Step 1: Check Exact File Hash Match (SHA256 & MD5)
        try:
            with open(image_path, "rb") as fp:
                raw_bytes = fp.read()
                file_sha = hashlib.sha256(raw_bytes).hexdigest()
                file_md5 = hashlib.md5(raw_bytes).hexdigest()

            matched_case_from_hash = self.file_hashes.get(file_sha) or self.md5_hashes.get(file_md5)
            if matched_case_from_hash:
                if matched_case_from_hash == "CASE_03":
                    return {
                        "has_localization": False,
                        "localization_type": "NONE_NORMAL",
                        "localization_label": "Normal reference image",
                        "bounding_box": None,
                        "source": "PDF_REFERENCE",
                        "reference_case_id": "CASE_03",
                        "source_pdf_page": 5,
                        "annotated_pdf_page": None,
                        "marking_type": "NONE_NORMAL",
                        "match_score": 1.0,
                        "match_method": "EXACT_FILE_HASH",
                        "explanation": "Exact SHA-256 match to verified clean normal radiograph (PDF Page 5)."
                    }
                elif matched_case_from_hash in self.ref_cases:
                    ann = self.ref_cases[matched_case_from_hash]["entry"]
                    box = ann["box"]
                    return {
                        "has_localization": True,
                        "localization_type": "PDF_REFERENCE",
                        "localization_label": "PDF REFERENCE ANNOTATION – NOT AI DETECTION",
                        "bounding_box": {
                            "x_min": box[0],
                            "y_min": box[1],
                            "x_max": box[2],
                            "y_max": box[3],
                            "width": round(box[2] - box[0], 5),
                            "height": round(box[3] - box[1], 5)
                        },
                        "source": "PDF_REFERENCE",
                        "reference_case_id": matched_case_from_hash,
                        "source_pdf_page": ann.get("source_pdf_page"),
                        "annotated_pdf_page": ann.get("annotated_pdf_page"),
                        "marking_type": ann.get("marking_type"),
                        "match_score": 1.0,
                        "match_method": "EXACT_FILE_HASH",
                        "explanation": f"Exact file hash match to verified reference sample ({matched_case_from_hash})."
                    }
        except Exception as e:
            print(f"[Localization Service] Hash check error: {e}")

        # Step 2: Read image pixels for image-based matching
        query_gray = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
        if query_gray is None:
            return {
                "has_localization": False,
                "localization_type": "UNAVAILABLE",
                "localization_label": "Fracture localization unavailable",
                "bounding_box": None,
                "source": None,
                "reference_case_id": None,
                "match_score": 0.0,
                "match_method": "NONE",
                "explanation": "Could not decode image pixels."
            }

        qh, qw = query_gray.shape

        # Step 3: Check Exact Raw Pixel Hash (Grayscale Bitmap SHA256)
        query_pixel_sha = hashlib.sha256(query_gray.tobytes()).hexdigest()
        matched_case_from_pixel = self.pixel_hashes.get(query_pixel_sha)
        if matched_case_from_pixel:
            if matched_case_from_pixel == "CASE_03":
                return {
                    "has_localization": False,
                    "localization_type": "NONE_NORMAL",
                    "localization_label": "Normal reference image",
                    "bounding_box": None,
                    "source": "PDF_REFERENCE",
                    "reference_case_id": "CASE_03",
                    "source_pdf_page": 5,
                    "annotated_pdf_page": None,
                    "marking_type": "NONE_NORMAL",
                    "match_score": 1.0,
                    "match_method": "EXACT_PIXEL_HASH",
                    "explanation": "Exact uncompressed pixel match to verified clean normal radiograph (PDF Page 5)."
                }
            elif matched_case_from_pixel in self.ref_cases:
                ann = self.ref_cases[matched_case_from_pixel]["entry"]
                box = ann["box"]
                return {
                    "has_localization": True,
                    "localization_type": "PDF_REFERENCE",
                    "localization_label": "PDF REFERENCE ANNOTATION – NOT AI DETECTION",
                    "bounding_box": {
                        "x_min": box[0],
                        "y_min": box[1],
                        "x_max": box[2],
                        "y_max": box[3],
                        "width": round(box[2] - box[0], 5),
                        "height": round(box[3] - box[1], 5)
                    },
                    "source": "PDF_REFERENCE",
                    "reference_case_id": matched_case_from_pixel,
                    "source_pdf_page": ann.get("source_pdf_page"),
                    "annotated_pdf_page": ann.get("annotated_pdf_page"),
                    "marking_type": ann.get("marking_type"),
                    "match_score": 1.0,
                    "match_method": "EXACT_PIXEL_HASH",
                    "explanation": f"Exact uncompressed pixel match to verified reference sample ({matched_case_from_pixel})."
                }

        # Step 4: SIFT Feature Matching with RANSAC-Based Geometric Transformation
        # Handles any resize, cropping, compression, or format conversion!
        try:
            # Memory safety: if query image is large, downscale for SIFT scale-space stability and memory protection
            max_dim = max(qh, qw)
            if max_dim > 1024:
                scale = 1024.0 / max_dim
                scaled_w, scaled_h = int(qw * scale), int(qh * scale)
                small_query = cv2.resize(query_gray, (scaled_w, scaled_h))
                raw_kp, q_des = self.sift.detectAndCompute(small_query, None)
                del small_query
                q_kp = [
                    cv2.KeyPoint(
                        x=float(p.pt[0] / scale),
                        y=float(p.pt[1] / scale),
                        size=float(p.size / scale),
                        angle=float(p.angle),
                        response=float(p.response),
                        octave=int(p.octave),
                        class_id=int(p.class_id)
                    )
                    for p in raw_kp
                ] if raw_kp else []
            else:
                q_kp, q_des = self.sift.detectAndCompute(query_gray, None)
            if q_des is not None and len(q_kp) >= 10:
                best_sift_match = None
                best_inliers = 0
                best_ratio = 0.0
                best_M = None

                for ref in self.sift_bank:
                    matches = self.bf.knnMatch(ref["des"], q_des, k=2)
                    good = []
                    for m_pair in matches:
                        if len(m_pair) == 2 and m_pair[0].distance < 0.75 * m_pair[1].distance:
                            good.append(m_pair[0])

                    if len(good) >= 12:
                        src_pts = np.float32([ref["kp"][m.queryIdx].pt for m in good]).reshape(-1, 1, 2)
                        dst_pts = np.float32([q_kp[m.trainIdx].pt for m in good]).reshape(-1, 1, 2)
                        M, mask = cv2.findHomography(src_pts, dst_pts, cv2.RANSAC, 5.0)
                        if M is not None and mask is not None:
                            inliers = int(np.sum(mask))
                            ratio = inliers / len(good)
                            # Non-degeneracy check on transformation matrix determinant
                            det = float(np.linalg.det(M[:2, :2]))
                            if det > 0.05 and inliers >= 15 and ratio >= 0.35 and inliers > best_inliers:
                                best_inliers = inliers
                                best_ratio = ratio
                                best_sift_match = ref
                                best_M = M

                if best_sift_match is not None:
                    matched_cid = best_sift_match["case_id"]
                    ref_pair = best_sift_match["pair"]

                    if matched_cid == "CASE_03":
                        return {
                            "has_localization": False,
                            "localization_type": "NONE_NORMAL",
                            "localization_label": "Normal reference image",
                            "bounding_box": None,
                            "source": "PDF_REFERENCE",
                            "reference_case_id": "CASE_03",
                            "source_pdf_page": 5,
                            "annotated_pdf_page": None,
                            "marking_type": "NONE_NORMAL",
                            "match_score": round(min(1.0, best_inliers / 500.0), 4),
                            "match_method": "SIFT_RANSAC_GEOMETRIC",
                            "inliers": best_inliers,
                            "inlier_ratio": round(best_ratio, 3),
                            "explanation": f"SIFT-RANSAC geometric match (inliers={best_inliers}, ratio={best_ratio:.2f}) to clean normal radiograph (PDF Page 5)."
                        }

                    # Transform verified bounding box using calculated Homography M
                    ref_box = best_sift_match["box"]
                    rw, rh = best_sift_match["shape"][1], best_sift_match["shape"][0]
                    rx1, ry1 = ref_box[0] * rw, ref_box[1] * rh
                    rx2, ry2 = ref_box[2] * rw, ref_box[3] * rh
                    corners = np.float32([[rx1, ry1], [rx2, ry1], [rx2, ry2], [rx1, ry2]]).reshape(-1, 1, 2)
                    tx_corners = cv2.perspectiveTransform(corners, best_M)

                    xs = tx_corners[:, 0, 0] / qw
                    ys = tx_corners[:, 0, 1] / qh
                    tx_x_min = float(np.clip(np.min(xs), 0.0, 1.0))
                    tx_y_min = float(np.clip(np.min(ys), 0.0, 1.0))
                    tx_x_max = float(np.clip(np.max(xs), 0.0, 1.0))
                    tx_y_max = float(np.clip(np.max(ys), 0.0, 1.0))

                    # Check geometric box validity
                    if (tx_x_max - tx_x_min) >= 0.02 and (tx_y_max - tx_y_min) >= 0.02:
                        return {
                            "has_localization": True,
                            "localization_type": "PDF_REFERENCE",
                            "localization_label": "PDF REFERENCE ANNOTATION – NOT AI DETECTION",
                            "bounding_box": {
                                "x_min": round(tx_x_min, 5),
                                "y_min": round(tx_y_min, 5),
                                "x_max": round(tx_x_max, 5),
                                "y_max": round(tx_y_max, 5),
                                "width": round(tx_x_max - tx_x_min, 5),
                                "height": round(tx_y_max - tx_y_min, 5)
                            },
                            "source": "PDF_REFERENCE",
                            "reference_case_id": matched_cid,
                            "source_pdf_page": ref_pair.get("source_pdf_page"),
                            "annotated_pdf_page": ref_pair.get("annotated_pdf_page"),
                            "marking_type": ref_pair.get("marking_type"),
                            "match_score": round(min(1.0, best_inliers / 500.0), 4),
                            "match_method": "SIFT_RANSAC_GEOMETRIC",
                            "inliers": best_inliers,
                            "inlier_ratio": round(best_ratio, 3),
                            "explanation": f"Reliable SIFT-RANSAC geometric match (inliers={best_inliers}, ratio={best_ratio:.2f}) to reference {matched_cid}."
                        }
        except Exception as e:
            print(f"[Localization Service] SIFT matching error: {e}")

        # Step 5: Multi-Metric Matching for Normalized Copies
        q_512 = cv2.resize(query_gray, (512, 512))
        q_512_f32 = q_512.astype(np.float32) / 255.0
        query_dhash = self._compute_dhash(query_gray)

        best_case = None
        best_corr = -1.0
        best_ssim = -1.0
        best_dist = 64

        for cid, data in self.ref_cases.items():
            ref_512 = data["img_512"]
            ref_512_f32 = data["img_512_f32"]
            corr_score = float(cv2.matchTemplate(q_512, ref_512, cv2.TM_CCOEFF_NORMED)[0][0])
            ssim_score = self._compute_ssim(q_512_f32, ref_512_f32)
            dhash_dist = self._hamming_distance(query_dhash, data["dhash"])

            if corr_score > best_corr:
                best_corr = corr_score
                best_ssim = ssim_score
                best_dist = dhash_dist
                best_case = cid

        is_authentic_match = (
            best_case is not None and (
                (best_corr >= 0.96 and best_ssim >= 0.85) or
                (best_dist <= 3 and best_corr >= 0.94)
            )
        )

        if is_authentic_match:
            if best_case == "CASE_03":
                return {
                    "has_localization": False,
                    "localization_type": "NONE_NORMAL",
                    "localization_label": "Normal reference image",
                    "bounding_box": None,
                    "source": "PDF_REFERENCE",
                    "reference_case_id": "CASE_03",
                    "source_pdf_page": 5,
                    "annotated_pdf_page": None,
                    "marking_type": "NONE_NORMAL",
                    "match_score": round(best_corr, 4),
                    "match_method": "ROBUST_SSIM_CORRELATION",
                    "explanation": f"Robust image match (corr={best_corr:.3f}, SSIM={best_ssim:.3f}) to verified clean normal radiograph."
                }
            elif best_case in self.ref_cases:
                ann = self.ref_cases[best_case]["entry"]
                box = ann["box"]
                return {
                    "has_localization": True,
                    "localization_type": "PDF_REFERENCE",
                    "localization_label": "PDF REFERENCE ANNOTATION – NOT AI DETECTION",
                    "bounding_box": {
                        "x_min": box[0],
                        "y_min": box[1],
                        "x_max": box[2],
                        "y_max": box[3],
                        "width": round(box[2] - box[0], 5),
                        "height": round(box[3] - box[1], 5)
                    },
                    "source": "PDF_REFERENCE",
                    "reference_case_id": best_case,
                    "source_pdf_page": ann.get("source_pdf_page"),
                    "annotated_pdf_page": ann.get("annotated_pdf_page"),
                    "marking_type": ann.get("marking_type"),
                    "match_score": round(best_corr, 4),
                    "match_method": "ROBUST_SSIM_CORRELATION",
                    "explanation": f"Robust image match (corr={best_corr:.3f}, SSIM={best_ssim:.3f}) to verified reference sample ({best_case})."
                }

        # Step 6: Unmatched novel / unseen X-ray
        return {
            "has_localization": False,
            "localization_type": "UNAVAILABLE",
            "localization_label": "Fracture localization unavailable",
            "bounding_box": None,
            "source": None,
            "reference_case_id": None,
            "match_score": round(max(0.0, best_corr), 4),
            "match_method": "NONE",
            "explanation": "Image could not be reliably matched to verified reference cases in wrist_xray_dataset.pdf. Bounding box coordinates are never fabricated for unseen uploads."
        }

    def generate_gradcam_overlay(self, image_path: str, output_filename: Optional[str] = None) -> Optional[str]:
        """
        Generates Grad-CAM attention heatmap from ResNet-18 layer4[-1].
        Properly handles:
        - Target convolutional layer: model.layer4[-1] (final residual block)
        - Feature map dimensions: 512 x 7 x 7
        - Gradient extraction: via PyTorch backward hook
        - Class-specific gradients: fracture class (index 1)
        - Channel importance weights: global average pooling
        - Coordinate alignment after preprocessing:
            1. Upsample 7x7 CAM to 224x224 (crop_dimension)
            2. Place into 256x256 (resize_dimension) canvas at center crop offsets
            3. Bilinear resize canvas to original radiograph dimensions (w_orig, h_orig)
        - Normalization and smooth alpha blending: preserves original radiograph clarity outside attention zones
        - If fracture activation is zero/absent (e.g. Normal cases), leaves original image uncolored.
        """
        try:
            inf_service = get_inference_service()
            model = inf_service.model
            device = inf_service.device
            prep_config = inf_service.prep_config

            resize_dim = prep_config.get("resize_dimension", 256)
            crop_dim = prep_config.get("crop_dimension", 224)
            x_offset = (resize_dim - crop_dim) // 2
            y_offset = (resize_dim - crop_dim) // 2

            gradients = []
            activations = []

            def backward_hook(module, grad_input, grad_output):
                gradients.append(grad_output[0])

            def forward_hook(module, inp, output):
                activations.append(output)

            # Target the last residual block of layer4
            target_layer = model.layer4[-1]
            h_fwd = target_layer.register_forward_hook(forward_hook)
            h_bwd = target_layer.register_full_backward_hook(backward_hook)

            img_pil = Image.open(image_path).convert("RGB")
            w_orig, h_orig = img_pil.size

            transform = transforms.Compose([
                transforms.Resize((resize_dim, resize_dim)),
                transforms.CenterCrop(crop_dim),
                transforms.ToTensor(),
                transforms.Normalize(
                    mean=prep_config["normalization"]["mean"],
                    std=prep_config["normalization"]["std"]
                )
            ])

            input_tensor = transform(img_pil).unsqueeze(0).to(device)
            input_tensor.requires_grad = True
            try:
                model.zero_grad(set_to_none=True)
                logits = model(input_tensor)
                
                # Target fracture class (index 1)
                target_score = logits[0, 1]
                target_score.backward()
            finally:
                # Guaranteed cleanup of hooks even on exception
                try:
                    h_fwd.remove()
                except Exception:
                    pass
                try:
                    h_bwd.remove()
                except Exception:
                    pass
                # Immediately purge all parameter gradients from ResNet-18 to free ~45MB
                model.zero_grad(set_to_none=True)

            if not gradients or not activations:
                return None

            grad = gradients[0].detach().cpu().numpy()[0]
            act = activations[0].detach().cpu().numpy()[0]

            # Free intermediate PyTorch tensor references
            del gradients
            del activations
            del input_tensor
            del logits
            del target_score
            gc.collect()

            weights = np.mean(grad, axis=(1, 2))
            cam = np.zeros(act.shape[1:], dtype=np.float32)
            for i, w in enumerate(weights):
                cam += w * act[i]

            cam = np.maximum(cam, 0)

            # Overlay dimension optimization: keep visualization bounded to 1024 max dimension to prevent RAM spikes
            max_d = max(w_orig, h_orig)
            if max_d > 1024:
                sc = 1024.0 / max_d
                out_w, out_h = int(round(w_orig * sc)), int(round(h_orig * sc))
                img_vis = img_pil.resize((out_w, out_h), Image.Resampling.BILINEAR)
            else:
                out_w, out_h = w_orig, h_orig
                img_vis = img_pil

            orig_cv = cv2.cvtColor(np.array(img_vis), cv2.COLOR_RGB2BGR)

            if cam.max() > 0:
                cam = cam / cam.max()
                # Step 1: Upsample 7x7 CAM to 224x224 crop
                cam_crop = cv2.resize(cam, (crop_dim, crop_dim), interpolation=cv2.INTER_LINEAR)
                # Step 2: Unmap CenterCrop into 256x256 canvas
                canvas_256 = np.zeros((resize_dim, resize_dim), dtype=np.float32)
                canvas_256[y_offset:y_offset + crop_dim, x_offset:x_offset + crop_dim] = cam_crop
                # Step 3: Unmap Resize into visualization image dimensions
                cam_orig = cv2.resize(canvas_256, (out_w, out_h), interpolation=cv2.INTER_LINEAR)
                if cam_orig.max() > 0:
                    cam_orig = cam_orig / cam_orig.max()

                heatmap = cv2.applyColorMap(np.uint8(255 * cam_orig), cv2.COLORMAP_JET)
                # Smooth alpha blending: transparent where CAM is zero, smoothly ramping up
                alpha = 0.50 * (cam_orig[:, :, np.newaxis] ** 0.75)
                blended = ((1.0 - alpha) * orig_cv.astype(np.float32) + alpha * heatmap.astype(np.float32)).astype(np.uint8)
                del heatmap
                del alpha
                del cam_orig
                del canvas_256
                del cam_crop
            else:
                # No positive fracture activation (e.g. Normal case)
                blended = orig_cv.copy()

            del orig_cv
            if img_vis is not img_pil:
                del img_vis
            del img_pil
            gc.collect()

            if not output_filename:
                base_name = os.path.splitext(os.path.basename(image_path))[0]
                output_filename = f"{base_name}_gradcam.png"

            output_path = os.path.join(self.uploads_dir, output_filename)
            cv2.imwrite(output_path, blended)
            del blended
            gc.collect()
            return output_filename
        except Exception as e:
            print(f"[Localization Service] Error generating Grad-CAM: {e}")
            return None

    def generate_reference_heatmap(self, image_path: str, bbox: Dict[str, float], output_filename: Optional[str] = None) -> Optional[str]:
        """
        Generates a soft reference-guided heatmap inside the verified reference bounding box.
        Requirements:
        - Covers the same region as the red rectangle.
        - Uses a smooth red/yellow gradient with transparent edges.
        - Preserves original X-ray visibility.
        - Kept strictly inside the reference bounding box.
        - Aligned with original image dimensions.
        """
        try:
            img_bgr = cv2.imread(image_path)
            if img_bgr is None:
                return None

            H, W = img_bgr.shape[:2]
            max_d = max(H, W)
            if max_d > 1024:
                sc = 1024.0 / max_d
                out_w, out_h = int(round(W * sc)), int(round(H * sc))
                img_bgr = cv2.resize(img_bgr, (out_w, out_h), interpolation=cv2.INTER_LINEAR)
                H, W = out_h, out_w

            x_min, y_min = bbox.get("x_min", 0), bbox.get("y_min", 0)
            x_max, y_max = bbox.get("x_max", 0), bbox.get("y_max", 0)

            x0, y0 = int(round(x_min * W)), int(round(y_min * H))
            x1, y1 = int(round(x_max * W)), int(round(y_max * H))
            x0, y0 = max(0, x0), max(0, y0)
            x1, y1 = min(W, x1), min(H, y1)
            bw = max(1, x1 - x0)
            bh = max(1, y1 - y0)

            # Create 2D elliptical smooth gradient
            y_coords, x_coords = np.ogrid[:bh, :bw]
            cy, cx = bh / 2.0, bw / 2.0
            r2 = ((x_coords - cx) / cx) ** 2 + ((y_coords - cy) / cy) ** 2
            weight = np.clip(1.0 - r2, 0.0, 1.0) ** 1.5

            box_color = np.zeros((bh, bw, 3), dtype=np.float32)
            box_color[:, :, 0] = 0                          # Blue
            box_color[:, :, 1] = 230 * (1.0 - weight * 0.7) # Green (yellow transition)
            box_color[:, :, 2] = 245                        # Red

            alpha = (0.65 * weight)[:, :, np.newaxis]
            crop = img_bgr[y0:y1, x0:x1].astype(np.float32)
            blended_crop = (1.0 - alpha) * crop + alpha * box_color
            img_bgr[y0:y1, x0:x1] = np.clip(blended_crop, 0, 255).astype(np.uint8)

            del crop
            del blended_crop
            del box_color
            del alpha
            del weight

            # Red rectangular boundary around the verified region
            cv2.rectangle(img_bgr, (x0, y0), (x1, y1), (0, 0, 230), 2)

            if not output_filename:
                base_name = os.path.splitext(os.path.basename(image_path))[0]
                output_filename = f"{base_name}_ref_heatmap.png"

            output_path = os.path.join(self.uploads_dir, output_filename)
            cv2.imwrite(output_path, img_bgr)
            del img_bgr
            gc.collect()
            return output_filename
        except Exception as e:
            print(f"[Localization Service] Error generating reference heatmap: {e}")
            return None

_localization_instance = None
_localization_init_lock = threading.Lock()

def get_localization_service() -> LocalizationService:
    global _localization_instance
    if _localization_instance is None:
        with _localization_init_lock:
            if _localization_instance is None:
                _localization_instance = LocalizationService()
    return _localization_instance

def generate_sift_cache(output_path: Optional[str] = None) -> str:
    """
    Utility function called during Docker build or setup to precompute and persist
    SIFT keypoints and descriptors for all reference cases into a compressed NPZ archive.
    This eliminates SIFT scale-space pyramid runtime allocation, cutting container startup RSS by >360MB.
    """
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
    raw_dir = os.path.join(base_dir, "data", "raw")
    target_cache = output_path or os.path.join(base_dir, "data", "sift_reference_cache.npz")

    reference_pairs = [
        {
            "case_id": "CASE_01",
            "clean_file": "page_01_xref_5.png",
            "ann_file": "page_02_xref_9.png",
            "source_pdf_page": 1,
            "annotated_pdf_page": 2,
            "marking_type": "RED_RECTANGLE",
            "box": [0.37045, 0.39460, 0.67077, 0.52097]
        },
        {
            "case_id": "CASE_02",
            "clean_file": "page_03_xref_12.png",
            "ann_file": "page_04_xref_15.png",
            "source_pdf_page": 3,
            "annotated_pdf_page": 4,
            "marking_type": "RED_RECTANGLE",
            "box": [0.32515, 0.41418, 0.58317, 0.54965]
        },
        {
            "case_id": "CASE_03",
            "clean_file": "page_05_xref_18.png",
            "ann_file": None,
            "source_pdf_page": 5,
            "annotated_pdf_page": None,
            "marking_type": "NONE_NORMAL",
            "box": None
        },
        {
            "case_id": "CASE_04",
            "clean_file": "page_06_xref_21.png",
            "ann_file": "page_07_xref_24.png",
            "source_pdf_page": 6,
            "annotated_pdf_page": 7,
            "marking_type": "RED_RECTANGLE",
            "box": [0.30577, 0.47628, 0.51496, 0.56615]
        },
        {
            "case_id": "CASE_05",
            "clean_file": "page_08_xref_27.png",
            "ann_file": "page_09_xref_30.png",
            "source_pdf_page": 8,
            "annotated_pdf_page": 9,
            "marking_type": "RED_DASHED_CIRCLE",
            "box": [0.32447, 0.43785, 0.45839, 0.53867]
        }
    ]

    sift = cv2.SIFT_create(nfeatures=2000)
    data_dict = {}
    meta_list = []
    hashes_dict = {
        "file_hashes": {},
        "md5_hashes": {},
        "pixel_hashes": {},
        "dhashes": {}
    }

    def compute_dhash(img_gray, hash_size=8):
        resized = cv2.resize(img_gray, (hash_size + 1, hash_size))
        diff = resized[:, 1:] > resized[:, :-1]
        val = 0
        for bit in diff.flatten():
            val = (val << 1) | int(bit)
        return val

    idx = 0
    search_dirs = [raw_dir, os.path.join(base_dir, "extracted_pages")]
    for pair in reference_pairs:
        cid = pair["case_id"]
        for is_ann, fname in [(False, pair["clean_file"]), (True, pair["ann_file"])]:
            if not fname:
                continue
            found_path = None
            for sdir in search_dirs:
                cand = os.path.join(sdir, fname)
                if os.path.exists(cand):
                    found_path = cand
                    break
            if not found_path:
                continue

            with open(found_path, "rb") as fp:
                content = fp.read()
                hashes_dict["file_hashes"][hashlib.sha256(content).hexdigest()] = cid
                hashes_dict["md5_hashes"][hashlib.md5(content).hexdigest()] = cid

            img_gray = cv2.imread(found_path, cv2.IMREAD_GRAYSCALE)
            h, w = img_gray.shape
            hashes_dict["pixel_hashes"][hashlib.sha256(img_gray.tobytes()).hexdigest()] = cid

            kp, des = sift.detectAndCompute(img_gray, None)
            kp_arr = np.array([[p.pt[0], p.pt[1], p.size, p.angle, p.response, p.octave, p.class_id] for p in kp], dtype=np.float32)

            data_dict[f"kp_{idx}"] = kp_arr
            data_dict[f"des_{idx}"] = des
            data_dict[f"shape_{idx}"] = np.array([h, w], dtype=np.int32)
            meta_list.append({
                "idx": idx,
                "case_id": cid,
                "filename": fname,
                "is_annotated": is_ann,
                "box": pair["box"],
                "pair": pair
            })

            if not is_ann:
                img_512 = cv2.resize(img_gray, (512, 512))
                data_dict[f"img512_{cid}"] = img_512
                hashes_dict["dhashes"][cid] = compute_dhash(img_gray)

            idx += 1

    data_dict["metadata_json"] = np.array([json.dumps({"items": meta_list, "hashes": hashes_dict, "pairs": reference_pairs})])
    os.makedirs(os.path.dirname(target_cache), exist_ok=True)
    np.savez_compressed(target_cache, **data_dict)
    print(f"[Localization Service] Saved compressed SIFT cache to '{target_cache}' ({os.path.getsize(target_cache)} bytes).")
    return target_cache

