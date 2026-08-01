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

app.use(express.json({ limit: "1mb" }));

const upload = multer({
  storage: multer.diskStorage({
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
          .basename(file.originalname || "document.pdf")
          .replace(/[^a-zA-Z0-9._-]/g, "-")
          .slice(0, 80) || "document.pdf";

      callback(null, `${id}-${safeOriginalName}`);
    },
  }),
  limits: {
    fileSize: 50 * 1024 * 1024,
    files: 1,
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

function getPdfSettings(quality) {
  const value = Number(quality);

  if (Number.isNaN(value)) {
    return "/ebook";
  }

  if (value >= 0.85) {
    return "/printer";
  }

  if (value >= 0.6) {
    return "/ebook";
  }

  return "/screen";
}

function getImageResolution(quality) {
  const value = Number(quality);

  if (Number.isNaN(value)) {
    return {
      color: "120",
      gray: "120",
      mono: "150",
    };
  }

  if (value >= 0.85) {
    return {
      color: "220",
      gray: "220",
      mono: "300",
    };
  }

  if (value >= 0.6) {
    return {
      color: "150",
      gray: "150",
      mono: "200",
    };
  }

  if (value >= 0.35) {
    return {
      color: "100",
      gray: "100",
      mono: "150",
    };
  }

  return {
    color: "72",
    gray: "72",
    mono: "100",
  };
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

  return new Promise((resolve, reject) => {
    execFile(
      "python3",
      ["-c", pyScript, inputPath, outputPath],
      { timeout: 240000 },
      (error, stdout, stderr) => {
        if (error) {
          reject(
            new Error(
              stderr ||
                stdout ||
                error.message ||
                "PDF to Excel conversion failed.",
            ),
          );
          return;
        }

        resolve();
      },
    );
  });
}

function pdfToPowerPoint(inputPath, outputPath) {
  const pyScript = `
import io
import os
import re
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

  return new Promise((resolve, reject) => {
    execFile(
      "python3",
      ["-c", pyScript, inputPath, outputPath],
      { timeout: 240000 },
      (error, stdout, stderr) => {
        if (error) {
          reject(
            new Error(
              stderr ||
                stdout ||
                error.message ||
                "PDF to PowerPoint conversion failed.",
            ),
          );
          return;
        }

        resolve();
      },
    );
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

function getDownloadFileName(originalName) {
  const baseName = path
    .basename(originalName || "document.pdf")
    .replace(/\\.pdf$/i, "")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .slice(0, 80);

  return `${baseName || "document"}-compressed.pdf`;
}

function getExcelDownloadFileName(originalName) {
  const baseName = path
    .basename(originalName || "document.pdf")
    .replace(/\\.pdf$/i, "")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .slice(0, 80);

  return `${baseName || "document"}.xlsx`;
}

function getPowerPointDownloadFileName(originalName) {
  const baseName = path
    .basename(originalName || "document.pdf")
    .replace(/\\.pdf$/i, "")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .slice(0, 80);

  return `${baseName || "document"}.pptx`;
}

app.get("/", (_req, res) => {
  res.json({
    name: "ToolverseX PDF API",
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
      return res.status(400).json({
        error: "PDF file is required.",
      });
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

    const originalSize = originalStats.size;
    const compressedSize = compressedStats.size;

    const shouldUseCompressed = compressedSize < originalSize;

    const fileToSend = shouldUseCompressed ? outputPath : inputPath;
    const downloadName = getDownloadFileName(req.file.originalname);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${downloadName}"`,
    );
    res.setHeader("X-Original-Size", String(originalSize));
    res.setHeader("X-Compressed-Size", String(compressedSize));
    res.setHeader(
      "X-Compression-Used",
      shouldUseCompressed ? "compressed" : "original",
    );
    res.setHeader("Cache-Control", "no-store");

    const stream = fs.createReadStream(fileToSend);

    stream.on("close", async () => {
      await safeDelete(inputPath);
      await safeDelete(outputPath);
    });

    stream.on("error", async () => {
      await safeDelete(inputPath);
      await safeDelete(outputPath);
    });

    stream.pipe(res);
  } catch (error) {
    await safeDelete(inputPath);
    await safeDelete(outputPath);

    console.error(error);

    res.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : "Could not compress this PDF.",
    });
  }
});

app.post("/api/pdf/to-excel", upload.single("file"), async (req, res) => {
  let inputPath = "";
  let outputPath = "";

  try {
    if (!req.file) {
      return res.status(400).json({
        error: "PDF file is required.",
      });
    }

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

    const stream = fs.createReadStream(outputPath);

    stream.on("close", async () => {
      await safeDelete(inputPath);
      await safeDelete(outputPath);
    });

    stream.on("error", async () => {
      await safeDelete(inputPath);
      await safeDelete(outputPath);
    });

    stream.pipe(res);
  } catch (error) {
    await safeDelete(inputPath);
    await safeDelete(outputPath);

    console.error(error);

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
    if (!req.file) {
      return res.status(400).json({
        error: "PDF file is required.",
      });
    }

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

    const stream = fs.createReadStream(outputPath);

    stream.on("close", async () => {
      await safeDelete(inputPath);
      await safeDelete(outputPath);
    });

    stream.on("error", async () => {
      await safeDelete(inputPath);
      await safeDelete(outputPath);
    });

    stream.pipe(res);
  } catch (error) {
    await safeDelete(inputPath);
    await safeDelete(outputPath);

    console.error(error);

    res.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : "Could not convert this PDF to PowerPoint.",
    });
  }
});

app.use((error, _req, res, _next) => {
  console.error(error);

  if (error.message === "Only PDF files are allowed.") {
    return res.status(400).json({
      error: "Only PDF files are allowed.",
    });
  }

  if (error.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({
      error: "PDF is too large. Max size is 50 MB.",
    });
  }

  return res.status(500).json({
    error: "Unexpected server error.",
  });
});

app.listen(PORT, () => {
  console.log(`Toolverse PDF API running on port ${PORT}`);
});