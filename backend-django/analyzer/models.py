# Database models for Django backend (Updated for MongoEngine)
from mongoengine import Document, StringField, DecimalField, DateTimeField, URLField, IntField, EmailField, BooleanField, ReferenceField, CASCADE, DictField
from datetime import datetime, timezone

# Tracks user price alerts
class PriceAlert(Document):
    product_title = StringField(max_length=500)
    current_price = StringField()
    target_price = DecimalField(precision=2)
    user_email = EmailField()
    image_url = URLField(max_length=1000, null=True, blank=True)
    product_url = URLField(max_length=1000, null=True, blank=True)
    is_active = BooleanField(default=True)
    created_at = DateTimeField(default=lambda: datetime.now(timezone.utc))

    meta = {'collection': 'analyzer_pricealert'}

    def __str__(self):
        return f"Alert: {self.product_title} @ ₹{self.target_price}"

# Tracks user search queries for personalization
class SearchHistory(Document):
    user_id = StringField(default="guest") # Using string for flexibility
    query = StringField(max_length=500)
    category = StringField(max_length=100)
    timestamp = DateTimeField(default=lambda: datetime.now(timezone.utc))

    meta = {'collection': 'analyzer_searchhistory'}

    def __str__(self):
        return f"{self.user_id}: {self.query}"

# Tracks granular user actions for AI recommendations
class ActionLog(Document):
    user_id = StringField(default="guest")
    action_type = StringField(choices=["view", "click", "compare"])
    product_id = StringField()
    category = StringField(max_length=100)
    timestamp = DateTimeField(default=lambda: datetime.now(timezone.utc))

    meta = {'collection': 'analyzer_actionlog'}

# Tracks historical price data for AI analysis
class PriceHistory(Document):
    product_id = StringField(required=True)
    product_title = StringField(max_length=500, required=True)
    normalized_title = StringField(max_length=500, required=True)
    price = DecimalField(precision=2, required=True)
    product_url = URLField(max_length=1000, required=True)
    image_url = URLField(max_length=1000, null=True, blank=True)
    source = StringField(max_length=100, required=True)
    timestamp = DateTimeField(default=lambda: datetime.now(timezone.utc))

    meta = {
        'collection': 'analyzer_pricehistory',
        'indexes': ['product_id', 'normalized_title', '-timestamp']
    }

    def __str__(self):
        return f"{self.normalized_title}: ₹{self.price} at {self.timestamp}"

# Represents a canonical, normalized product entity across all platforms
class NormalizedProduct(Document):
    canonical_id = StringField(primary_key=True)
    title = StringField(max_length=500, required=True)
    category = StringField(max_length=100)
    brand = StringField(max_length=100)
    model = StringField(max_length=200)
    identity_attributes = DictField() # Stores color, ram, storage, material, style, etc.
    lowest_price = DecimalField(precision=2)
    created_at = DateTimeField(default=lambda: datetime.now(timezone.utc))
    updated_at = DateTimeField(default=lambda: datetime.now(timezone.utc))

    meta = {
        'collection': 'analyzer_normalizedproduct',
        'indexes': ['canonical_id', 'category', 'brand']
    }

# Represents a group of products matched together from different platforms
class ProductComparison(Document):
    normalized_product = ReferenceField(NormalizedProduct, required=True)
    platform = StringField(max_length=100, required=True)
    product_url = URLField(max_length=1000, required=True)
    title_on_platform = StringField(max_length=500)
    current_price = DecimalField(precision=2, required=True)
    match_score = DecimalField(precision=2) # 0 to 100
    last_verified = DateTimeField(default=lambda: datetime.now(timezone.utc))

    meta = {
        'collection': 'analyzer_productcomparison',
        'indexes': ['normalized_product', 'platform', 'product_url']
    }
