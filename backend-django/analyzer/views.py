from django.http import JsonResponse, StreamingHttpResponse
from django.views.decorators.csrf import csrf_exempt
import json
import random
import re
import datetime
from django.core.cache import cache
from .search_scraper import get_real_time_products as get_search_results, get_real_time_products_stream as get_search_results_stream, get_real_time_products
from .analyze_scraper import scrape_direct_link
from .compare_scraper import scrape_all_platforms_for_comparison
print("[DEBUG] Dual-Scraper Architecture Loaded (Search + Analyze)")
from .models import PriceAlert, SearchHistory, PriceHistory
from .ai_engine import predict_future_prices
from .product_identity import extract_product_identity, generate_optimized_query, calculate_advanced_similarity, is_accessory

def process_cross_platform_results(results, target_title, target_price=0):
    """
    Intelligently maps products using Advanced AI Weighted Scoring.
    """
    if not target_title:
        return results

    # 1. Pre-extract target identity
    target_id = extract_product_identity(target_title)
    target_is_acc = is_accessory(target_title)
    
    unique_matches = {}
    print(f"\n{'='*60}")
    print(f"[AI MATCHING ENGINE] Target: '{target_title[:50]}...'")
    print(f"[AI MATCHING ENGINE] Identity: {target_id}")
    print(f"{'='*60}")
    
    for item in results:
        title = item.get('title', '')
        source = item.get('source', 'Unknown')
        url = item.get('url')
        
        # URL Safety Check
        if not url:
            print(f"[REJECT] Missing URL for product: {title[:30]}")
            continue
            
        print(f"PRODUCT URL: {url}")
        
        # Accessory Guard
        if not target_is_acc and is_accessory(title):
            continue
            
        # 2. Multi-Layer AI Comparison
        match_res = calculate_advanced_similarity(target_title, title)
        
        similarity = match_res["score"]
        is_match = match_res["match"]
        
        if not is_match:
            continue

        item['similarity_score'] = similarity
        item['match_reason'] = "AI Match" if similarity > 80 else "Good Match"
        item['id_hash'] = f"{match_res['cand_id'].get('brand')}-{match_res['cand_id'].get('model')}-{match_res['cand_id'].get('storage')}".lower()
        
        # 3. Intelligent Deduplication
        # Key: Source + Identity Hash + Canonical URL
        clean_url = item['url'].split('?')[0].split('ref=')[0].strip().lower()
        dedupe_key = f"{source.lower()}-{item['id_hash']}-{clean_url}"
        
        if dedupe_key not in unique_matches:
            unique_matches[dedupe_key] = item
            print(f"  [MATCH][{source}] {title[:40]}... ({similarity}%)")
        else:
            if similarity > unique_matches[dedupe_key]['similarity_score']:
                unique_matches[dedupe_key] = item
                
    # 4. Standardize & Sort
    final_results = []
    for item in unique_matches.values():
        final_results.append({
            "title": item.get('title'),
            "price": item.get('price'),
            "platform": item.get('source'),
            "rating": item.get('rating', '4.2'),
            "image": item.get('image_url') or item.get('image'),
            "url": item.get('url'),
            "similarity": float(item.get('similarity_score', 0)),
            "match_reason": str(item.get('match_reason', 'Match'))
        })

    if not final_results:
        print("[AI MATCHING ENGINE] No valid matches found.")
        return []

    # Sort: Similarity DESC, Price ASC
    final_results.sort(key=lambda x: (-x['similarity'], x['price']))

    # Tag Cheapest and Best Match
    valid_prices = [x['price'] for x in final_results if x['price'] > 0]
    min_price = min(valid_prices) if valid_prices else 0
    max_sim = max([x['similarity'] for x in final_results], default=0)

    for item in final_results:
        item['is_cheapest'] = (min_price > 0 and item['price'] <= min_price)
        item['is_best_match'] = (item['similarity'] >= max_sim and item['similarity'] >= 85)

    print(f"\n[AI MATCHING ENGINE] Completed. Mapped {len(final_results)} products.")
    print(f"{'='*60}\n")
    return final_results

