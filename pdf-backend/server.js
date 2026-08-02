const express = require("express");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");
const os = require("os");
const { execFile } = require("child_process");
const crypto = require("crypto");

const app = express();

const PORT = process.env.PORT || 4000;

const ALLOWED_ORIGINS = [
  "https://toolversee.pages.dev",
  "http://localhost:3000",
  "http://localhost:3001",
];

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }

      if (ALLOWED_ORIGINS.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  }),
);

app.use(express.json({ limit: "5mb" }));

const pdfStorage = multer.diskStorage({
  destination: async function (_req, _file, callback) {
    const uploadDir = path.join(os.tmpdir(), "toolversex-pdf-uploads");

    try {
      await fsp.mkdir(uploadDir, { recursive: true });
      callback(null, uploadDir);
    } catch (error) {
      callback(error);
    }
  },
  filename: function (_req, file, callback) {
    const id = crypto.randomBytes(16).toString("hex");
    const safeOriginalName =
      path
        .basename(file.originalname || "document")
        .replace(/[^a-zA-Z0-9._-]/g, "-")
        .slice(0, 80) || "document";

    callback(null, `${id}-${safeOriginalName}`);
  },
});

const upload = multer({
  storage: pdfStorage,
  limits: {
    fileSize: 50 * 1024 * 1024,
    files: 1,
  },
  fileFilter: function (_req, file, callback) {
    const name = file.originalname.toLowerCase();

    const isAllowed =
      file.mimetype === "application/pdf" ||
      name.endsWith(".pdf") ||
      name.endsWith(".doc") ||
      name.endsWith(".docx") ||
      name.endsWith(".ppt") ||
      name.endsWith(".pptx") ||
      name.endsWith(".xls") ||
      name.endsWith(".xlsx");

    if (!isAllowed) {
      callback(new Error("Only PDF or Office files are allowed."));
      return;
    }

    callback(null, true);
  },
});

const compareUpload = multer({
  storage: pdfStorage,
  limits: {
    fileSize: 50 * 1024 * 1024,
    files: 2,
  },
  fileFilter: function (_req, file, callback) {
    const isPdf =
      file.mimetype === "application/pdf" ||
      file.originalname.toLowerCase().endsWith(".pdf");

    if (!isPdf) {
      callback(new Error("Only PDF files are allowed."));
      return;
    }

    callback(null, true);
  },
});

function runPythonScript(script, args, fallbackMessage, timeout = 240000) {
  return new Promise((resolve, reject) => {
    execFile(
      "python3",
      ["-c", script, ...args],
      { timeout },
      (error, stdout, stderr) => {
        if (error) {
          reject(new Error(stderr || stdout || error.message || fallbackMessage));
          return;
        }

        resolve(stdout);
      },
    );
  });
}

function getPdfSettings(quality) {
  const value = Number(quality);

  if (Number.isNaN(value)) return "/ebook";
  if (value >= 0.85) return "/printer";
  if (value >= 0.6) return "/ebook";

  return "/screen";
}

function getImageResolution(quality) {
  const value = Number(quality);

  if (Number.isNaN(value)) {
    return { color: "120", gray: "120", mono: "150" };
  }

  if (value >= 0.85) {
    return { color: "220", gray: "220", mono: "300" };
  }

  if (value >= 0.6) {
    return { color: "150", gray: "150", mono: "200" };
  }

  if (value >= 0.35) {
    return { color: "100", gray: "100", mono: "150" };
  }

  return { color: "72", gray: "72", mono: "100" };
}

function compressWithGhostscript(inputPath, outputPath, quality) {
  const pdfSettings = getPdfSettings(quality);
  const resolution = getImageResolution(quality);

  const args = [
    "-sDEVICE=pdfwrite",
    "-dCompatibilityLevel=1.4",
    `-dPDFSETTINGS=${pdfSettings}`,
    "-dNOPAUSE",
    "-dQUIET",
    "-dBATCH",
    "-dDetectDuplicateImages=true",
    "-dCompressFonts=true",
    "-dSubsetFonts=true",
    "-dEmbedAllFonts=true",
    "-dAutoRotatePages=/None",
    "-dColorImageDownsampleType=/Bicubic",
    `-dColorImageResolution=${resolution.color}`,
    "-dGrayImageDownsampleType=/Bicubic",
    `-dGrayImageResolution=${resolution.gray}`,
    "-dMonoImageDownsampleType=/Subsample",
    `-dMonoImageResolution=${resolution.mono}`,
    "-dColorImageDownsampleThreshold=1.0",
    "-dGrayImageDownsampleThreshold=1.0",
    "-dMonoImageDownsampleThreshold=1.0",
    `-sOutputFile=${outputPath}`,
    inputPath,
  ];

  return new Promise((resolve, reject) => {
    execFile("gs", args, { timeout: 120000 }, (error, stdout, stderr) => {
      if (error) {
        reject(
          new Error(
            stderr ||
              stdout ||
              error.message ||
              "Ghostscript PDF compression failed.",
          ),
        );
        return;
      }

      resolve();
    });
  });
}

