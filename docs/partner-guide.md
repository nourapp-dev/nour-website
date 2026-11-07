# Partner guide sources and maintenance

The guide at `/become-a-partner/guide` uses the four blank files supplied by the
user on 6 November 2026. Website copies are maintained in `public/documents/partners`; the user originals remain untouched.

- Arabic: `Nour_App_International_Partner_Readiness_Pack.docx` and `.pdf`, version 1.1.
- English: `Nour_App_International_Partner_Readiness_Pack_EN.docx` and `.pdf`, version 1.2.
- Both source release stamps are dated 6 November 2026.
- The user explicitly accepted the supplied Arabic version after being told it was 1.1.
  The site retains that version instead of relabelling it as 1.2.
- All twenty supplied PDF pages were rendered and visually reviewed. The English
  PDF has readable, separated text. The Arabic PDF is image based; HTML text comes
  from its matching DOCX, not OCR.

`src/features/applications/data/partner-guide.{ar,en}.json` retains all ten
sections, 48 readiness field labels, explanatory paragraphs, tables and the
representative declaration. Repeated blank Word input placeholders are presented
as a read-only checklist, not extra required fields in the interest form.
`partner-guide.ts` derives locale downloads from each source version.
`docs/partner-guide-sources.json` records SHA-256 checksums of both the original and current website copies.

To regenerate content after reviewing an approved source:

```powershell
python scripts/partners/import_guide.py path/to/approved.docx
```

The importer deliberately accepts only the reviewed release stamps. Review new
release metadata and update its checks before importing a later edition. Copy
only blank templates into public storage. Never place completed qualification
files, identity documents or banking information under `public/`.

Tests check both rendered languages, direction, navigation, all 48 labels,
version-specific downloads and the reviewed download checksums. No database changes
are needed for the guide. The previously prepared partner workflow migration is
separate and remains unapplied; this change does not validate that migration.

## Blank-field layout revision

On user request, the website Word templates no longer display the 48 repeated
field hints in either language. Their editable content controls, borders and
spacing remain. Text entered later uses the regular dark body color. Every
requirement, table, field label, release date and source version is preserved;
the importer verifies semantic equality before replacing the website copies.

PDFs were re-exported from the cleaned DOCX using local Microsoft Word. Both
remain ten pages and all twenty pages were rendered and inspected after export.
The packaged render_docx.py was attempted first but its pdf2image dependency and
bundled runtime were unavailable in this Windows session. Native Word export
and PyMuPDF rasterization provided the visual verification instead.

Use scripts/partners/clean_guide_fields.py to stage a new cleanup from the blank
originals. The importer also understands empty PARTNER_ content controls, so
future imports do not lose the 48 readiness field labels.
