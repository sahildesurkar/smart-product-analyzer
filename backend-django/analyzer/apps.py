import os
from django.apps import AppConfig

class AnalyzerConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'analyzer'

    def ready(self):
        # Prevent scheduler from running twice in dev environment
        if os.environ.get('RUN_MAIN', None) == 'True' or not os.environ.get('RUN_MAIN'):
            try:
                from . import scheduler
                scheduler.start_scheduler()
            except ImportError:
                pass