def save_product_and_history(p_data, category="General"):
    """Helper to record product price history without using Product collection."""
    try:
        import hashlib
        # Title Normalization
        normalized = re.sub(r'\s+', ' ', p_data['title'].lower().strip())
        price_val = float(p_data['price']) if p_data['price'] else 0.0

        # Generate a stable ID based on URL
        p_id = hashlib.md5(p_data['url'].encode()).hexdigest()
        p_data['id'] = p_id
        
        # Record Price History
        PriceHistory(
            product_id=p_id,
            product_title=p_data['title'],
            normalized_title=normalized,
            product_url=p_data['url'],
            image_url=p_data.get('image_url') or p_data.get('image', ''),
            price=price_val,
            source=p_data['source']
        ).save()
    except Exception as e:
        print(f"Error saving product history: {e}")
    return p_data


# Advanced analyze_product_link is defined further down with smart matching.
@csrf_exempt
def debug_search(request):
    """RAW DEBUG API: No cache, no filters, live scraping only"""
    query = request.GET.get('q', '').strip()
    print(f"\n[DEBUG] === DEBUG SEARCH START: '{query}' ===")
    if not query:
        return JsonResponse({"error": "No query provided"}, status=400)
    
    try:
        print(f"[DEBUG] Calling get_search_results for: {query}")
        results = get_search_results(query)
        
        print(f"[DEBUG] Scraper returned {len(results)} total items.")
        return JsonResponse({
            "success": True,
            "query": query,
            "count": len(results),
            "products": results
        })
    except Exception as e:
        print(f"[DEBUG] CRITICAL ERROR: {e}")
        import traceback
        traceback.print_exc()
        return JsonResponse({"success": false, "error": str(e)}, status=500)

@csrf_exempt
def search_products(request):
    """
    REAL-TIME SEARCH API (DEBUG MODE: CACHE DISABLED)
    """
    if request.method != "GET":
        return JsonResponse({"error": "Only GET requests are allowed"}, status=405)

    query = request.GET.get('q', '').strip()
    is_stream = request.GET.get('stream', 'false').lower() == 'true'
    
    if not query:
        return JsonResponse({"products": []})

    # [DEBUG] CACHE FULLY DISABLED AS REQUESTED
    cache_key = f"search_{query.replace(' ', '_')}"
    print(f"\n[DEBUG] API Hit: /search/ | Query: '{query}' | Stream: {is_stream}")

    if is_stream:
        def event_stream():
            try:
                print(f"[DEBUG] Stream starting for: {query}")
                for packet in get_search_results_stream(query):
                    # Ensure each chunk is a single line starting with "data: "
                    yield f"data: {json.dumps(packet)}\n\n"
                print(f"[DEBUG] Stream completed for: {query}")
            except Exception as e:
                print(f"[DEBUG] Stream Error: {e}")
                error_packet = {"type": "error", "message": str(e)}
                yield f"data: {json.dumps(error_packet)}\n\n"
        
        return StreamingHttpResponse(event_stream(), content_type='text/event-stream')
    else:
        print(f"[DEBUG] Blocking search starting for: {query}")
        try:
            results = get_search_results(query)
            print(f"[DEBUG] Blocking search finished. Found {len(results)} items.")
            return JsonResponse({"success": True, "products": results})
        except Exception as e:
            print(f"[DEBUG] Blocking search FAILED: {e}")
            return JsonResponse({"success": False, "products": [], "error": str(e)}, status=500)