function pdfToWord(inputPath, outputPath) {
  const pyScript = `
import sys
from pdf2docx import Converter

input_path = sys.argv[1]
output_path = sys.argv[2]

converter = Converter(input_path)

try:
    converter.convert(output_path, start=0, end=None)
finally:
    converter.close()
`.trim();

  return runPythonScript(
    pyScript,
    [inputPath, outputPath],
    "PDF to Word conversion failed.",
  );
}

function pdfToExcel(inputPath, outputPath) {
  const pyScript = `
import re
import sys
import fitz
from openpyxl import Workbook

input_path = sys.argv[1]
output_path = sys.argv[2]

def safe_sheet_name(name):
    name = re.sub(r'[\\\\/*?:\\[\\]]', "-", name).strip()
    return (name or "Sheet")[:31]

doc = fitz.open(input_path)
wb = Workbook()
default_sheet = wb.active
wb.remove(default_sheet)

for page_index, page in enumerate(doc):
    sheet = wb.create_sheet(safe_sheet_name(f"Page {page_index + 1}"))
    wrote_data = False

    try:
        tables_result = page.find_tables()
        tables = getattr(tables_result, "tables", []) if tables_result else []

        current_row = 1
        for table in tables:
            extracted = table.extract() or []
            if not extracted:
                continue

            for row_values in extracted:
                for col_index, cell_value in enumerate(row_values, start=1):
                    sheet.cell(current_row, col_index, "" if cell_value is None else str(cell_value))
                current_row += 1

            current_row += 2
            wrote_data = True
    except Exception:
        pass

    if not wrote_data:
        text = page.get_text("text").strip()
        lines = [line.strip() for line in text.splitlines() if line.strip()]

        if not lines:
            sheet["A1"] = "No extractable text found on this page."
            continue

        for row_index, line in enumerate(lines, start=1):
            parts = [part.strip() for part in re.split(r'\\t|\\s{2,}', line) if part.strip()]
            if len(parts) <= 1:
                sheet.cell(row_index, 1, line)
            else:
                for col_index, value in enumerate(parts, start=1):
                    sheet.cell(row_index, col_index, value)

wb.save(output_path)
`.trim();

  return runPythonScript(
    pyScript,
    [inputPath, outputPath],
    "PDF to Excel conversion failed.",
  );
}

function pdfToPowerPoint(inputPath, outputPath) {
  const pyScript = `
import io
import os
import sys
import fitz
import tempfile
from PIL import Image
from pptx import Presentation

input_path = sys.argv[1]
output_path = sys.argv[2]

prs = Presentation()
prs.slide_width = 12192000
prs.slide_height = 6858000
blank_layout = prs.slide_layouts[6]

doc = fitz.open(input_path)
temp_files = []

try:
    for page_index, page in enumerate(doc):
        pix = page.get_pixmap(matrix=fitz.Matrix(2, 2), alpha=False)
        png_bytes = pix.tobytes("png")

        image = Image.open(io.BytesIO(png_bytes))
        img_width, img_height = image.size

        slide = prs.slides.add_slide(blank_layout)

        max_width = prs.slide_width
        max_height = prs.slide_height
        scale = min(max_width / img_width, max_height / img_height)

        width = int(img_width * scale)
        height = int(img_height * scale)
        left = int((max_width - width) / 2)
        top = int((max_height - height) / 2)

        fd, temp_path = tempfile.mkstemp(suffix=f"-page-{page_index + 1}.png")
        os.close(fd)

        with open(temp_path, "wb") as file_obj:
            file_obj.write(png_bytes)

        temp_files.append(temp_path)
        slide.shapes.add_picture(temp_path, left, top, width=width, height=height)

    if len(prs.slides) == 0:
        prs.slides.add_slide(blank_layout)

    prs.save(output_path)
finally:
    doc.close()
    for temp_path in temp_files:
        try:
            os.remove(temp_path)
        except OSError:
            pass
`.trim();

  return runPythonScript(
    pyScript,
    [inputPath, outputPath],
    "PDF to PowerPoint conversion failed.",
  );
}

