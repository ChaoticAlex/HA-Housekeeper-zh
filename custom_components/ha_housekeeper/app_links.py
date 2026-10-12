"""Which integrations hang on which app (add-on): an assumption, never a certainty.

Two signals, both deterministic:

* the host name of the app (its slug with ``_`` turned into ``-``, the name the Supervisor's
  network resolves) appears as a host in the entry's title, data or options;
* the entry was created by the Supervisor itself (source ``hassio``) and its domain is the app's
  name without the repository prefix.

The values are only compared and never kept: the result is an edge from the entry to the app.
Names alone (an integration and an app that are called alike) say nothing and are not used.
"""

from __future__ import annotations

import re
from collections.abc import Iterable, Mapping
from typing import Any

from .sensitive_fields import kind_of

MAX_DEPTH = 3
REPOSITORY_PREFIX = re.compile(r"^[0-9a-f]{8}_")


def dns_name(slug: str) -> str:
    """The host name under which the Supervisor's network resolves an app."""
    return slug.replace("_", "-")


def _strings(value: Any, depth: int = 0) -> Iterable[str]:
    """The text values of a mapping, nested ones included; credentials are skipped."""
    if isinstance(value, str):
        yield value
    elif isinstance(value, Mapping) and depth <= MAX_DEPTH:
        for key, child in value.items():
            if kind_of(key) is None:
                yield from _strings(child, depth + 1)
    elif isinstance(value, list | tuple) and depth <= MAX_DEPTH:
        for child in value:
            yield from _strings(child, depth + 1)


def _mentions(text: str, host: str) -> bool:
    """True when ``host`` stands as a whole host name in ``text`` (not as part of a longer one)."""
    return bool(re.search(rf"(?<![a-z0-9-]){re.escape(host)}(?![a-z0-9-])", text.lower()))


def app_edges(entries: Iterable[Any], apps: Iterable[dict[str, Any]]) -> list[dict[str, str]]:
    """Edges ``config_entry:<id>`` -> ``app:<slug>``; each entry gets the apps it most likely uses."""
    hosts = {app["slug"]: dns_name(str(app["slug"])) for app in apps}
    if not hosts:
        return []
    edges: list[dict[str, str]] = []
    for entry in entries:
        if entry.source == "ignore":
            continue
        texts = [entry.title or "", *_strings(dict(entry.data)), *_strings(dict(entry.options))]
        for slug, host in hosts.items():
            by_host = any(_mentions(text, host) for text in texts)
            by_source = entry.source == "hassio" and dns_name(
                REPOSITORY_PREFIX.sub("", slug)
            ) == dns_name(str(entry.domain))
            if by_host or by_source:
                edges.append(
                    {
                        "source": f"config_entry:{entry.entry_id}",
                        "target": f"app:{slug}",
                        "relation": "CONNECTED",
                        "confidence": "probable",
                    }
                )
    return edges