@csrf_exempt
def get_products_by_category(request):
    """Returns products filtered by category with fresh-first real-time scraping"""
    category = request.GET.get('category')
    if not category:
        return JsonResponse({"error": "Category parameter is required"}, status=400)
    
    cache_key = f"cat_{category.lower()}"
    cached_data = cache.get(cache_key)
    
    try:
        # Prioritize Fresh Scrape
        print(f"[Category] Fetching fresh results for: {category}")
        
        # Map categories to search keywords for better results
        category_keywords = {
            "Electronics": "Latest Smartphones and Laptops",
            "Fashion": "Trending Men Women Clothing",
            "Shoes": "Branded Sneakers and Running Shoes",
            "Books": "Bestselling Novels and Books",
            "Furniture": "Modern Home Furniture",
            "Beauty": "Skincare and Beauty Products",
            "Home Appliances": "Kitchen and Home Appliances"
        }
        
        search_query = category_keywords.get(category, category)
        results = get_real_time_products(search_query, filter_relevance=False)
        
        if not results and cached_data:
            print(f"[Fallback] Category scrape failed. Using cache.")
            results = cached_data
        elif results:
            # TTL 15 minutes for categories
            cache.set(cache_key, results, 900)
            
        return JsonResponse({"products": results})
    except Exception as e:
        print(f"[Error] Category fetch failed: {e}")
        return JsonResponse({"products": cached_data or []})


@csrf_exempt
def set_price_alert(request):
    """Sets a price alert for a product"""
    if request.method != "POST":
        return JsonResponse({"error": "POST method required"}, status=405)
    
    try:
        data = json.loads(request.body)
        raw_price = data.get('current_price')
        cleaned_price = clean_price(str(raw_price))
        
        # 1. Save Alert
        alert = PriceAlert(
            product_title=data.get('title'),
            current_price=cleaned_price,
            target_price=data.get('target_price'),
            user_email=data.get('email'),
            image_url=data.get('image'),
            product_url=data.get('url')
        )
        alert.save()

        # 2. Save Product History for recommendation engine fuel
        try:
            save_product_and_history({
                'title': data.get('title'),
                'price': cleaned_price,
                'image_url': data.get('image'),
                'source': data.get('source', 'Unknown'),
                'url': data.get('url')
            }, category=data.get('category', 'General'))
        except Exception as e:
            print(f"Product Track Save error: {e}")

        return JsonResponse({"status": "success", "message": "Price alert set successfully!"})
    except Exception as e:
        return JsonResponse({"status": "error", "message": str(e)}, status=500)

@csrf_exempt
def get_user_alerts(request, user_id):
    """Returns alerts for a specific user email"""
    alerts = PriceAlert.objects(user_email='user@example.com') # Using mock email for demo
    return JsonResponse([{
        "id": str(a.id),
        "product_title": a.product_title,
        "current_price": a.current_price,
        "target_price": float(a.target_price),
        "image_url": a.image_url,
        "product_url": a.product_url,
        "is_active": a.is_active
    } for a in alerts], safe=False)

@csrf_exempt
def compare_products(request):
    """Returns products of the same category for comparison"""
@csrf_exempt
def get_home_products(request):
    """Fetches recently analyzed products for the homepage"""
    category = request.GET.get('category', 'Electronics')
    # Get unique products by normalized_title from PriceHistory
    history = PriceHistory.objects().order_by('-timestamp')[:20]
    
    unique_products = {}
    for p in history:
        if p.normalized_title not in unique_products:
            unique_products[p.normalized_title] = p
            if len(unique_products) >= 10: break

    return JsonResponse([{
        "title": p.product_title,
        "price": float(p.price),
        "source": p.source,
        "rating": "4.2",
        "image": p.image_url
    } for p in unique_products.values()], safe=False)

@csrf_exempt
def get_product_details(request, product_id):
    """Fetches product details from PriceHistory by ID"""
    try:
        p = PriceHistory.objects.get(id=product_id)
        return JsonResponse({
            "id": str(p.id),
            "title": p.product_title,
            "price": float(p.price),
            "image_url": p.image_url,
            "rating": "4.2",
            "source": p.source,
            "category": "General",
            "description": "Real-time product details",
            "url": p.product_url
        })
    except Exception as e:
        # If ID not found, return dummy or error
        return JsonResponse({"error": str(e)}, status=404)

