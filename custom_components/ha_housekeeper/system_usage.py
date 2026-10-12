"""Storage and system: disk, memory, CPU and the largest consumers of space.

Read-only. Nothing is written, nothing is stored. The file system parts block and run in the
executor; the Supervisor parts (host disk, disk usage by category, apps) are only asked when
Home Assistant runs under a Supervisor and are skipped silently otherwise.

The panel translates the ids of the known places (``STORAGE_TARGETS``); labels of Supervisor
categories and app names are shown as the Supervisor sends them.
"""

from __future__ import annotations

import asyncio
import logging
import os
import re
import shutil
import time
from collections.abc import Iterable
from typing import Any

from homeassistant.core import HomeAssistant
from homeassistant.helpers.aiohttp_client import async_get_clientsession

_LOGGER = logging.getLogger(__name__)

SUPERVISOR_URL = "http://supervisor"
SUPERVISOR_TIMEOUT = 15  # seconds per request
DISK_USAGE_TIMEOUT = 45  # the usage walk over the data disk can take a while
CPU_SAMPLE_SECONDS = 0.4
GIB = 1024**3

# Known places under the configuration directory: (id, relative path, kind).
# kind: "db" sums the recorder database with its -wal and -shm files, "dir" a folder.
STORAGE_TARGETS: tuple[tuple[str, str, str], ...] = (
    ("recorder_db", "home-assistant_v2.db", "db"),
    ("backups", "backups", "dir"),
    ("custom_components", "custom_components", "dir"),
    ("media", "media", "dir"),
    ("www", "www", "dir"),
    ("image", "image", "dir"),
    ("tts", "tts", "dir"),
    ("blueprints", "blueprints", "dir"),
    ("themes", "themes", "dir"),
    ("deps", "deps", "dir"),
)


# --------------------------------------------------------------------------- sizes


def path_size(path: str) -> int:
    """Size of a file or a folder in bytes; links are not followed, unreadable parts count 0."""
    if not path or not os.path.exists(path):
        return 0
    if os.path.isfile(path):
        try:
            return os.path.getsize(path)
        except OSError:
            return 0
    total = 0
    for root, _dirs, files in os.walk(path, followlinks=False):
        for name in files:
            file = os.path.join(root, name)
            try:
                if not os.path.islink(file):
                    total += os.path.getsize(file)
            except OSError:
                continue
    return total


def _inside(path: str, base: str) -> bool:
    real, root = os.path.realpath(path), os.path.realpath(base)
    return real == root or real.startswith(root + os.sep)


def storage_breakdown(config_dir: str) -> dict[str, Any]:
    """The known places under the configuration directory and every custom integration."""
    items: list[dict[str, Any]] = []
    for target_id, rel, kind in STORAGE_TARGETS:
        if kind == "db":
            size = sum(
                path_size(os.path.join(config_dir, rel + suffix)) for suffix in ("", "-wal", "-shm")
            )
        else:
            size = path_size(os.path.join(config_dir, rel))
        if size > 0:
            items.append({"id": target_id, "path": rel, "bytes": size})
    items.sort(key=lambda item: item["bytes"], reverse=True)

    custom: list[dict[str, Any]] = []
    folder = os.path.join(config_dir, "custom_components")
    if os.path.isdir(folder):
        try:
            for entry in os.scandir(folder):
                if entry.is_dir() and not entry.name.startswith(("__", ".")):
                    size = path_size(entry.path)
                    if size > 0:
                        custom.append({"domain": entry.name, "bytes": size})
        except OSError as err:
            _LOGGER.debug("custom_components cannot be read: %s", err)
    custom.sort(key=lambda item: item["bytes"], reverse=True)
    return {"breakdown": items, "custom_integrations": custom}


def card_path(config_dir: str, url: str) -> str | None:
    """The local file of a dashboard resource URL, or None for an external or unknown one.

    ``/local/…`` is ``<config>/www/…``, ``/hacsfiles/…`` is ``<config>/www/community/…``. The
    file must lie inside the configuration directory.
    """
    clean = str(url or "").split("?", 1)[0].split("#", 1)[0]
    if clean.startswith("/local/"):
        rel = os.path.join("www", clean[len("/local/") :])
    elif clean.startswith("/hacsfiles/"):
        rel = os.path.join("www", "community", clean[len("/hacsfiles/") :])
    else:
        return None
    path = os.path.normpath(os.path.join(config_dir, rel))
    return os.path.realpath(path) if _inside(path, config_dir) else None


