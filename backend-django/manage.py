#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""
import os
import sys
import platform

# Monkeypatch platform.uname to avoid WMI issues on Windows (Python 3.13 bug)
if os.name == 'nt':
    from collections import namedtuple
    uname_result = namedtuple('uname_result', 'system node release version machine processor')
    mock_uname = uname_result('Windows', 'localhost', '10', '10.0.0', 'AMD64', 'Intel64 Family 6')
    platform.uname = lambda: mock_uname

def main():
    """Run administrative tasks."""
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'settings')
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    execute_from_command_line(sys.argv)

if __name__ == '__main__':
    main()
