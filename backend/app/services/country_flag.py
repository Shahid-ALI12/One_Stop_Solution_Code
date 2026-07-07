"""Country-name → ISO 3166-1 alpha-2 code lookup + flag-URL helper.

Used by:
  - rating_service.create_rating — auto-fills avatar_url with a country flag
    image (flagcdn.com) when the caller didn't supply one.

The lookup is intentionally fuzzy: it accepts common variants
("United States", "USA", "US", "U.S.A.") and matches case-insensitively.
For unknown countries we return None and the caller keeps whatever
avatar_url (or empty) was supplied.

flagcdn.com is free, requires no API key, and serves PNG/WebP at any size.
"""
import re

# ── Canonical country name → ISO alpha-2 ─────────────────────────────────
# Curated to cover all countries appearing in the seed data + the most
# common client countries for an accounting outsourcing business.
# Keys here are already in their NORMALIZED form (lowercase, punctuation
# collapsed to single space) so they match output of normalize_country().
_COUNTRY_TO_CODE: dict[str, str] = {
    # North America
    "united states":      "us",  "usa": "us",  "u s a": "us",  "us": "us",
    "united states of america": "us",
    "canada":             "ca",
    "mexico":             "mx",
    # South America
    "brazil":             "br",  "argentina": "ar",  "chile": "cl",
    "colombia":           "co",  "peru": "pe",  "venezuela": "ve",
    # Europe
    "united kingdom":     "gb",  "uk": "gb",  "u k": "gb",  "britain": "gb",
    "great britain":      "gb",  "england": "gb",  "scotland": "gb",  "wales": "gb",
    "germany":            "de",  "de": "de",  # accept 'DE' as both code + name
    "france":             "fr",  "fr": "fr",
    "spain":              "es",  "es": "es",
    "italy":              "it",  "it": "it",
    "netherlands":        "nl",  "holland": "nl",  "nl": "nl",
    "belgium":            "be",  "be": "be",
    "switzerland":        "ch",  "ch": "ch",
    "austria":            "at",  "at": "at",
    "sweden":             "se",  "se": "se",
    "norway":             "no",  "no": "no",
    "denmark":            "dk",  "dk": "dk",
    "finland":            "fi",  "fi": "fi",
    "ireland":            "ie",  "ie": "ie",
    "portugal":           "pt",  "pt": "pt",
    "greece":             "gr",  "gr": "gr",
    "poland":             "pl",  "pl": "pl",
    "czech republic":     "cz",  "czechia": "cz",  "cz": "cz",
    "romania":            "ro",  "ro": "ro",
    "hungary":            "hu",  "hu": "hu",
    "ukraine":            "ua",  "ua": "ua",
    "russia":             "ru",  "ru": "ru",
    # Middle East
    "saudi arabia":       "sa",  "sa": "sa",
    "united arab emirates": "ae",  "uae": "ae",  "u a e": "ae",  "ae": "ae",
    "qatar":              "qa",  "qa": "qa",
    "kuwait":             "kw",  "kw": "kw",
    "bahrain":            "bh",  "bh": "bh",
    "oman":               "om",  "om": "om",
    "jordan":             "jo",  "jo": "jo",
    "lebanon":            "lb",  "lb": "lb",
    "israel":             "il",  "il": "il",
    "iran":               "ir",  "ir": "ir",
    "iraq":               "iq",  "iq": "iq",
    "turkey":             "tr",  "türkiye": "tr",  "tr": "tr",
    # Asia
    "pakistan":           "pk",  "pk": "pk",
    "india":              "in",  "in": "in",
    "bangladesh":         "bd",  "bd": "bd",
    "sri lanka":          "lk",  "lk": "lk",
    "nepal":              "np",  "np": "np",
    "afghanistan":        "af",  "af": "af",
    "china":              "cn",  "cn": "cn",
    "hong kong":          "hk",  "hk": "hk",
    "taiwan":             "tw",  "tw": "tw",
    "japan":              "jp",  "jp": "jp",
    "south korea":        "kr",  "korea": "kr",  "republic of korea": "kr",  "kr": "kr",
    "singapore":          "sg",  "sg": "sg",
    "malaysia":           "my",  "my": "my",
    "indonesia":          "id",  "id": "id",
    "philippines":        "ph",  "ph": "ph",
    "thailand":           "th",  "th": "th",
    "vietnam":            "vn",  "vn": "vn",
    # Oceania
    "australia":          "au",  "au": "au",
    "new zealand":        "nz",  "nz": "nz",
    # Africa
    "south africa":       "za",  "za": "za",
    "nigeria":            "ng",  "ng": "ng",
    "kenya":              "ke",  "ke": "ke",
    "egypt":              "eg",  "eg": "eg",
    "morocco":            "ma",  "ma": "ma",
    "ghana":              "gh",  "gh": "gh",
    "ethiopia":           "et",  "et": "et",
    "tanzania":           "tz",  "tz": "tz",
    "uganda":             "ug",  "ug": "ug",
}

# Reverse index: ISO code → first canonical name (for display)
_CODE_TO_COUNTRY: dict[str, str] = {}
for _name, _code in _COUNTRY_TO_CODE.items():
    # Keep the longest (most descriptive) name for each code.
    if _code not in _CODE_TO_COUNTRY or len(_name) > len(_CODE_TO_COUNTRY[_code]):
        _CODE_TO_COUNTRY[_code] = _name


def normalize_country(raw: str) -> str:
    """Normalize a country string for lookup: lowercase, strip, collapse punctuation.

    Preserves Unicode letters (so 'Türkiye' stays 'türkiye', not 't rkiye').
    Examples:
      'United States'    → 'united states'
      'U.S.A.'           → 'u s a' (then matched against 'u s a' alias)
      '  united  states' → 'united states' (collapse extra spaces)
      'Türkiye'          → 'türkiye'
    """
    if not raw:
        return ""
    s = raw.strip().lower()
    # Collapse any run of non-letter/non-digit (including dots, hyphens) to a single space.
    # Use \\w with re.UNICODE so accented letters are preserved.
    s = re.sub(r"[^\w]+", " ", s, flags=re.UNICODE).strip()
    # Collapse underscores too (\\w includes underscore)
    s = re.sub(r"_+", " ", s).strip()
    return s


def country_to_code(country: str) -> str | None:
    """Return ISO alpha-2 code (lowercase) for a country name, or None if unknown."""
    norm = normalize_country(country)
    if not norm:
        return None
    return _COUNTRY_TO_CODE.get(norm)


def code_to_country(code: str) -> str | None:
    """Return the canonical country name for an ISO alpha-2 code, or None."""
    if not code:
        return None
    return _CODE_TO_COUNTRY.get(code.strip().lower())


def flag_url(country: str, size: str = "120x90") -> str | None:
    """Return a flagcdn.com PNG URL for the given country name, or None if unknown.

    `size` examples: "80x60", "120x90", "240x180". Falls back to a default if invalid.
    """
    code = country_to_code(country)
    if not code:
        return None
    # Sanity-check the size string format; default to 120x90 if it looks wrong.
    if not re.match(r"^\d+x\d+$", size):
        size = "120x90"
    return f"https://flagcdn.com/{size}/{code}.png"