ELEMENT_NAME = re.compile(r"customElements\.define\(\s*[\"']([a-z][a-z0-9]*(?:-[a-z0-9]+)+)[\"']")
MAX_SCRIPT_BYTES = 2 * 1024 * 1024  # a larger file is not read; its card names stay unknown


def element_names(path: str) -> list[str]:
    """The custom element names a card script defines; empty when none can be read from it.

    Minified scripts often define their elements through variables, so an empty list means
    "unknown", never "defines nothing".
    """
    try:
        if os.path.getsize(path) > MAX_SCRIPT_BYTES:
            return []
        with open(path, encoding="utf-8", errors="ignore") as file:
            return sorted(set(ELEMENT_NAME.findall(file.read())))
    except OSError:
        return []


def card_status(card: dict[str, Any], used: set[str] | None) -> str:
    """``missing`` (local file gone), ``external``, ``unused``, ``used`` or ``unknown``.

    ``used`` holds the ``custom:`` card types of all dashboards, ``None`` when they are unknown.
    A script is ``unused`` only when its element names are known and no dashboard uses one.
    """
    if not card.get("local"):
        return "external"
    if not card.get("exists"):
        return "missing"
    names = card.get("elements") or []
    if used is None or not names:
        return "unknown"
    return "used" if used.intersection(names) else "unused"


def card_sizes(config_dir: str, urls: Iterable[str]) -> dict[str, dict[str, Any]]:
    """Size per resource URL: the folder of a card that has one under www (HACS), else the file."""
    www = os.path.realpath(os.path.join(config_dir, "www"))
    result: dict[str, dict[str, Any]] = {}
    for url in urls:
        path = card_path(config_dir, url)
        if not path or not os.path.exists(path):
            result[url] = {
                "bytes": None,
                "scope": None,
                "path": None,
                "local": path is not None,
                "exists": False,
                "elements": [],
            }
            continue
        extra = {
            "local": True,
            "exists": True,
            "elements": element_names(path) if path.endswith((".js", ".mjs")) else [],
        }
        parent = os.path.realpath(os.path.dirname(path))
        if os.path.isfile(path) and parent != www and parent.startswith(www + os.sep):
            result[url] = {"bytes": path_size(parent), "scope": "folder", "path": parent, **extra}
        else:
            result[url] = {"bytes": path_size(path), "scope": "file", "path": path, **extra}
    return result


def blueprint_sizes(config_dir: str, specs: Iterable[tuple[str, str]]) -> list[int | None]:
    """Size of each blueprint file ``(domain, path)`` under ``<config>/blueprints``."""
    root = os.path.join(config_dir, "blueprints")
    sizes: list[int | None] = []
    for domain, path in specs:
        size = None
        for candidate in (os.path.join(root, domain, path), os.path.join(root, path)):
            if _inside(candidate, root) and os.path.isfile(candidate):
                size = path_size(candidate)
                break
        sizes.append(size)
    return sizes


# --------------------------------------------------------------------------- CPU, memory, disk


def _cpu_times() -> tuple[int, int] | None:
    try:
        with open("/proc/stat", encoding="utf-8") as file:
            for line in file:
                if line.startswith("cpu "):
                    parts = [int(x) for x in line.split()[1:]]
                    return sum(parts), parts[3] + (parts[4] if len(parts) > 4 else 0)
    except (OSError, ValueError, IndexError):
        return None
    return None


def cpu_percent(sample: float = CPU_SAMPLE_SECONDS) -> float | None:
    """CPU load in percent from two readings of /proc/stat; None where there is no /proc."""
    first = _cpu_times()
    if first is None:
        return None
    time.sleep(sample)
    second = _cpu_times()
    if second is None:
        return None
    total, idle = second[0] - first[0], second[1] - first[1]
    return round((1 - idle / total) * 100, 1) if total > 0 else None