function pdfToJpg(inputPath, outputDir) {
  const outputPrefix = path.join(outputDir, "page");
  const args = ["-jpeg", "-r", "180", inputPath, outputPrefix];

  return new Promise((resolve, reject) => {
    execFile("pdftoppm", args, { timeout: 240000 }, (error, stdout, stderr) => {
      if (error) {
        reject(
          new Error(
            stderr || stdout || error.message || "PDF to JPG conversion failed.",
          ),
        );
        return;
      }

      resolve();
    });
  });
}

function zipFiles(files, outputPath, cwd) {
  return new Promise((resolve, reject) => {
    execFile(
      "zip",
      ["-j", outputPath, ...files],
      { timeout: 120000, cwd },
      (error, stdout, stderr) => {
        if (error) {
          reject(
            new Error(
              stderr || stdout || error.message || "Could not create ZIP file.",
            ),
          );
          return;
        }

        resolve();
      },
    );
  });
}

function pdfToPdfa(inputPath, outputPath) {
  const args = [
    "-dPDFA=2",
    "-dBATCH",
    "-dNOPAUSE",
    "-dNOOUTERSAVE",
    "-sColorConversionStrategy=RGB",
    "-sDEVICE=pdfwrite",
    "-dPDFACompatibilityPolicy=1",
    `-sOutputFile=${outputPath}`,
    inputPath,
  ];

  return new Promise((resolve, reject) => {
    execFile("gs", args, { timeout: 240000 }, (error, stdout, stderr) => {
      if (error) {
        reject(
          new Error(stderr || stdout || error.message || "PDF/A conversion failed."),
        );
        return;
      }

      resolve();
    });
  });
}

/**
 * Updated: returns a clean professional message for wrong password instead of traceback.
 */
function unlockPdf(inputPath, outputPath, password) {
  const pyScript = `
import sys
import pikepdf

input_path = sys.argv[1]
output_path = sys.argv[2]
password = sys.argv[3]

try:
    with pikepdf.open(input_path, password=password) as pdf:
        pdf.save(output_path)
except pikepdf.PasswordError:
    print("INVALID_PASSWORD", file=sys.stderr)
    sys.exit(2)
except Exception as error:
    print(str(error), file=sys.stderr)
    sys.exit(1)
`.trim();

  return new Promise((resolve, reject) => {
    execFile(
      "python3",
      ["-c", pyScript, inputPath, outputPath, password],
      { timeout: 240000 },
      (error, stdout, stderr) => {
        const details = stderr || stdout || error?.message || "";

        if (error) {
          if (details.includes("INVALID_PASSWORD")) {
            reject(
              new Error(
                "The password you entered is incorrect. Please check the current PDF password and try again.",
              ),
            );
            return;
          }

          reject(
            new Error(
              "We could not unlock this PDF. Please make sure the file is password-protected and try again.",
            ),
          );
          return;
        }

        resolve();
      },
    );
  });
}

function protectPdf(inputPath, outputPath, password, ownerPassword) {
  const pyScript = `
import sys
import pikepdf

input_path = sys.argv[1]
output_path = sys.argv[2]
user_password = sys.argv[3]
owner_password = sys.argv[4] or user_password

with pikepdf.open(input_path) as pdf:
    pdf.save(
        output_path,
        encryption=pikepdf.Encryption(
            user=user_password,
            owner=owner_password,
            R=6,
        ),
    )
`.trim();

  return runPythonScript(
    pyScript,
    [inputPath, outputPath, password, ownerPassword || password],
    "Could not protect this PDF.",
  );
}

function redactPdf(inputPath, outputPath, termsText) {
  const pyScript = `
import sys
import fitz

input_path = sys.argv[1]
output_path = sys.argv[2]
terms_text = sys.argv[3]

terms = [term.strip() for term in terms_text.replace("\\n", ",").split(",") if term.strip()]

if not terms:
    raise RuntimeError("Enter at least one redaction term.")

doc = fitz.open(input_path)

for page in doc:
    for term in terms:
        areas = page.search_for(term)
        for rect in areas:
            page.add_redact_annot(rect, fill=(0, 0, 0))

    page.apply_redactions()

doc.save(output_path)
doc.close()
`.trim();

  return runPythonScript(
    pyScript,
    [inputPath, outputPath, termsText],
    "Could not redact this PDF.",
  );
}

