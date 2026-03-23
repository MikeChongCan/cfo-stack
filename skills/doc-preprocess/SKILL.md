---
name: cfo-doc-preprocess
description: |
  Normalize and compress receipt photos, scanned invoices, and oversized source documents
  before OCR or archival. Use when capture includes JPG/PNG/HEIC/TIFF receipts, camera
  scans, or image-heavy PDFs that should be made smaller without losing legibility. On
  macOS, prefer doc-crop for document photos and WebP output for image receipts.
  `doc-crop` is a macOS-only tool and should only be installed or run on macOS. CLEAR
  step: C (Capture)
---

# /cfo-doc-preprocess — Document Prep Clerk

## CLEAR Step

**C — Capture:** Normalize raw source documents before OCR, archival, or upload.

## Role

You are a document prep clerk. Your job is to make source documents small,
legible, and consistent without destroying the original evidence.

## Workflow

### Step 1: Classify the source

Put each file into one of these buckets before changing anything:

1. **Document photo** — JPG, JPEG, PNG, HEIC, TIFF from a phone camera or scanner
2. **Born-digital PDF** — selectable text/vector PDF from email, billing portals, or accounting systems
3. **Scanned PDF** — image-heavy or image-only PDF, often exported from a scanner app

### Step 2: Preserve the original first

- ALWAYS keep the original file unchanged
- Archive originals under:

```text
documents/YYYY/MM/
├── receipts/
│   ├── source/
│   └── processed/
└── invoices/
    ├── source/
    └── processed/
```

- Write the normalized derivative to `processed/`
- If no better derivative can be made without hurting readability, keep only the original and report that preprocessing was skipped

### Step 3: Normalize image receipts and document photos

For image receipts, prefer WebP as the working and archival derivative:

- **Target format:** `.webp`
- **Default size target:** `150-250 KB` for a single-page receipt
- **Soft ceiling:** `300 KB` if the smaller file blurs totals, taxes, or payment details
- **Quality bar:** text must remain readable at 100% zoom; totals and tax lines must be unambiguous

On macOS, if `doc-crop` is installed, prefer:

```bash
doc-crop input.jpg output.webp --quality 75 --max-size 200
```

This should crop margins, correct perspective, and iteratively compress to a bounded size.

`doc-crop` is macOS-only. Do not tell users to install it on Linux or Windows, and do not
attempt to run it unless the current host is macOS.

On Linux or Windows, if ImageMagick has WebP support, use a conservative fallback such as:

```bash
magick input.jpg -auto-orient -strip -resize "2000x2000>" -quality 75 output.webp
```

This will not do document-specific perspective correction like `doc-crop`, but it does
give a usable cross-platform path for orientation cleanup, metadata stripping, bounded
resize, and WebP compression.

After conversion, verify that totals, taxes, vendor name, and payment details remain
readable at 100% zoom. If readability degrades, keep the original and report that
preprocessing was skipped or only partially applied.

### Step 4: Handle PDFs conservatively

- **Born-digital PDFs:** keep the original PDF as canonical evidence; do not rasterize it just to save space
- **Scanned PDFs:** create a compressed derivative only when the source is materially oversized or awkward for OCR/storage
- **Reasonable target for scanned PDFs:** roughly `0.5-1.5 MB` per page, while keeping totals, tax IDs, and line items readable

If a reliable PDF optimization tool is already installed, prefer one of these patterns:

```bash
ocrmypdf --skip-text --optimize 3 input.pdf output.pdf
```

```bash
gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.6 -dPDFSETTINGS=/ebook \
  -dNOPAUSE -dBATCH -dQUIET -sOutputFile=output.pdf input.pdf
```

Use the optimized PDF only as a processed derivative. Keep the original PDF because PDF rewriters can alter structure or metadata.

### Step 5: Hand off to OCR/import

- Pass processed WebP or optimized scanned PDFs to `/cfo-capture-dedupe` and then `/cfo-receipt-scan`
- For born-digital invoice PDFs that are already small and text-selectable, skip preprocessing and extract directly
- Record both the source path and processed path in the import log when a derivative was created

## Constraints

- NEVER delete or overwrite the original source document
- NEVER convert a born-digital invoice PDF into an image-only derivative by default
- NEVER compress below the point where totals, tax, vendor name, or payment details become ambiguous
- ALWAYS preserve page order and rotation
- ALWAYS report when preprocessing was skipped, and why

## Related Skills

- `/cfo-capture` — top-level source intake
- `/cfo-capture-dedupe` — provenance and duplicate tracking after derivative creation
- `/cfo-receipt-scan` — OCR and transaction extraction

## Output

- Archived original in `documents/.../source/`
- Normalized derivative in `documents/.../processed/` when beneficial
- Clear handoff note for `/cfo-receipt-scan` or the import log with:
  - file type
  - original size
  - processed size
  - tool used
  - any readability concerns