def memory() -> dict[str, dict[str, Any]]:
    """RAM and swap from /proc/meminfo; empty parts where there is no /proc."""
    info: dict[str, int] = {}
    try:
        with open("/proc/meminfo", encoding="utf-8") as file:
            for line in file:
                key, _, rest = line.partition(":")
                value = rest.split()
                if value:
                    info[key.strip()] = int(value[0]) * 1024  # kB
    except (OSError, ValueError):
        return {"ram": {}, "swap": {}}

    def part(total: int, used: int) -> dict[str, Any]:
        return {
            "total": total,
            "used": used,
            "percent": round(used / total * 100, 1) if total else None,
        }

    total = info.get("MemTotal", 0)
    available = info.get("MemAvailable", info.get("MemFree", 0))
    swap_total = info.get("SwapTotal", 0)
    return {
        "ram": {**part(total, max(total - available, 0)), "available": available},
        "swap": part(swap_total, max(swap_total - info.get("SwapFree", 0), 0)),
    }


def disk_usage(path: str) -> dict[str, Any]:
    """Use of the file system the configuration directory lies on."""
    try:
        usage = shutil.disk_usage(path)
    except OSError as err:
        _LOGGER.debug("Disk usage cannot be read: %s", err)
        return {}
    return {
        "total": int(usage.total),
        "used": int(usage.used),
        "free": int(usage.free),
        "percent": round(usage.used / usage.total * 100, 1) if usage.total else None,
        "source": "filesystem",
    }


def collect_local(config_dir: str) -> dict[str, Any]:
    """Everything that is read from this machine's files (blocking; runs in the executor)."""
    try:
        load = os.getloadavg()
        load_avg: dict[str, float] | None = {
            "1m": round(load[0], 2),
            "5m": round(load[1], 2),
            "15m": round(load[2], 2),
        }
    except (OSError, AttributeError):
        load_avg = None
    mem = memory()
    try:
        storage = storage_breakdown(config_dir)
    except Exception as err:
        _LOGGER.warning("Storage breakdown failed: %s", err)
        storage = {"breakdown": [], "custom_integrations": []}
    return {
        "cpu": {"percent": cpu_percent(), "count": os.cpu_count()},
        "load": load_avg,
        "ram": mem["ram"],
        "swap": mem["swap"],
        "disk": disk_usage(config_dir),
        "storage": storage,
    }


# --------------------------------------------------------------------------- Supervisor


def supervisor_token() -> str | None:
    return os.environ.get("SUPERVISOR_TOKEN") or None


async def supervisor_get(
    hass: HomeAssistant,
    path: str,
    *,
    params: dict[str, Any] | None = None,
    timeout: int = SUPERVISOR_TIMEOUT,
) -> dict[str, Any] | None:
    """The ``data`` part of a Supervisor answer, or None when it does not answer."""
    token = supervisor_token()
    if not token:
        return None
    session = async_get_clientsession(hass)
    try:
        async with asyncio.timeout(timeout):
            async with session.get(
                f"{SUPERVISOR_URL}{path}",
                headers={"Authorization": f"Bearer {token}"},
                params=params,
            ) as resp:
                if resp.status != 200:
                    return None
                payload = await resp.json()
    except Exception as err:
        _LOGGER.debug("Supervisor %s cannot be read: %s", path, err)
        return None
    data = payload.get("data") if isinstance(payload, dict) else None
    return data if isinstance(data, dict) else None


def host_disk(info: dict[str, Any] | None) -> dict[str, Any]:
    """The data disk of the host from ``/host/info`` (sizes are in GiB there)."""
    if not info or info.get("disk_total") is None:
        return {}
    try:
        total = int(float(info["disk_total"]) * GIB)
        used = int(float(info["disk_used"]) * GIB) if info.get("disk_used") is not None else None
        free = int(float(info["disk_free"]) * GIB) if info.get("disk_free") is not None else None
    except (TypeError, ValueError):
        return {}
    return {
        "total": total,
        "used": used,
        "free": free,
        "percent": round(used / total * 100, 1) if used is not None and total else None,
        "source": "supervisor",
    }