function comparePdfs(firstPath, secondPath) {
  const pyScript = `
import sys
import json
import difflib
import fitz

first_path = sys.argv[1]
second_path = sys.argv[2]

first_doc = fitz.open(first_path)
second_doc = fitz.open(second_path)

max_pages = max(first_doc.page_count, second_doc.page_count)
pages = []
changed_pages = 0

for index in range(max_pages):
    first_text = ""
    second_text = ""

    if index < first_doc.page_count:
        first_text = first_doc[index].get_text("text")

    if index < second_doc.page_count:
        second_text = second_doc[index].get_text("text")

    similarity = difflib.SequenceMatcher(None, first_text, second_text).ratio()
    identical = first_text == second_text

    if not identical:
        changed_pages += 1

    diff = list(
        difflib.unified_diff(
            first_text.splitlines(),
            second_text.splitlines(),
            fromfile="first",
            tofile="second",
            lineterm="",
        )
    )

    pages.append({
        "page": index + 1,
        "identical": identical,
        "similarity": round(similarity, 4),
        "firstLength": len(first_text),
        "secondLength": len(second_text),
        "diffPreview": diff[:60],
    })

result = {
    "identical": changed_pages == 0 and first_doc.page_count == second_doc.page_count,
    "firstPageCount": first_doc.page_count,
    "secondPageCount": second_doc.page_count,
    "changedPages": changed_pages,
    "pages": pages,
}

first_doc.close()
second_doc.close()

print(json.dumps(result))
`.trim();

  return new Promise((resolve, reject) => {
    execFile(
      "python3",
      ["-c", pyScript, firstPath, secondPath],
      { timeout: 240000 },
      (error, stdout, stderr) => {
        if (error) {
          reject(
            new Error(
              stderr || stdout || error.message || "Could not compare these PDFs.",
            ),
          );
          return;
        }

        try {
          resolve(JSON.parse(stdout));
        } catch {
          reject(new Error("Could not parse PDF comparison result."));
        }
      },
    );
  });
}

function isOfficeFile(file) {
  const name = (file.originalname || "").toLowerCase();

  return (
    name.endsWith(".doc") ||
    name.endsWith(".docx") ||
    name.endsWith(".ppt") ||
    name.endsWith(".pptx") ||
    name.endsWith(".xls") ||
    name.endsWith(".xlsx")
  );
}

function isExcelOfficeFile(file) {
  const name = (file.originalname || "").toLowerCase();

  return name.endsWith(".xls") || name.endsWith(".xlsx");
}

function convertOfficeToPdf(inputPath, outputDir) {
  const args = [
    "--headless",
    "--nologo",
    "--nofirststartwizard",
    "--convert-to",
    "pdf",
    "--outdir",
    outputDir,
    inputPath,
  ];

  return new Promise((resolve, reject) => {
    execFile("libreoffice", args, { timeout: 240000 }, (error, stdout, stderr) => {
      if (error) {
        reject(
          new Error(
            stderr || stdout || error.message || "Office to PDF conversion failed.",
          ),
        );
        return;
      }

      resolve();
    });
  });
}

function convertExcelToPdf(inputPath, outputPath) {
  const pyScript = `
import sys
import os
import tempfile
import subprocess
from openpyxl import load_workbook

input_path = sys.argv[1]
output_path = sys.argv[2]

work_dir = tempfile.mkdtemp(prefix="toolversex-excel-")
base_name = os.path.splitext(os.path.basename(input_path))[0]
normalized_xlsx = os.path.join(work_dir, base_name + ".xlsx")

try:
    workbook = load_workbook(input_path)

    for sheet in workbook.worksheets:
        sheet.page_setup.orientation = "landscape"
        sheet.page_setup.fitToWidth = 1
        sheet.page_setup.fitToHeight = 0
        sheet.sheet_properties.pageSetUpPr.fitToPage = True

        sheet.page_margins.left = 0.25
        sheet.page_margins.right = 0.25
        sheet.page_margins.top = 0.4
        sheet.page_margins.bottom = 0.4
        sheet.page_margins.header = 0.2
        sheet.page_margins.footer = 0.2

        if sheet.max_column > 8:
            sheet.page_setup.paperSize = sheet.PAPERSIZE_A3
        else:
            sheet.page_setup.paperSize = sheet.PAPERSIZE_A4

    workbook.save(normalized_xlsx)

    subprocess.run(
        [
            "libreoffice",
            "--headless",
            "--nologo",
            "--nofirststartwizard",
            "--convert-to",
            "pdf",
            "--outdir",
            work_dir,
            normalized_xlsx,
        ],
        check=True,
        timeout=240,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )

    generated_pdf = os.path.join(work_dir, base_name + ".pdf")

    if not os.path.exists(generated_pdf):
        pdf_files = [
            os.path.join(work_dir, file_name)
            for file_name in os.listdir(work_dir)
            if file_name.lower().endswith(".pdf")
        ]

        if not pdf_files:
            raise RuntimeError("Converted PDF file was not created.")

        generated_pdf = pdf_files[0]

    with open(generated_pdf, "rb") as src:
        with open(output_path, "wb") as dst:
            dst.write(src.read())
finally:
    try:
        for file_name in os.listdir(work_dir):
            os.remove(os.path.join(work_dir, file_name))
        os.rmdir(work_dir)
    except Exception:
        pass
`.trim();

  return runPythonScript(
    pyScript,
    [inputPath, outputPath],
    "Excel to PDF conversion failed.",
    300000,
  );
}

