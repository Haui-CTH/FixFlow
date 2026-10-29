# SPDX-License-Identifier: Apache-2.0
"""
DX-FSM AI Service — PII Anonymization & Data Protection.
Complies with Vietnam Decree 13/2023/ND-CP on Personal Data Protection (PDPD).
Automatically detects and masks sensitive personal identifiers (phone numbers, emails, CCCD, personal names)
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

# Vietnamese Honorifics / Pronouns preceding personal names
HONORIFIC_PREFIXES = (
    r"(?i:\b(?:anh|chị|chi|ông|ong|bà|ba|thầy|thay|cô|co|bạn|ban|ktv|kỹ thuật viên|ky thuat vien|cán bộ|can bo|chú|chu|bác|bac|em)\s+)"
)

# Capitalized Vietnamese syllables (1-4 words) for named entities
VIETNAMESE_NAME_BODY = (
    r"([A-ZĐÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴ]"
    r"[a-zđàáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵ]+"
    r"(?:\s+[A-ZĐÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴ]"
    r"[a-zđàáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵ]+){0,3})"
)

NAME_REGEX = re.compile(f"({HONORIFIC_PREFIXES})({VIETNAMESE_NAME_BODY})")

# Technical words whitelist: words that start with capital letters but are NOT personal names
NON_PERSON_WHITELIST = frozenset([
    "windows", "linux", "ubuntu", "android", "ios", "macos",
    "office", "word", "excel", "powerpoint", "outlook",
    "cisco", "tp-link", "tplink", "canon", "hp", "dell", "haui",
    "asus", "acer", "lenovo", "macbook", "it", "fsm", "fixflow", "dx-os",
    "wifi", "lan", "wan", "internet", "d10", "d9", "a1", "a2", "b1",
])


def anonymize_pii(text: str, mask_names: bool = True) -> Tuple[str, Dict[str, str]]:
    """
    Scans input text, replaces PII with indexed placeholders ([SĐT-1], [EMAIL-1], [CCCD-1], [TÊN-1]),
    and returns the anonymized string along with a mapping dictionary for restoration if required.
    """
    if not text:
        return text, {}

    mapping: Dict[str, str] = {}
    phone_idx = 1
    email_idx = 1
    cccd_idx = 1
    name_idx = 1

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

    # 4. Contextual Vietnamese Person Names Masking (Decree 13/2023/ND-CP)
    if mask_names:
        def mask_name(match: re.Match[str]) -> str:
            nonlocal name_idx
            honorific = match.group(1)
            raw_name = match.group(2)
            # Check whitelist to avoid masking tech words
            first_word = raw_name.split()[0].lower()
            if first_word in NON_PERSON_WHITELIST or raw_name.lower() in NON_PERSON_WHITELIST:
                return match.group(0)

            token = f"[TÊN-{name_idx}]"
            mapping[token] = raw_name
            name_idx += 1
            return f"{honorific}{token}"

        text = NAME_REGEX.sub(mask_name, text)

    return text, mapping


def mask_pii(text: str, mask_names: bool = True) -> str:
    """Helper that returns only the anonymized text."""
    masked, _ = anonymize_pii(text, mask_names=mask_names)
    return masked


def has_pii(text: str, check_names: bool = True) -> bool:
    """Checks whether the text contains any identifiable personal data."""
    if not text:
        return False
    found = bool(
        EMAIL_REGEX.search(text)
        or PHONE_REGEX.search(text)
        or CCCD_REGEX.search(text)
    )
    if found:
        return True

    if check_names:
        m = NAME_REGEX.search(text)
        if m:
            raw_name = m.group(2)
            first_word = raw_name.split()[0].lower()
            if first_word not in NON_PERSON_WHITELIST and raw_name.lower() not in NON_PERSON_WHITELIST:
                return True

    return False
