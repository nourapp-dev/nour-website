"""Remove visible helper text while preserving editable Word content controls.

Run against the supplied blank originals, never completed qualification files.
Stage documents for render verification; publication is a separate explicit step.
"""
from pathlib import Path
from zipfile import ZipFile
import argparse
import re

PHRASES = ("انقر هنا لاستكمال البيانات", "Click here to enter details")

def clean(source, destination):
    with ZipFile(source) as original:
        document = original.read("word/document.xml").decode("utf-8")
        count = sum(document.count(phrase) for phrase in PHRASES)
        if count != 48:
            raise ValueError(f"Expected 48 blank-field hints, found {count}")
        # Preserve every OOXML prefix, extension namespace and editable SDT.
        # A non-breaking space prevents Word from displaying its default hint.
        for phrase in PHRASES:
            document = re.sub(r'<w:t(?:\s[^>]*)?>' + re.escape(phrase) + r'</w:t>',
                              '<w:t xml:space="preserve">&#160;</w:t>', document)
        # Placeholder run formatting must not make subsequently typed answers gray.
        document = document.replace('<w:color w:val="8795A5"/>', '<w:color w:val="172B45"/>')
        if any(phrase in document for phrase in PHRASES):
            raise ValueError("A visible field hint survived cleanup")
        destination.parent.mkdir(parents=True, exist_ok=True)
        with ZipFile(destination, "w") as output:
            for entry in original.infolist():
                output.writestr(entry, document.encode("utf-8") if entry.filename == "word/document.xml" else original.read(entry.filename))
    print(f"Cleaned {count} fields: {destination}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path)
    parser.add_argument("destination", type=Path)
    args = parser.parse_args()
    clean(args.source, args.destination)