function htmlToPdf(html, outputPath) {
  return new Promise(async (resolve, reject) => {
    const tempDir = await fsp.mkdtemp(path.join(os.tmpdir(), "toolversex-html-"));
    const htmlPath = path.join(tempDir, "input.html");

    try {
      await fsp.writeFile(htmlPath, html, "utf8");

      const args = [
        "--headless",
        "--no-sandbox",
        "--disable-gpu",
        `--print-to-pdf=${outputPath}`,
        htmlPath,
      ];

      execFile("chromium", args, { timeout: 240000 }, async (error, stdout, stderr) => {
        await safeDelete(htmlPath);
        await safeRemoveDir(tempDir);

        if (error) {
          reject(
            new Error(
              stderr || stdout || error.message || "HTML to PDF conversion failed.",
            ),
          );
          return;
        }

        resolve();
      });
    } catch (error) {
      await safeDelete(htmlPath);
      await safeRemoveDir(tempDir);
      reject(error);
    }
  });
}

async function safeDelete(filePath) {
  try {
    if (filePath && fs.existsSync(filePath)) {
      await fsp.unlink(filePath);
    }
  } catch {
    // Ignore cleanup errors.
  }
}

async function safeRemoveDir(dirPath) {
  try {
    if (dirPath && fs.existsSync(dirPath)) {
      await fsp.rm(dirPath, { recursive: true, force: true });
    }
  } catch {
    // Ignore cleanup errors.
  }
}

function getBaseName(originalName, fallback = "document") {
  return (
    path
      .basename(originalName || fallback)
      .replace(/\.[^.]+$/i, "")
      .replace(/[^a-zA-Z0-9._-]/g, "-")
      .slice(0, 80) || fallback
  );
}

function getDownloadFileName(originalName) {
  return `${getBaseName(originalName, "document")}-compressed.pdf`;
}

function getPdfDownloadFileName(originalName, suffix = "converted") {
  return `${getBaseName(originalName, "document")}-${suffix}.pdf`;
}

function getWordDownloadFileName(originalName) {
  return `${getBaseName(originalName, "document")}.docx`;
}

function getExcelDownloadFileName(originalName) {
  return `${getBaseName(originalName, "document")}.xlsx`;
}

function getPowerPointDownloadFileName(originalName) {
  return `${getBaseName(originalName, "document")}.pptx`;
}

function streamFile(res, filePath, cleanup) {
  const stream = fs.createReadStream(filePath);

  stream.on("close", cleanup);
  stream.on("error", cleanup);

  stream.pipe(res);
}

app.get("/", (_req, res) => {
  res.json({
    name: "Toolverse PDF API",
    status: "ok",
  });
});

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
  });
});

app.post("/api/pdf/compress", upload.single("file"), async (req, res) => {
  let inputPath = "";
  let outputPath = "";

  try {
    if (!req.file) {
      return res.status(400).json({ error: "PDF file is required." });
    }

    inputPath = req.file.path;
    outputPath = path.join(
      path.dirname(inputPath),
      `${crypto.randomBytes(16).toString("hex")}-compressed.pdf`,
    );

    const quality = req.body.quality || "0.6";

    await compressWithGhostscript(inputPath, outputPath, quality);

    const originalStats = await fsp.stat(inputPath);
    const compressedStats = await fsp.stat(outputPath);

    const shouldUseCompressed = compressedStats.size < originalStats.size;
    const fileToSend = shouldUseCompressed ? outputPath : inputPath;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${getDownloadFileName(req.file.originalname)}"`,
    );
    res.setHeader("X-Original-Size", String(originalStats.size));
    res.setHeader("X-Compressed-Size", String(compressedStats.size));
    res.setHeader(
      "X-Compression-Used",
      shouldUseCompressed ? "compressed" : "original",
    );
    res.setHeader("Cache-Control", "no-store");

    streamFile(res, fileToSend, async () => {
      await safeDelete(inputPath);
      await safeDelete(outputPath);
    });
  } catch (error) {
    await safeDelete(inputPath);
    await safeDelete(outputPath);

    res.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : "Could not compress this PDF.",
    });
  }
});

