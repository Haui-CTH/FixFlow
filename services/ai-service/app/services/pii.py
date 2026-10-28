# SPDX-License-Identifier: Apache-2.0
"""
DX-FSM AI Service — PII Anonymization & Data Protection.
Complies with Vietnam Decree 13/2023/ND-CP on Personal Data Protection (PDPD).
Automatically detects and masks sensitive personal identifiers (phone numbers, emails, CCCD)
before passing user text to Large Language Models (LLM) or external AI engines.
"""
from __future__ import annotations

import re
from typing import Dict, Tuple

# Vietnamese Mobile & Landline Phone Regex (supports 09x, 08x, 03x, 07x, 05x, +84, with dots/spaces)
PHONE_REGEX = re.compile(
    r"(?<!\d)(?:\+?84|0)(?:[\s.-]?[35789]\d)(?:[\s.-]?\d{3,4}){2}(?!\d)"
)

# Standard Email Regex
EMAIL_REGEX = re.compile(
    r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+"
)

# Vietnamese Citizen Identification Number (CCCD 12 digits or CMND 9 digits)
CCCD_REGEX = re.compile(
    r"(?<!\d)(?:\d{12}|\d{9})(?!\d)"
)


def anonymize_pii(text: str) -> Tuple[str, Dict[str, str]]:
    """
    Scans input text, replaces PII with indexed placeholders ([SĐT-1], [EMAIL-1], [CCCD-1]),
    and returns the anonymized string along with a mapping dictionary for restoration if required.
    """
    if not text:
        return text, {}

    mapping: Dict[str, str] = {}
    phone_idx = 1
    email_idx = 1
    cccd_idx = 1

    # 1. Mask Emails first (to prevent overlap with numbers)
    def mask_email(match: re.Match[str]) -> str:
        nonlocal email_idx
        orig = match.group(0)
        token = f"[EMAIL-{email_idx}]"
        mapping[token] = orig
        email_idx += 1
        return token

    text = EMAIL_REGEX.sub(mask_email, text)

    # 2. Mask Phone Numbers
    def mask_phone(match: re.Match[str]) -> str:
        nonlocal phone_idx
        orig = match.group(0)
        token = f"[SĐT-{phone_idx}]"
        mapping[token] = orig
        phone_idx += 1
        return token

    text = PHONE_REGEX.sub(mask_phone, text)

    # 3. Mask National IDs (CCCD / CMND)
    def mask_cccd(match: re.Match[str]) -> str:
        nonlocal cccd_idx
        orig = match.group(0)
        token = f"[CCCD-{cccd_idx}]"
        mapping[token] = orig
        cccd_idx += 1
        return token

    text = CCCD_REGEX.sub(mask_cccd, text)

    return text, mapping


def mask_pii(text: str) -> str:
    """Helper that returns only the anonymized text."""
    masked, _ = anonymize_pii(text)
    return masked


def has_pii(text: str) -> bool:
    """Checks whether the text contains any identifiable personal data."""
    if not text:
        return False
    return bool(
        EMAIL_REGEX.search(text)
        or PHONE_REGEX.search(text)
        or CCCD_REGEX.search(text)
    )

