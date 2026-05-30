from django.contrib import admin
from django.urls import path
from analyzer import views

# API routes for Smart E-Commerce Product Link Analyzer
urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Analysis API
    # path('analyze/', views.analyze_product_link, name='analyze_product_link'),
    path('analyze/', views.analyze_product_link),
    path('search/', views.search_products, name='search_products'),
    path('debug-search/', views.debug_search, name='debug_search'),
    path('products/category/', views.get_products_by_category, name='get_products_by_category'),
    path('product/<str:product_id>/', views.get_product_details, name='get_product_details'),
    
    # Search History API
    path('history/save/', views.save_search_history, name='save_search_history'),
    
    # Recommendations
    path('recommendations/user/<str:user_id>/', views.get_recommendations, name='get_recommendations'),
    
    # Price Alert Endpoints
    path('alerts/set/', views.set_price_alert, name='set_price_alert'),
    path('alerts/user/<int:user_id>/', views.get_user_alerts, name='get_user_alerts'),
    path('alerts/toggle/<str:alert_id>/', views.toggle_price_alert, name='toggle_price_alert'),
    path('alerts/update/<str:alert_id>/', views.update_price_alert, name='update_price_alert'),
    path('alerts/delete/<str:alert_id>/', views.delete_price_alert, name='delete_price_alert'),
    
    # Price History API
    path('history/price/<str:product_id>/', views.get_price_history, name='get_price_history'),
    path('history/predict/<str:product_id>/', views.predict_price, name='predict_price'),
]