app.post("/api/pdf/office-to-pdf", upload.single("file"), async (req, res) => {
  let inputPath = "";
  let outputPath = "";

  try {
    if (!req.file) {
      return res.status(400).json({ error: "Office file is required." });
    }

    if (!isOfficeFile(req.file)) {
      return res.status(400).json({
        error: "Please upload a DOC, DOCX, PPT, PPTX, XLS, or XLSX file.",
      });
    }

    inputPath = req.file.path;
    const outputDir = path.dirname(inputPath);

    if (isExcelOfficeFile(req.file)) {
      outputPath = path.join(
        outputDir,
        `${crypto.randomBytes(16).toString("hex")}.pdf`,
      );
      await convertExcelToPdf(inputPath, outputPath);
    } else {
      await convertOfficeToPdf(inputPath, outputDir);

      const inputBaseName = path.basename(inputPath).replace(/\.[^.]+$/i, "");
      outputPath = path.join(outputDir, `${inputBaseName}.pdf`);

      if (!fs.existsSync(outputPath)) {
        const files = await fsp.readdir(outputDir);
        const pdfFile = files.find((fileName) =>
          fileName.toLowerCase().endsWith(".pdf"),
        );

        if (pdfFile) outputPath = path.join(outputDir, pdfFile);
      }
    }

    if (!fs.existsSync(outputPath)) {
      throw new Error("Converted PDF file was not created.");
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${getPdfDownloadFileName(req.file.originalname)}"`,
    );
    res.setHeader("Cache-Control", "no-store");

    streamFile(res, outputPath, async () => {
      await safeDelete(inputPath);
      await safeDelete(outputPath);
    });
  } catch (error) {
    await safeDelete(inputPath);
    await safeDelete(outputPath);

    res.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : "Could not convert this Office file to PDF.",
    });
  }
});

app.post("/api/pdf/html-to-pdf", async (req, res) => {
  let outputPath = "";

  try {
    const body = req.body || {};
    const html = String(body.html || "").trim();
    const fileName = String(body.fileName || "html-document")
      .replace(/[^a-zA-Z0-9._-]/g, "-")
      .replace(/\.pdf$/i, "")
      .slice(0, 80);

    if (!html) {
      return res.status(400).json({ error: "HTML content is required." });
    }

    outputPath = path.join(
      os.tmpdir(),
      `${crypto.randomBytes(16).toString("hex")}.pdf`,
    );

    await htmlToPdf(html, outputPath);

    if (!fs.existsSync(outputPath)) {
      throw new Error("Converted PDF file was not created.");
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${fileName || "html-document"}.pdf"`,
    );
    res.setHeader("Cache-Control", "no-store");

    streamFile(res, outputPath, async () => {
      await safeDelete(outputPath);
    });
  } catch (error) {
    await safeDelete(outputPath);

    res.status(500).json({
      error:
        error instanceof Error ? error.message : "Could not convert HTML to PDF.",
    });
  }
});

app.post("/api/pdf/to-jpg", upload.single("file"), async (req, res) => {
  let inputPath = "";
  let outputDir = "";
  let outputPath = "";

  try {
    if (!req.file) {
      return res.status(400).json({ error: "PDF file is required." });
    }

    inputPath = req.file.path;
    outputDir = await fsp.mkdtemp(path.join(os.tmpdir(), "toolversex-jpg-"));

    await pdfToJpg(inputPath, outputDir);

    const jpgFiles = (await fsp.readdir(outputDir))
      .filter((fileName) => fileName.toLowerCase().endsWith(".jpg"))
      .map((fileName) => path.join(outputDir, fileName))
      .sort();

    if (!jpgFiles.length) {
      throw new Error("No JPG files were created.");
    }

    const baseName = getBaseName(req.file.originalname, "document");

    if (jpgFiles.length === 1) {
      outputPath = jpgFiles[0];

      res.setHeader("Content-Type", "image/jpeg");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${baseName}.jpg"`,
      );
    } else {
      outputPath = path.join(outputDir, `${baseName}-jpg.zip`);

      await zipFiles(jpgFiles, outputPath, outputDir);

      res.setHeader("Content-Type", "application/zip");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${baseName}-jpg.zip"`,
      );
    }

    res.setHeader("Cache-Control", "no-store");

    streamFile(res, outputPath, async () => {
      await safeDelete(inputPath);
      await safeRemoveDir(outputDir);
    });
  } catch (error) {
    await safeDelete(inputPath);
    await safeRemoveDir(outputDir);

    res.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : "Could not convert this PDF to JPG.",
    });
  }
});

