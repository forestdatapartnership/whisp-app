#!/usr/bin/env python3
"""Find recent whisp-tagged questions on the Open Foris support forum.

Reads the site-wide Q2A RSS feed, keeps only items carrying the `whisp`
category, and drops anything older than MAX_AGE_DAYS. Emits a JSON array on
stdout. No LLM involved -- this step is pure parsing, so the common case
(nothing new) costs nothing.

The caller owns deduplication: it passes the ids it has already handled in
FORUM_SEEN_IDS and records new ones only after dispatching them.
"""

import json
import os
import re
import sys
import urllib.request
import xml.etree.ElementTree as ET
from email.utils import parsedate_to_datetime
from datetime import datetime, timezone, timedelta

FEED_URL = os.environ.get("FORUM_FEED_URL", "https://openforis.support/feeds/rss")
TAG = os.environ.get("FORUM_TAG", "whisp").strip().lower()
MAX_AGE_DAYS = int(os.environ.get("MAX_AGE_DAYS", "7"))
MAX_ITEMS = int(os.environ.get("MAX_NEW_PER_RUN", "3"))
# When set, return just this question and ignore the age window. Lets a
# downstream job re-read one question by id instead of receiving its text
# through workflow inputs, where quoting and length limits bite.
ONLY_ID = os.environ.get("FORUM_ONLY_ID", "").strip()
SEEN_IDS = {
    i.strip() for i in os.environ.get("FORUM_SEEN_IDS", "").split(",") if i.strip()
}

QUESTION_ID_RE = re.compile(r"/questions/(\d+)")
HTML_TAG_RE = re.compile(r"<[^>]+>")
WHITESPACE_RE = re.compile(r"\s+")

ISSUE_TEMPLATE = """Reported on the Open Foris support forum.

**Question:** [{title}]({url})
**Asked:** {published}
**Marker:** `forum#{qid}`

---

{body}

---

_Opened automatically by Forum Triage, which classified this as whisp-app
rather than whisp-library or whisp-map._"""


def text_of(node):
    return (node.text or "").strip() if node is not None else ""


def strip_html(raw):
    """Q2A puts the question body in <description> as escaped HTML."""
    return WHITESPACE_RE.sub(" ", HTML_TAG_RE.sub(" ", raw)).strip()


def fetch(url):
    req = urllib.request.Request(
        url, headers={"User-Agent": "whisp-app-forum-watch (+github actions)"}
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        return resp.read()


def collect(raw, cutoff):
    root = ET.fromstring(raw)
    found = []

    for item in root.iterfind("./channel/item"):
        categories = {text_of(c).lower() for c in item.iterfind("category")}
        if TAG not in categories:
            continue

        link = text_of(item.find("link"))
        match = QUESTION_ID_RE.search(link)
        if not match:
            continue

        qid = match.group(1)
        if ONLY_ID and qid != ONLY_ID:
            continue
        if qid in SEEN_IDS:
            continue

        try:
            when = parsedate_to_datetime(text_of(item.find("pubDate")))
        except (TypeError, ValueError):
            continue
        if when.tzinfo is None:
            when = when.replace(tzinfo=timezone.utc)
        # A targeted lookup by id must not be filtered by age.
        if not ONLY_ID and when < cutoff:
            continue

        title = text_of(item.find("title"))
        body = strip_html(text_of(item.find("description")))[:4000]

        found.append(
            {
                "id": qid,
                "title": title,
                "url": link,
                "published": when.isoformat(),
                "tags": sorted(categories),
                "body": body,
                # Rendered here rather than assembled in shell, so question
                # text containing quotes, backticks or $ cannot break the job.
                "issue_body": ISSUE_TEMPLATE.format(
                    title=title,
                    url=link,
                    published=when.isoformat(),
                    qid=qid,
                    body=body,
                ),
            }
        )

    # Oldest first, so a backlog is worked through in the order reported.
    found.sort(key=lambda i: i["published"])
    return found


def main():
    try:
        raw = fetch(FEED_URL)
    except Exception as exc:  # noqa: BLE001 - a fetch blip must not fail the job
        print(f"::warning::Could not fetch {FEED_URL}: {exc}", file=sys.stderr)
        print("[]")
        return 0

    try:
        found = collect(raw, datetime.now(timezone.utc) - timedelta(days=MAX_AGE_DAYS))
    except ET.ParseError as exc:
        print(f"::warning::Feed did not parse as XML: {exc}", file=sys.stderr)
        print("[]")
        return 0

    print(json.dumps(found[:MAX_ITEMS], indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
