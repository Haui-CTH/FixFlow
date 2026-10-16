# SPDX-License-Identifier: Apache-2.0
# DX-FSM Notification Service – Test config
# Mock SMTP để tests không cần mailhog thật.

import pytest
import sys
from pathlib import Path

# Add app to path
sys.path.insert(0, str(Path(__file__).parent.parent))

# Set test env vars BEFORE imports
import os
os.environ.setdefault("SMTP_HOST", "localhost")
os.environ.setdefault("SMTP_PORT", "1025")
os.environ.setdefault("SERVICE_TOKEN", "")  # disable auth in tests
os.environ.setdefault("SMS_ENABLED", "false")
os.environ.setdefault("PUSH_ENABLED", "false")