from difflib import SequenceMatcher

def clean_product_title(title):
    """Clean product title using NLP-like regex to remove fluff and extract core identity"""
    if not title: return ""
    
    # Remove special characters and noise
    title = re.sub(r'[^\w\s]', ' ', title)
    
    # Fluff words to remove
    fluff = [
        r'\blatest\b', r'\bbest\b', r'\bsale\b', r'\boffer\b', r'\btrending\b',
        r'\bbuy\b', r'\bonline\b', r'\bprice\b', r'\bindia\b', r'\bfree\b',
        r'\bshipping\b', r'\boffers\b', r'\bdeals\b', r'\bstock\b', r'\bbrand\b',
        r'\bnew\b', r'\bmodel\b', r'\bofficial\b', r'\bstore\b'
    ]
    
    clean = title.lower()
    for word in fluff:
        clean = re.sub(word, '', clean)
        
    # Remove extra whitespace
    clean = ' '.join(clean.split())
    
    # Limit to core tokens (usually first 4-6 words contain brand + model + specs)
    tokens = clean.split()
    return ' '.join(tokens[:6])

def get_similarity(s1, s2):
    """Improved similarity check using token-based overlap and SequenceMatcher"""
    if not s1 or not s2: return 0
    s1, s2 = s1.lower(), s2.lower()
    
    # 1. Sequence Matcher Score
    seq_score = SequenceMatcher(None, s1, s2).ratio()
    
    # 2. Token Overlap Score
    t1 = set(re.findall(r'\w+', s1))
    t2 = set(re.findall(r'\w+', s2))
    if not t1: return 0
    overlap = len(t1.intersection(t2)) / len(t1)
    
    # Weighted average: prioritize token overlap
    final_score = (overlap * 0.7) + (seq_score * 0.3)
    return final_score

@csrf_exempt
def analyze_product_link(request):
    """Analyzes a product link with SMART matching and Cross-platform search"""
    if request.method != "POST":
        return JsonResponse({"error": "POST method required"}, status=405)
    
    try:
        data = json.loads(request.body)
        url = data.get('url', '')
        print("\n==================================================")
        print("[ANALYZE START]")
        print(f"[URL RECEIVED] {url}")
        
        # Step 1: Scrape original product
        direct_product = scrape_direct_link(url)
        
        if not direct_product:
            print("[ANALYZE FAILED] Could not extract data from link.")
            return JsonResponse({"status": "error", "message": "Could not extract data from this link."}, status=404)

        original_title = direct_product['title']
        print(f"[PLATFORM DETECTED] {direct_product['source']}")
        
        # Step 2: Structured Identity Extraction & Query Optimization
        identity = extract_product_identity(original_title)
        smart_query = generate_optimized_query(identity)
        
        if not smart_query:
            smart_query = original_title[:50]
            
        print(f"[IDENTITY EXTRACTED] {identity}")
        print(f"Smart Search Query: {smart_query}")
        print("[COMPARISON START]")

        # Step 2.5: Save to Search History for Personalization
        try:
            SearchHistory.objects.create(
                user_id=data.get('user_id', 'guest'),
                query=smart_query,
                category=identity.get('category', 'General')
            )
        except: pass
        
        # Step 3: Search all 4 platforms using the dedicated comparison scraper
        print(f"[COMPARISON START] Query: '{smart_query}'")
        raw_results = scrape_all_platforms_for_comparison(smart_query)
        
        # Step 4: Intelligent Similarity Matching & Validation
        target_price_val = float(re.sub(r'[^\d.]', '', str(direct_product['price'])) or 0)
        comparisons = process_cross_platform_results(raw_results, original_title, target_price_val)
        
        # Filter out the original URL if it somehow appeared in search results
        comparisons = [c for c in comparisons if c['url'].split('?')[0].lower() != url.split('?')[0].lower()]
        
        # Step 5: Best Price Detection
        if comparisons:
            # Sort by price
            comparisons.sort(key=lambda x: float(re.sub(r'[^\d.]', '', str(x['price'])) or 0))
            
            # Detect best price among results + original
            all_options = comparisons + [{
                "price": direct_product['price'],
                "source": direct_product['source']
            }]
            
            try:
                min_price = min([float(re.sub(r'[^\d.]', '', str(x['price'])) or float('inf')) for x in all_options])
                for c in comparisons:
                    current_p = float(re.sub(r'[^\d.]', '', str(c['price'])) or 0)
                    c['is_best_price'] = (current_p <= min_price)
            except: pass
            
        print(f"[MATCH FOUND] {len(comparisons)} similar products located.")
        print("[ANALYZE SUCCESS]")
        print("==================================================\n")

        return JsonResponse({
            "status": "success",
            "details": {
                "title": original_title,
                "price": direct_product['price'],
                "image_url": direct_product.get('image_url') or direct_product.get('image'),
                "rating": direct_product['rating'],
                "source": direct_product['source'],
                "url": url,
                "identity": {k: v for k, v in identity.items()
                             if k not in ('keywords', 'original_title')},
                "is_original": True
            },
            "matched_products": comparisons[:10]
        })
            
    except Exception as e:
        print(f"[ANALYZE FAILED] Error: {e}")
        print("==================================================\n")
        return JsonResponse({"status": "error", "message": str(e)}, status=500)


