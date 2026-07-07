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
_COUNTRY_TO_CODE: dict[str, str] = {
    # North America
    "united states":      "us",  "usa": "us",  "u.s.a.": "us",  "us": "us",
    "united states of america": "us",
    "canada":             "ca",
    "mexico":             "mx",
    # South America
    "brazil":             "br",  "argentina": "ar",  "chile": "cl",
    "colombia":           "co",  "peru": "pe",  "venezuela": "ve",
    # Europe
    "united kingdom":     "gb",  "uk": "gb",  "u.k.": "gb",  "britain": "gb",
    "great britain":      "gb",  "england": "gb",  "scotland": "gb",  "wales": "gb",
    "germany":            "de",
    "france":             "fr",
    "spain":              "es",
    "italy":              "it",
    "netherlands":        "nl",  "holland": "nl",
    "belgium":            "be",
    "switzerland":        "ch",
    "austria":            "at",
    "sweden":             "se",
    "norway":             "no",
    "denmark":            "dk",
    "finland":            "fi",
    "ireland":            "ie",
    "portugal":           "pt",
    "greece":             "gr",
    "poland":             "pl",
    "czech republic":     "cz",  "czechia": "cz",
    "romania":            "ro",
    "hungary":            "hu",
    "ukraine":            "ua",
    "russia":             "ru",
    # Middle East
    "saudi arabia":       "sa",
    "united arab emirates": "ae",  "uae": "ae",  "u.a.e.": "ae",
    "qatar":              "qa",
    "kuwait":             "kw",
    "bahrain":            "bh",
    "oman":               "om",
    "jordan":             "jo",
    "lebanon":            "lb",
    "israel":             "il",
    "iran":               "ir",
    "iraq":               "iq",
    "turkey":             "tr",  "türkiye": "tr",
    # Asia
    "pakistan":           "pk",
    "india":              "in",
    "bangladesh":         "bd",
    "sri lanka":          "lk",
    "nepal":              "np",
    "afghanistan":        "af",
    "china":              "cn",
    "hong kong":          "hk",
    "taiwan":             "tw",
    "japan":              "jp",
    "south korea":        "kr",  "korea": "kr",  "republic of korea": "kr",
    "singapore":          "sg",
    "malaysia":           "my",
    "indonesia":          "id",
    "philippines":        "ph",
    "thailand":           "th",
    "vietnam":            "vn",
    # Oceania
    "australia":          "au",
    "new zealand":        "nz",
    # Africa
    "south africa":       "za",
    "nigeria":            "ng",
    "kenya":              "ke",
    "egypt":              "eg",
    "morocco":            "ma",
    "ghana":              "gh",
    "ethiopia":           "et",
    "tanzania":           "tz",
    "uganda":             "ug",
}

# Reverse index: ISO code → first canonical name (for display)
_CODE_TO_COUNTRY: dict[str, str] = {}
for _name, _code in _COUNTRY_TO_CODE.items():
    # Keep the longest (most descriptive) name for each code.
    if _code not in _CODE_TO_COUNTRY or len(_name) > len(_CODE_TO_COUNTRY[_code]):
        _CODE_TO_COUNTRY[_code] = _name


def normalize_country(raw: str) -> str:
    """Normalize a country string for lookup: lowercase, strip, collapse punctuation."""
    if not raw:
        return ""
    s = raw.strip().lower()
    # Collapse any run of non-alphanumeric to a single space.
    s = re.sub(r"[^a-z0-9]+", " ", s).strip()
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
