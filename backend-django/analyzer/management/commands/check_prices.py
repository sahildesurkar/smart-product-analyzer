from django.core.management.base import BaseCommand
from analyzer.models import PriceAlert
from analyzer.scraper import get_real_time_products
from django.core.mail import send_mail
from django.conf import settings

class Command(BaseCommand):
    help = 'Checks real-time prices for active alerts and sends emails'

    def handle(self, *args, **options):
        self.stdout.write("Starting price alert check...")
        
        active_alerts = PriceAlert.objects(is_active=True)
        
        for alert in active_alerts:
            try:
                self.stdout.write(f"Checking: {alert.product_title}")
                
                # We scrape for the product title to see current market price
                results = get_real_time_products(alert.product_title)
                
                if not results:
                    continue
                    
                # Find the lowest price from the results
                # Prices are strings like "₹52,999", need to clean them
                def clean_price(p_str):
                    return float(p_str.replace('₹', '').replace(',', '').strip())

                current_min_price = min([clean_price(r['price']) for r in results if r['price']])
                
                if current_min_price <= float(alert.target_price):
                    self.stdout.write(f"PRICE DROP! {alert.product_title} is now ₹{current_min_price}")
                    
                    # Send Email
                    send_mail(
                        subject='🔥 PRICE DROP ALERT!',
                        message=f'Good news! The price for "{alert.product_title}" has dropped to ₹{current_min_price}. \n\nTarget was ₹{alert.target_price}. \n\nGo buy it now!',
                        from_email=settings.DEFAULT_FROM_EMAIL,
                        recipient_list=[alert.user_email],
                        fail_silently=False,
                    )
                    
                    # Deactivate alert so we don't spam
                    alert.is_active = False
                    alert.save()
                    
            except Exception as e:
                self.stdout.write(f"Error checking alert {alert.id}: {e}")

        self.stdout.write("Price check completed.")