# Stubs for other endpoints
from .models import PriceAlert, SearchHistory, ActionLog, PriceHistory

@csrf_exempt
def log_user_action(request):
    """API to track user clicks, views, and compares for AI analysis."""
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            ActionLog.objects.create(
                user_id=data.get("user_id", "guest"),
                action_type=data.get("action_type"),
                product_id=data.get("product_id"),
                category=data.get("category", "General")
            )
            return JsonResponse({"status": "success"})
        except Exception as e:
            return JsonResponse({"status": "error", "message": str(e)}, status=400)
    return JsonResponse({"status": "error"}, status=405)

@csrf_exempt
@csrf_exempt
def get_recommendations(request, user_id):
    """
    SMART RECOMMENDATIONS using PriceHistory:
    1. Fetch recently analyzed products from history.
    """
    try:
        # Get latest distinct products from PriceHistory
        history_objs = PriceHistory.objects().order_by('-timestamp')
        
        seen_titles = set()
        recommendations = []
        
        for p in history_objs:
            if p.normalized_title not in seen_titles:
                recommendations.append({
                    "id": p.product_id,
                    "title": p.product_title,
                    "price": float(p.price),
                    "image": p.image_url or "https://via.placeholder.com/200",
                    "rating": "4.2",
                    "source": p.source,
                    "url": p.product_url
                })
                seen_titles.add(p.normalized_title)
            
            if len(recommendations) >= 20:
                break

        random.shuffle(recommendations)
        return JsonResponse({"status": "success", "recommendations": recommendations})
    except Exception as e:
        print(f"Rec Error: {e}")
        return JsonResponse({"status": "success", "recommendations": []})

@csrf_exempt
def save_search_history(request): return JsonResponse({"status": "success"})

@csrf_exempt
def toggle_price_alert(request, alert_id):
    try:
        # MongoEngine handles string to ObjectID conversion automatically
        alert = PriceAlert.objects.get(id=alert_id)
        alert.is_active = not alert.is_active
        alert.save()
        return JsonResponse({"status": "success", "is_active": alert.is_active})
    except PriceAlert.DoesNotExist:
        return JsonResponse({"status": "error", "message": "Alert not found"}, status=404)
    except Exception as e:
        return JsonResponse({"status": "error", "message": str(e)}, status=500)