def disk_categories(
    usage: dict[str, Any] | None,
) -> tuple[dict[str, Any], dict[str, dict[str, int]]]:
    """Disk use by category from ``/host/disks/default/usage`` and the size of each app's data.

    With ``max_depth=2`` the categories ``addons_data`` and ``addons_config`` list one child per
    app, named by its slug.
    """
    if not usage:
        return {}, {}
    app_sizes: dict[str, dict[str, int]] = {}
    children: list[dict[str, Any]] = []
    for child in usage.get("children") or []:
        if not isinstance(child, dict) or child.get("used_bytes") is None:
            continue
        kind = {"addons_data": "data", "addons_config": "config"}.get(child.get("id", ""))
        if kind:
            for sub in child.get("children") or []:
                if isinstance(sub, dict) and sub.get("id") and sub.get("used_bytes") is not None:
                    app_sizes.setdefault(str(sub["id"]), {})[kind] = int(sub["used_bytes"])
        children.append(
            {
                "id": str(child.get("id", "")),
                "label": str(child.get("label") or child.get("id") or ""),
                "bytes": int(child["used_bytes"]),
            }
        )
    if not children and usage.get("used_bytes") is None:
        return {}, app_sizes
    children.sort(key=lambda child: child["bytes"], reverse=True)
    return {
        "total": usage.get("total_bytes"),
        "used": usage.get("used_bytes"),
        "children": children,
    }, app_sizes


async def _apps(hass: HomeAssistant, sizes: dict[str, dict[str, int]]) -> list[dict[str, Any]]:
    """Installed apps (add-ons) with CPU and memory while running and the size of their data."""
    listing = await supervisor_get(hass, "/addons")
    if not listing:
        return []
    apps = [a for a in listing.get("addons") or [] if isinstance(a, dict) and a.get("slug")]

    async def one(app: dict[str, Any]) -> dict[str, Any]:
        slug = str(app["slug"])
        running = app.get("state") == "started"
        stats = await supervisor_get(hass, f"/addons/{slug}/stats") if running else None
        size = sizes.get(slug) or {}
        stats = stats or {}
        return {
            "slug": slug,
            "name": str(app.get("name") or slug),
            "state": app.get("state"),
            "cpu_percent": stats.get("cpu_percent"),
            "memory_usage": stats.get("memory_usage"),
            "memory_limit": stats.get("memory_limit"),
            "data_bytes": size.get("data"),
            "config_bytes": size.get("config"),
            "size_bytes": (size.get("data") or 0) + (size.get("config") or 0) if size else None,
        }

    result = await asyncio.gather(*(one(app) for app in apps))
    return sorted(result, key=lambda app: app["name"].lower())


async def supervisor_part(hass: HomeAssistant) -> dict[str, Any]:
    """Host disk, disk use by category and apps; empty without a Supervisor."""
    if not supervisor_token():
        return {"available": False}
    info, usage = await asyncio.gather(
        supervisor_get(hass, "/host/info"),
        supervisor_get(
            hass, "/host/disks/default/usage", params={"max_depth": 2}, timeout=DISK_USAGE_TIMEOUT
        ),
    )
    if usage is not None and not usage.get("children"):
        usage = await supervisor_get(hass, "/host/disks/default/usage") or usage
    categories, sizes = disk_categories(usage)
    return {
        "available": True,
        "disk": host_disk(info),
        "categories": categories,
        "apps": await _apps(hass, sizes),
    }


# --------------------------------------------------------------------------- dashboard resources, blueprints


async def dashboard_resources(hass: HomeAssistant) -> list[dict[str, Any]]:
    """The dashboard resources (custom cards): id, type and URL."""
    lovelace = hass.data.get("lovelace")
    resources = getattr(lovelace, "resources", None)
    if resources is None and isinstance(lovelace, dict):
        resources = lovelace.get("resources")
    if resources is None:
        return []
    try:
        if hasattr(resources, "async_get_info"):
            await resources.async_get_info()
        items = resources.async_items() or []
    except Exception as err:
        _LOGGER.debug("Dashboard resources cannot be read: %s", err)
        return []
    return [
        {
            "id": str(item.get("id", "")),
            "type": str(item.get("type", "")),
            "url": str(item.get("url", "")),
        }
        for item in items
        if isinstance(item, dict)
    ]


async def blueprint_list(hass: HomeAssistant) -> list[dict[str, Any]]:
    """Every blueprint the blueprint integration knows: domain, path, name and author."""
    found: list[dict[str, Any]] = []
    for domain, domain_blueprints in list((hass.data.get("blueprint") or {}).items()):
        try:
            results = await domain_blueprints.async_get_blueprints()
        except Exception as err:
            _LOGGER.debug("Blueprints of %s cannot be read: %s", domain, err)
            continue
        for path, blueprint in results.items():
            metadata = getattr(blueprint, "metadata", None)
            if not isinstance(metadata, dict):
                continue  # a blueprint that failed to load
            found.append(
                {
                    "domain": str(domain),
                    "path": str(path),
                    "name": str(metadata.get("name") or path),
                    "author": metadata.get("author") or None,
                }
            )
    return found