app.post("/api/pdf/to-word", upload.single("file"), async (req, res) => {
  let inputPath = "";
  let outputPath = "";

  try {
    if (!req.file) return res.status(400).json({ error: "PDF file is required." });

    inputPath = req.file.path;
    outputPath = path.join(
      path.dirname(inputPath),
      `${crypto.randomBytes(16).toString("hex")}.docx`,
    );

    await pdfToWord(inputPath, outputPath);

    if (!fs.existsSync(outputPath)) {
      throw new Error("Converted Word file was not created.");
    }

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${getWordDownloadFileName(req.file.originalname)}"`,
    );
    res.setHeader("Cache-Control", "no-store");

    streamFile(res, outputPath, async () => {
      await safeDelete(inputPath);
      await safeDelete(outputPath);
    });
  } catch (error) {
    await safeDelete(inputPath);
    await safeDelete(outputPath);

    res.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : "Could not convert this PDF to Word.",
    });
  }
});

app.post("/api/pdf/to-excel", upload.single("file"), async (req, res) => {
  let inputPath = "";
  let outputPath = "";

  try {
    if (!req.file) return res.status(400).json({ error: "PDF file is required." });

    inputPath = req.file.path;
    outputPath = path.join(
      path.dirname(inputPath),
      `${crypto.randomBytes(16).toString("hex")}.xlsx`,
    );

    await pdfToExcel(inputPath, outputPath);

    if (!fs.existsSync(outputPath)) {
      throw new Error("Converted Excel file was not created.");
    }

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${getExcelDownloadFileName(req.file.originalname)}"`,
    );
    res.setHeader("Cache-Control", "no-store");

    streamFile(res, outputPath, async () => {
      await safeDelete(inputPath);
      await safeDelete(outputPath);
    });
  } catch (error) {
    await safeDelete(inputPath);
    await safeDelete(outputPath);

    res.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : "Could not convert this PDF to Excel.",
    });
  }
});

app.post("/api/pdf/to-powerpoint", upload.single("file"), async (req, res) => {
  let inputPath = "";
  let outputPath = "";

  try {
    if (!req.file) return res.status(400).json({ error: "PDF file is required." });

    inputPath = req.file.path;
    outputPath = path.join(
      path.dirname(inputPath),
      `${crypto.randomBytes(16).toString("hex")}.pptx`,
    );

    await pdfToPowerPoint(inputPath, outputPath);

    if (!fs.existsSync(outputPath)) {
      throw new Error("Converted PowerPoint file was not created.");
    }

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${getPowerPointDownloadFileName(req.file.originalname)}"`,
    );
    res.setHeader("Cache-Control", "no-store");

    streamFile(res, outputPath, async () => {
      await safeDelete(inputPath);
      await safeDelete(outputPath);
    });
  } catch (error) {
    await safeDelete(inputPath);
    await safeDelete(outputPath);

    res.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : "Could not convert this PDF to PowerPoint.",
    });
  }
});

app.post("/api/pdf/to-pdfa", upload.single("file"), async (req, res) => {
  let inputPath = "";
  let outputPath = "";

  try {
    if (!req.file) return res.status(400).json({ error: "PDF file is required." });

    inputPath = req.file.path;
    outputPath = path.join(
      path.dirname(inputPath),
      `${crypto.randomBytes(16).toString("hex")}-pdfa.pdf`,
    );

    await pdfToPdfa(inputPath, outputPath);

    if (!fs.existsSync(outputPath)) {
      throw new Error("Converted PDF/A file was not created.");
    }

    const baseName = getBaseName(req.file.originalname, "document");

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${baseName}-pdfa.pdf"`,
    );
    res.setHeader("Cache-Control", "no-store");

    streamFile(res, outputPath, async () => {
      await safeDelete(inputPath);
      await safeDelete(outputPath);
    });
  } catch (error) {
    await safeDelete(inputPath);
    await safeDelete(outputPath);

    res.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : "Could not convert this PDF to PDF/A.",
    });
  }
});

app.post("/api/pdf/unlock", upload.single("file"), async (req, res) => {
  let inputPath = "";
  let outputPath = "";

  try {
    if (!req.file) return res.status(400).json({ error: "PDF file is required." });

    const password = String(req.body.password || "").trim();

    if (!password) {
      return res.status(400).json({ error: "Current password is required." });
    }

    inputPath = req.file.path;
    outputPath = path.join(
      path.dirname(inputPath),
      `${crypto.randomBytes(16).toString("hex")}-unlocked.pdf`,
    );

    await unlockPdf(inputPath, outputPath, password);

    if (!fs.existsSync(outputPath)) {
      throw new Error("Unlocked PDF file was not created.");
    }

    const baseName = getBaseName(req.file.originalname, "document");

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${baseName}-unlocked.pdf"`,
    );
    res.setHeader("Cache-Control", "no-store");

    streamFile(res, outputPath, async () => {
      await safeDelete(inputPath);
      await safeDelete(outputPath);
    });
  } catch (error) {
    await safeDelete(inputPath);
    await safeDelete(outputPath);

    res.status(400).json({
      error:
        error instanceof Error
          ? error.message
          : "We could not unlock this PDF. Please check the password and try again.",
    });
  }
});