@csrf_exempt
def update_price_alert(request, alert_id):
    if request.method != "PUT":
        return JsonResponse({"error": "PUT method required"}, status=405)
    try:
        data = json.loads(request.body)
        alert = PriceAlert.objects.get(id=alert_id)
        alert.target_price = data.get('target_price')
        alert.save()
        return JsonResponse({"status": "success"})
    except PriceAlert.DoesNotExist:
        return JsonResponse({"status": "error", "message": "Alert not found"}, status=404)
    except Exception as e:
        return JsonResponse({"status": "error", "message": str(e)}, status=500)

@csrf_exempt
def delete_price_alert(request, alert_id):
    if request.method != "DELETE":
        return JsonResponse({"error": "DELETE method required"}, status=405)
    try:
        alert = PriceAlert.objects.get(id=alert_id)
        alert.delete()
        return JsonResponse({"status": "success"})
    except PriceAlert.DoesNotExist:
        return JsonResponse({"status": "error", "message": "Alert not found"}, status=404)
    except Exception as e:
        return JsonResponse({"status": "error", "message": str(e)}, status=500)
def generate_simulated_history(base_price):
    """Generates a realistic 7-day price history based on current price"""
    import datetime
    history = []
    
    # Robust price cleaning and fallback
    try:
        if isinstance(base_price, str):
            base_price = float(re.sub(r'[^\d.]', '', base_price))
        else:
            base_price = float(base_price)
    except:
        base_price = 0

    # Ensure we don't simulate a 0-price history (looks broken in UI)
    if base_price <= 0:
        base_price = 5000 # Dummy realistic price for empty states

    for i in range(7, -1, -1):
        date = (datetime.datetime.now() - datetime.timedelta(days=i)).strftime('%Y-%m-%d')
        # Random fluctuation +/- 5% to look realistic
        variation = random.uniform(0.92, 1.08)
        price = round(base_price * variation, 2)
        history.append({"date": date, "price": price})
    return history

@csrf_exempt
def get_price_history(request, product_id):
    """Returns real price history, falling back to simulation if needed"""
    try:
        # 1. Fetch real history from DB, filtering out invalid 0 prices
        history_objs = PriceHistory.objects(product_id=product_id, price__gt=0).order_by('timestamp')
        
        if history_objs.count() >= 3:
            history = [
                {"date": obj.timestamp.strftime('%Y-%m-%d %H:%M'), "price": float(obj.price)} 
                for obj in history_objs
            ]
            return JsonResponse({"status": "success", "history": history})

        # 2. Fallback to simulation if not enough real data
        base_price = float(request.GET.get('price', 1000))
        if base_price <= 0: base_price = 1000
            
        history = generate_simulated_history(base_price)
        return JsonResponse({"status": "success", "history": history, "is_simulated": True})
    except Exception as e:
        print(f"History Error: {e}")
        return JsonResponse({"status": "error", "message": str(e)}, status=500)

@csrf_exempt
def predict_price(request, product_id):
    """AI Price Prediction logic using Linear Regression"""
    try:
        # 1. Gather historical data
        history_objs = PriceHistory.objects(product_id=product_id).order_by('timestamp')
        
        data_points = []
        if history_objs.count() >= 2:
            data_points = [
                {"date": obj.timestamp, "price": float(obj.price)} 
                for obj in history_objs
            ]
        else:
            # Fallback: Use simulated points for AI engine to work with
            base_price = float(request.GET.get('price', 1000))
            if base_price <= 0: base_price = 1000
                
            sim_history = generate_simulated_history(base_price)
            data_points = [
                {"date": datetime.datetime.strptime(h['date'], '%Y-%m-%d'), "price": h['price']}
                for h in sim_history
            ]

        # 2. Run AI Engine
        prediction, error = predict_future_prices(data_points)
        
        if error:
            # Graceful failure
            return JsonResponse({
                "status": "error", 
                "message": "Data Insufficient",
                "details": error
            }, status=200) # Keep 200 so UI can show the message without crashing
            
        return JsonResponse({"status": "success", **prediction})

    except Exception as e:
        print(f"Prediction Error: {e}")
        return JsonResponse({"status": "error", "message": str(e)}, status=500)


