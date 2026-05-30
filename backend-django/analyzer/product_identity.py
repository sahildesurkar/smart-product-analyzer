
import re
import logging
from thefuzz import fuzz
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

logger = logging.getLogger(__name__)

# --- CONFIG ---
MATCH_THRESHOLD = 45  # Lowered as per requirement

STOPWORDS = [
    "online", "flipkart", "amazon", "myntra", "buy", "best", "price", 
    "storage", "ram", "gb", "mobile", "smartphone", "phone", "com", "at",
    "india", "latest", "trending", "new", "free", "shipping", "delivery", 
    "warranty", "original", "authentic", "official", "sale", "offer"
]

BRANDS = {
    'apple', 'samsung', 'oneplus', 'realme', 'vivo', 'oppo', 'xiaomi', 
    'redmi', 'google', 'motorola', 'poco', 'nothing', 'asus', 'sony', 
    'boat', 'noise', 'jbl', 'bose', 'hp', 'dell', 'lenovo', 'acer', 
    'lg', 'huawei', 'honor', 'nike', 'adidas', 'puma', 'reebok',
    'kalini', 'biba', 'libas', 'sangria', 'anubhutee', 'w', 'manyavar', 'iqoo', 'lavender'
}

# --- 1. PREPROCESSING & CLEANING ---

def clean_text(text: str) -> str:
    """Robust cleaning for identity extraction."""
    if not text: return ""
    # Remove text like 'realme narzo 80 lite 5g (128 gb storage, 4 gb ram) on flipkart.com'
    t = text.lower()
    t = re.sub(r'\.com|\.in|\.net', '', t)
    t = re.sub(r'[^a-z0-9\s.]', ' ', t)
    
    words = t.split()
    # Remove noise words and platform names
    clean_words = [w for w in words if w not in STOPWORDS and len(w) > 1]
    
    t = " ".join(clean_words)
    t = re.sub(r'(\d+)\s*gb', r'\1gb', t)
    t = re.sub(r'(\d+)\s*ram', r'\1ram', t)
    return t.strip()

# --- 2. CATEGORY CLASSIFIER ---

def detect_category(title: str) -> str:
    """Automatic category detection."""
    t = title.lower()
    if any(k in t for k in ["iphone", "realme", "samsung", "pixel", "5g", "phone", "mobile", "smartphone", "iqoo"]):
        return "mobile"
    if any(k in t for k in ["shirt", "dress", "saree", "kurta", "kurti", "jeans", "tshirt", "ethnic", "top", "leggings"]):
        return "fashion"
    if any(k in t for k in ["earbuds", "headphones", "bluetooth", "tws", "buds", "neckband"]):
        return "headphone"
    if any(k in t for k in ["laptop", "notebook", "macbook", "thinkpad"]):
        return "laptop"
    return "general"

# --- 3. IDENTITY EXTRACTION ---

def extract_product_identity(title: str) -> dict:
    """Dedicated AI/NLP identity extractor."""
    clean = clean_text(title)
    words = clean.split()
    
    identity = {
        "brand": "unknown",
        "model": "unknown",
        "storage": None,
        "ram": None,
        "network": None,
        "category": detect_category(title),
        "original_clean": clean
    }
    
    # Extract Brand
    for b in sorted(BRANDS, key=len, reverse=True):
        if re.search(r'\b' + re.escape(b) + r'\b', clean):
            identity["brand"] = b
            break
            
    # Extract Specs (Regex)
    gb_matches = re.findall(r'(\d+)\s*gb\b', clean)
    if gb_matches:
        nums = [int(n) for n in gb_matches]
        if len(nums) >= 2:
            identity["ram"] = f"{min(nums)}gb"
            identity["storage"] = f"{max(nums)}gb"
        else:
            if nums[0] <= 16: identity["ram"] = f"{nums[0]}gb"
            else: identity["storage"] = f"{nums[0]}gb"
            
    if '5g' in clean: identity["network"] = "5g"
    elif '4g' in clean: identity["network"] = "4g"
    
    # Extract Model (Greedy after brand)
    if identity["brand"] != "unknown" and identity["brand"] in words:
        brand_idx = words.index(identity["brand"])
        model_parts = []
        for w in words[brand_idx+1:]:
            # Stop if we hit specs or noise
            if any(x in w for x in ['gb', 'ram', '5g', '4g', 'storage']): break
            model_parts.append(w)
            if len(model_parts) >= 4: break # Allow slightly longer models like 'narzo 80 lite'
        if model_parts:
            identity["model"] = " ".join(model_parts)
    else:
        # Fallback: take first 3 words that aren't brand
        identity["model"] = " ".join([w for w in words[:3] if w != identity["brand"]])

    return identity

# --- 4. SEMANTIC SIMILARITY ---

