#!/usr/bin/env python3
"""Fail a printed architecture PDF that an agent cannot ingest or a human cannot read.

Checks:
- page count (optional --expect-pages)
- no literal {placeholder} from non-f-strings
- Mermaid source in the text layer (flowchart / sequenceDiagram)
- ingest codes present
- footer is the last block on each page (overflow into footer)

Usage:
  python3 verify_print_pdf.py path/to.pdf [--expect-pages 55]
  python3 verify_print_pdf.py path/to.pdf --expect-pages 46 --needles "flowchart TB,SURF-DASH"
"""
from __future__ import annotations

import argparse
import re
import subprocess
import sys
from pathlib import Path


FOOTER_MARK = "Internal · Confidential"
PLACEHOLDER = re.compile(r"\{([a-zA-Z_][a-zA-Z0-9_]*)\}")
ALLOWED_PLACEHOLDERS = {"id", "hash", "tenant", "route", "runId", "tenantId", "resource"}


def run(cmd: list[str]) -> str:
    p = subprocess.run(cmd, capture_output=True, text=True)
    if p.returncode != 0:
        raise SystemExit(f"FAIL command {' '.join(cmd)}: {p.stderr.strip() or p.stdout.strip()}")
    return p.stdout


def pdf_pages(pdf: Path) -> int:
    out = run(["pdfinfo", str(pdf)])
    for line in out.splitlines():
        if line.startswith("Pages:"):
            return int(line.split(":")[1].strip())
    raise SystemExit("FAIL pdfinfo: no Pages field")


def pdf_text(pdf: Path) -> str:
    return run(["pdftotext", "-layout", str(pdf), "-"])


def split_pages(text: str) -> list[str]:
    return text.split("\x0c")


def nonempty_lines(page: str) -> list[str]:
    return [ln.rstrip() for ln in page.splitlines() if ln.strip()]


def footer_is_last(page: str) -> bool:
    """Overflow is body after the last Sheet n / N (the drawing-frame footer).

    Title blocks also contain a sheet field. Matching the first hit false-fails covers.
    """
    lines = nonempty_lines(page)
    if not lines:
        return True
    sheet_re = re.compile(r"Sheet\s+\d+\s*/\s*\d+")
    idx = None
    for i, ln in enumerate(lines):
        if sheet_re.search(ln):
            idx = i
    if idx is None:
        return True
    after = lines[idx + 1 :]
    return len(after) == 0


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("pdf")
    ap.add_argument(
        "--expect-pages",
        type=int,
        default=0,
        help="Fail when pdfinfo or pdftotext page count differs",
    )
    ap.add_argument(
        "--needles",
        default="flowchart TB,UNIT-APP,ADR-C3,TenantDataContext,INGEST-JSON,You are implementing AKADEMATE",
        help="Comma-separated strings that must appear in the text layer",
    )
    args = ap.parse_args()
    pdf = Path(args.pdf).resolve()
    if not pdf.is_file():
        raise SystemExit(f"FAIL missing PDF: {pdf}")

    errors: list[str] = []
    n = pdf_pages(pdf)
    if args.expect_pages and n != args.expect_pages:
        errors.append(f"page count {n} != {args.expect_pages}")

    text = pdf_text(pdf)
    if len(text) < 8000:
        errors.append(f"text layer too small ({len(text)} chars)")

    for needle in (item.strip() for item in args.needles.split(",") if item.strip()):
        if needle not in text:
            errors.append(f"missing text: {needle}")

    found = {m.group(1) for m in PLACEHOLDER.finditer(text)}
    bad = sorted(found - ALLOWED_PLACEHOLDERS)
    if bad:
        errors.append("literal placeholders: " + ", ".join("{" + name + "}" for name in bad))

    pages = [p for p in split_pages(text) if nonempty_lines(p)]
    if args.expect_pages and len(pages) != args.expect_pages:
        errors.append(f"pdftotext pages {len(pages)} != {args.expect_pages}")

    sheet_re = re.compile(r"Sheet\s+\d+\s*/\s*\d+")
    for i, page in enumerate(pages, 1):
        if not sheet_re.search(page):
            errors.append(f"sheet {i}: missing Sheet n / N")
        if not footer_is_last(page):
            errors.append(f"sheet {i}: body continues after footer (overflow)")

    if errors:
        print("FAIL")
        for e in errors:
            print(f"  - {e}")
        raise SystemExit(1)
    print(f"OK  pages={n}  chars={len(text)}")


if __name__ == "__main__":
    main()