# --------------------------------------------------------------------------- assembly


def merge_cards(
    breakdown: list[dict[str, Any]], cards: list[dict[str, Any]], config_dir: str
) -> int:
    """Count each measured card once and take its share out of "www", so nothing counts twice.

    Adds a ``custom_cards`` entry to ``breakdown`` and returns the total size of the cards.
    """
    www = os.path.realpath(os.path.join(config_dir, "www"))
    seen: set[str] = set()
    total = www_part = 0
    for card in cards:
        size, path = card.get("bytes"), card.get("path")
        if size and path and path not in seen:
            seen.add(path)
            total += size
            if path == www or path.startswith(www + os.sep):
                www_part += size
    if total:
        for item in breakdown:
            if item["id"] == "www":
                item["bytes"] = max(0, item["bytes"] - www_part)
        breakdown[:] = [item for item in breakdown if item["bytes"] > 0]
        breakdown.append({"id": "custom_cards", "path": "www", "bytes": total})
        breakdown.sort(key=lambda item: item["bytes"], reverse=True)
    return total


async def system_usage(
    hass: HomeAssistant, used_card_types: set[str] | None = None
) -> dict[str, Any]:
    """Storage and system: everything the "Storage & system" page shows.

    ``used_card_types`` are the ``custom:`` card types of all dashboards (``None`` when unknown).
    """
    config_dir = hass.config.config_dir
    local, supervisor, resources, blueprints = await asyncio.gather(
        hass.async_add_executor_job(collect_local, config_dir),
        supervisor_part(hass),
        dashboard_resources(hass),
        blueprint_list(hass),
    )
    sizes, bp_sizes = await asyncio.gather(
        hass.async_add_executor_job(card_sizes, config_dir, [r["url"] for r in resources]),
        hass.async_add_executor_job(
            blueprint_sizes, config_dir, [(b["domain"], b["path"]) for b in blueprints]
        ),
    )
    cards = []
    for resource in resources:
        size = sizes.get(resource["url"]) or {}
        cards.append(
            {
                **resource,
                "bytes": size.get("bytes"),
                "scope": size.get("scope"),
                "path": size.get("path"),
                "local": size.get("local", False),
                "exists": size.get("exists", False),
                "elements": size.get("elements", []),
            }
        )
    for blueprint, size in zip(blueprints, bp_sizes, strict=True):
        blueprint["bytes"] = size

    storage = local["storage"]
    cards_total = merge_cards(storage["breakdown"], cards, config_dir)
    # The host's data disk says more than the container's file system where a Supervisor runs.
    disk = supervisor.get("disk") or local["disk"]
    apps = supervisor.get("apps") or []
    return {
        "supervisor": bool(supervisor.get("available")),
        "cpu": local["cpu"],
        "load": local["load"],
        "ram": local["ram"],
        "swap": local["swap"],
        "disk": disk,
        "categories": supervisor.get("categories") or {},
        "breakdown": storage["breakdown"],
        "custom_integrations": storage["custom_integrations"],
        "apps": apps,
        "apps_memory": sum(app.get("memory_usage") or 0 for app in apps),
        # Paths are relative to the configuration directory; the absolute path stays on the server.
        "cards": [
            {
                **{k: v for k, v in card.items() if k not in ("path", "local", "exists")},
                "status": card_status(card, used_card_types),
            }
            for card in cards
        ],
        "cards_total": cards_total,
        "blueprints": blueprints,
    }


async def system_light(hass: HomeAssistant) -> dict[str, Any]:
    """Disk, memory and CPU only, for the overview; no folder is walked (system_usage does that)."""
    config_dir = hass.config.config_dir

    def local() -> dict[str, Any]:
        return {"cpu": cpu_percent(), "ram": memory()["ram"], "disk": disk_usage(config_dir)}

    read, info = await asyncio.gather(
        hass.async_add_executor_job(local), supervisor_get(hass, "/host/info")
    )
    # The host's data disk says more than the container's file system where a Supervisor runs.
    return {
        "disk": host_disk(info) or read["disk"],
        "ram": read["ram"],
        "cpu": {"percent": read["cpu"]},
    }