app.post("/api/pdf/protect", upload.single("file"), async (req, res) => {
  let inputPath = "";
  let outputPath = "";

  try {
    if (!req.file) return res.status(400).json({ error: "PDF file is required." });

    const password = String(req.body.password || "").trim();
    const ownerPassword = String(req.body.ownerPassword || "").trim();

    if (!password) {
      return res.status(400).json({ error: "Password is required." });
    }

    if (password.length < 4) {
      return res.status(400).json({
        error: "Password must be at least 4 characters long.",
      });
    }

    inputPath = req.file.path;
    outputPath = path.join(
      path.dirname(inputPath),
      `${crypto.randomBytes(16).toString("hex")}-protected.pdf`,
    );

    await protectPdf(inputPath, outputPath, password, ownerPassword || password);

    if (!fs.existsSync(outputPath)) {
      throw new Error("Protected PDF file was not created.");
    }

    const baseName = getBaseName(req.file.originalname, "document");

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${baseName}-protected.pdf"`,
    );
    res.setHeader("Cache-Control", "no-store");

    streamFile(res, outputPath, async () => {
      await safeDelete(inputPath);
      await safeDelete(outputPath);
    });
  } catch (error) {
    await safeDelete(inputPath);
    await safeDelete(outputPath);

    res.status(500).json({
      error:
        error instanceof Error ? error.message : "Could not protect this PDF.",
    });
  }
});

app.post("/api/pdf/redact", upload.single("file"), async (req, res) => {
  let inputPath = "";
  let outputPath = "";

  try {
    if (!req.file) return res.status(400).json({ error: "PDF file is required." });

    const terms = String(req.body.terms || "").trim();

    if (!terms) {
      return res.status(400).json({
        error: "Enter at least one redaction term.",
      });
    }

    inputPath = req.file.path;
    outputPath = path.join(
      path.dirname(inputPath),
      `${crypto.randomBytes(16).toString("hex")}-redacted.pdf`,
    );

    await redactPdf(inputPath, outputPath, terms);

    if (!fs.existsSync(outputPath)) {
      throw new Error("Redacted PDF file was not created.");
    }

    const baseName = getBaseName(req.file.originalname, "document");

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${baseName}-redacted.pdf"`,
    );
    res.setHeader("Cache-Control", "no-store");

    streamFile(res, outputPath, async () => {
      await safeDelete(inputPath);
      await safeDelete(outputPath);
    });
  } catch (error) {
    await safeDelete(inputPath);
    await safeDelete(outputPath);

    res.status(500).json({
      error:
        error instanceof Error ? error.message : "Could not redact this PDF.",
    });
  }
});

app.post(
  "/api/pdf/compare",
  compareUpload.fields([
    { name: "firstFile", maxCount: 1 },
    { name: "secondFile", maxCount: 1 },
  ]),
  async (req, res) => {
    let firstPath = "";
    let secondPath = "";

    try {
      const files = req.files || {};
      const firstFile = Array.isArray(files.firstFile)
        ? files.firstFile[0]
        : null;
      const secondFile = Array.isArray(files.secondFile)
        ? files.secondFile[0]
        : null;

      if (!firstFile || !secondFile) {
        return res.status(400).json({ error: "Both PDF files are required." });
      }

      firstPath = firstFile.path;
      secondPath = secondFile.path;

      const result = await comparePdfs(firstPath, secondPath);

      res.json(result);
    } catch (error) {
      res.status(500).json({
        error:
          error instanceof Error
            ? error.message
            : "Could not compare these PDFs.",
      });
    } finally {
      await safeDelete(firstPath);
      await safeDelete(secondPath);
    }
  },
);

app.use((error, _req, res, _next) => {
  console.error(error);

  if (
    error.message === "Only PDF files are allowed." ||
    error.message === "Only PDF or Office files are allowed."
  ) {
    return res.status(400).json({ error: error.message });
  }

  if (error.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ error: "File is too large. Max size is 50 MB." });
  }

  return res.status(500).json({ error: "Unexpected server error." });
});

app.listen(PORT, () => {
  console.log(`Toolverse PDF API running on port ${PORT}`);
});