"""The inventory reply is cleaned when it holds values JSON cannot carry."""

from unittest.mock import MagicMock

from custom_components.ha_housekeeper.ws_common import send_sendable, sendable


class Odd:
    def __str__(self) -> str:
        return "odd"


def test_sendable_cleans_unsendable_values(caplog) -> None:
    good = {"a": [1, "x", None], "b": {"c": 1.5}}
    assert sendable(good) is good
    cleaned = sendable({"o": Odd(), "l": [{"t": (1, 2)}], (1, 2): "k", "n": 2**70})
    assert cleaned == {"o": "odd", "l": [{"t": [1, 2]}], "(1, 2)": "k", "n": str(2**70)}
    assert "/o" in caplog.text


def test_a_reply_that_cannot_be_cleaned_becomes_an_error() -> None:
    cycle: dict = {"v": object()}
    cycle["self"] = cycle
    connection = MagicMock()
    send_sendable(connection, 7, cycle)
    connection.send_result.assert_not_called()
    assert connection.send_error.call_args.args[:2] == (7, "unsendable_reply")