def get_semantic_similarity(t1: str, t2: str) -> float:
    """TF-IDF Cosine Similarity."""
    try:
        vectorizer = TfidfVectorizer().fit_transform([t1, t2])
        vectors = vectorizer.toarray()
        return float(cosine_similarity(vectors)[0][1]) * 100
    except:
        return 0.0

# --- 5. HYBRID SCORING ENGINE ---

def calculate_advanced_similarity(target_title: str, cand_title: str) -> dict:
    """
    Weighted AI Scoring:
    40% -> model match (Token Overlap + Fuzzy)
    30% -> brand match
    20% -> specs match
    10% -> semantic similarity
    """
    t_id = extract_product_identity(target_title)
    c_id = extract_product_identity(cand_title)
    
    # Category Guard (Ignore Fashion if Target is Mobile)
    if t_id["category"] == "mobile" and c_id["category"] == "fashion":
        return {"score": 0, "match": False, "reason": "Category Guard: Mobile vs Fashion"}

    # 1. Brand Score (30%)
    brand_score = 0
    if t_id["brand"] == c_id["brand"] and t_id["brand"] != "unknown":
        brand_score = 30
    
    # 2. Model Score (40%)
    target_model = t_id["model"]
    candidate_model = c_id["model"]
    
    t_tokens = set(target_model.split())
    c_tokens = set(candidate_model.split())
    
    # Token Overlap Calculation
    overlap_tokens = t_tokens & c_tokens
    overlap_ratio = len(overlap_tokens) / len(t_tokens) if t_tokens else 0
    
    # Fuzzy Partial Match
    fuzzy_sim = fuzz.partial_ratio(target_model, candidate_model)
    
    # Combine Overlap and Fuzzy
    model_sim = (overlap_ratio * 70) + (fuzzy_sim * 0.3)
    model_score = (model_sim / 100) * 40
    
    # Limit score to 40
    model_score = min(40, model_score)

    # 3. Spec Score (20%)
    spec_points = 0
    total_specs = 0
    if t_id["storage"]:
        total_specs += 1
        if t_id["storage"] == c_id["storage"]: spec_points += 1
    if t_id["ram"]:
        total_specs += 1
        if t_id["ram"] == c_id["ram"]: spec_points += 1
    if t_id["network"]:
        total_specs += 1
        if t_id["network"] == c_id["network"]: spec_points += 1
    
    spec_score = (spec_points / total_specs * 20) if total_specs > 0 else 10
    
    # 4. Semantic Score (10%)
    semantic_sim = get_semantic_similarity(t_id["original_clean"], c_id["original_clean"])
    semantic_score = (semantic_sim / 100) * 10
    
    final_score = float(brand_score + model_score + spec_score + semantic_score)
    
    # Threshold for mobiles is 45
    current_threshold = 45 if t_id["category"] == "mobile" else 55
    is_match = bool(final_score >= current_threshold)
    
    # Debug Logging as requested
    print("-" * 40)
    print("TARGET MODEL:", target_model)
    print("CANDIDATE MODEL:", candidate_model)
    print("MODEL TOKENS OVERLAP:", overlap_tokens)
    print("BRAND SCORE:", brand_score)
    print("MODEL SCORE:", round(model_score, 2))
    print("FINAL SCORE:", round(final_score, 2))
    print("MATCH:", is_match)
    print("-" * 40)
    
    return {
        "score": round(final_score, 2),
        "match": is_match,
        "brand_score": brand_score,
        "model_score": model_score,
        "spec_score": spec_score,
        "semantic_score": semantic_score,
        "target_id": t_id,
        "cand_id": c_id
    }

def compare_identities(target_id: dict, cand_id: dict, target_price=0, cand_price=0):
    """Bridge for existing API calls."""
    # This is a bit of a shim to support existing code structure
    # but we will primarily use calculate_advanced_similarity for the new engine
    res = calculate_advanced_similarity(target_id.get('original_title', ''), cand_id.get('original_title', ''))
    return res["match"], res["score"], "AI Match" if res["match"] else "Weak Match"

def generate_optimized_query(identity: dict) -> str:
    """Build a clean, minimal search query."""
    parts = []
    if identity.get("brand") and identity["brand"] != "unknown":
        parts.append(identity["brand"])
    if identity.get("model") and identity["model"] != "unknown":
        parts.append(identity["model"])
    if identity.get("storage"):
        parts.append(identity["storage"])
    
    query = " ".join(parts).lower()
    return query if len(parts) >= 2 else identity.get("original_clean", "")[:50]

def is_accessory(title: str) -> bool:
    """Detect accessories to prevent contamination."""
    ACCESSORIES = ["cover", "case", "tempered glass", "screen protector", "pouch", "strap", "charger", "cable"]
    t = title.lower()
    return any(a in t for a in ACCESSORIES)
