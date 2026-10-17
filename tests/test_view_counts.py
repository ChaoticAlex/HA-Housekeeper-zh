"""What the bar counts for the credentials page."""

from custom_components.ha_housekeeper.view_counts import _credentials


def _entry(fields, reauth=False, disabled=False):
    return {"fields": [{"set": f} for f in fields], "reauth": reauth, "disabled": disabled}


def test_credentials_count_what_needs_a_look() -> None:
    data = {
        "entries": [
            _entry([True]),  # complete: not counted
            _entry([True, False]),  # an empty field
            _entry([True], reauth=True),  # a login to renew
            _entry([False], disabled=True),  # switched off and empty: nothing is kept
            _entry([True], disabled=True),  # switched off but values are kept
        ],
        "accounts": [
            {"active": True, "admin": True, "mfa": False},
            {"active": True, "admin": True, "mfa": True},
            {"active": True, "admin": False, "mfa": False},
        ],
        "tokens": [{"old": True, "account_active": True}, {"old": False, "account_active": True}],
    }
    assert _credentials(data) == 3 + 1 + 1
    assert _credentials({"entries": [], "accounts": None, "tokens": None}) == 0
