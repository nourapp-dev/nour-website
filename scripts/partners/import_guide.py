"""Import approved partner guide content without interpreting document instructions.

Usage: python scripts/partners/import_guide.py /absolute/path/to/approved.docx
Supports approved English v1.2 and the Arabic v1.1 source accepted by the user.
Preserves each source version; never relabels Arabic v1.1 as v1.2.
The DOCX is read only. Assets are copied separately after PDF visual review.
"""
from pathlib import Path
import json
import re
import sys
import xml.etree.ElementTree as ET
from zipfile import ZipFile

NS = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}
W = "{" + NS["w"] + "}"

def text(element):
    # Word line breaks separate words even when adjacent text runs do not.
    return "".join(
        (node.text or "") if node.tag == W + "t"
        else " " if node.tag in (W + "br", W + "cr", W + "tab") else ""
        for node in element.iter()
    ).strip()

def extract(path):
    with ZipFile(path) as archive:
        root = ET.fromstring(archive.read("word/document.xml"))
    body = root.find("w:body", NS)
    paragraphs = [text(node) for node in body if node.tag == W + "p"]
    english_stamp = "Approved for Partner Onboarding  |  Version 1.2  |  6 November 2026"
    arabic_stamp = "الإصدار ١٫١  |  ٦ نوفمبر ٢٠٢٦"
    if english_stamp in paragraphs:
        language, version, stamp = "en", "1.2", english_stamp
    elif arabic_stamp in paragraphs:
        language, version, stamp = "ar", "1.1", arabic_stamp
    else:
        raise ValueError("Unrecognized release stamp; refusing import")
    sections = []
    title = None
    for node in body:
        if node.tag == W + "p":
            value = text(node)
            tag = node.find("w:sdt/w:sdtPr/w:tag", NS)
            is_blank_field = tag is not None and tag.get(W + "val", "").startswith("PARTNER_") and not value.strip()
            if is_blank_field:
                if not sections[-1]["blocks"] or sections[-1]["blocks"][-1]["kind"] != "paragraph":
                    raise ValueError("Unexpected blank form field structure")
                sections[-1]["blocks"][-1]["kind"] = "field"
                continue
            if not value or value == stamp:
                continue
            marker = re.fullmatch(r"(?:READINESS AND APPROVAL|التجهيز والاعتماد)\s*/\s*(\d+)\s*/\s*([A-Z]+)", value)
            if marker:
                sections.append({"id": marker[2].lower(), "title": "نظرة عامة" if language == "ar" else "Overview", "blocks": []})
                continue
            style_node = node.find("w:pPr/w:pStyle", NS)
            style = style_node.get(W + "val") if style_node is not None else ""
            if style == "Title":
                title = value
                continue
            if style == "Heading1":
                sections[-1]["title"] = value
                continue
            if value in ("Click here to enter details", "انقر هنا لاستكمال البيانات"):
                if not sections[-1]["blocks"] or sections[-1]["blocks"][-1]["kind"] != "paragraph":
                    raise ValueError("Unexpected form field structure")
                sections[-1]["blocks"][-1]["kind"] = "field"
                continue
            sections[-1]["blocks"].append({"kind": "heading" if style == "Heading2" else "paragraph", "text": value})
        elif node.tag == W + "tbl":
            rows = [[text(cell) for cell in row.findall("w:tc", NS)] for row in node.findall("w:tr", NS)]
            sections[-1]["blocks"].append({"kind": "table", "rows": rows})
    if len(sections) != 10 or sum(block["kind"] == "field" for section in sections for block in section["blocks"]) != 48:
        raise ValueError("Expected ten sections and 48 readiness fields")
    return {"language": language, "title": title, "version": version, "updatedAt": "2026-11-06", "sections": sections}

if __name__ == "__main__":
    guide = extract(Path(sys.argv[1]))
    destination = Path(__file__).resolve().parents[2] / f"src/features/applications/data/partner-guide.{guide['language']}.json"
    destination.write_text(json.dumps(guide, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Imported {len(guide['sections'])} sections and 48 fields")
