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
  "https://toolverse.pages.dev",
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

app.use(express.json({ limit: "2mb" }));

const diskStorage = multer.diskStorage({
  destination: async function (_req, _file, callback) {
    const uploadDir = path.join(os.tmpdir(), "Toolverse-pdf-uploads");

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
});

function pdfFileFilter(_req, file, callback) {
  const isPdf =
    file.mimetype === "application/pdf" ||
    file.originalname.toLowerCase().endsWith(".pdf");

  if (!isPdf) {
    callback(new Error("Only PDF files are allowed."));
    return;
  }

  callback(null, true);
}

const upload = multer({
  storage: diskStorage,
  limits: {
    fileSize: 50 * 1024 * 1024,
    files: 1,
  },
  fileFilter: pdfFileFilter,
});

const compareUpload = multer({
  storage: diskStorage,
  limits: {
    fileSize: 50 * 1024 * 1024,
    files: 2,
  },
  fileFilter: pdfFileFilter,
});

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

function sanitizeBaseName(originalName) {
  return (
    path
      .basename(originalName || "document.pdf")
      .replace(/\.pdf$/i, "")
      .replace(/[^a-zA-Z0-9._-]/g, "-")
      .slice(0, 80) || "document"
  );
}

function getCompressedDownloadFileName(originalName) {
  return `${sanitizeBaseName(originalName)}-compressed.pdf`;
}

function getMarkdownDownloadFileName(originalName) {
  return `${sanitizeBaseName(originalName)}.md`;
}

function getOcrDownloadFileName(originalName) {
  return `${sanitizeBaseName(originalName)}-ocr.md`;
}

function getProtectedDownloadFileName(originalName) {
  return `${sanitizeBaseName(originalName)}-protected.pdf`;
}

function getUnlockedDownloadFileName(originalName) {
  return `${sanitizeBaseName(originalName)}-unlocked.pdf`;
}

function getRepairedDownloadFileName(originalName) {
  return `${sanitizeBaseName(originalName)}-repaired.pdf`;
}

function getRedactedDownloadFileName(originalName) {
  return `${sanitizeBaseName(originalName)}-redacted.pdf`;
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

  return runCommand("gs", args, 120000, "Ghostscript PDF compression failed.");
}

function convertPdfToMarkdown(inputPath, outputPath) {
  const pythonScript = `
from pathlib import Path
import sys
from markitdown import MarkItDown

input_path = sys.argv[1]
output_path = sys.argv[2]

md = MarkItDown()
result = md.convert(input_path)
text = getattr(result, "text_content", None) or str(result)

Path(output_path).write_text(text, encoding="utf-8")
`.trim();

  return runCommand(
    "python3",
    ["-c", pythonScript, inputPath, outputPath],
    120000,
    "PDF to Markdown conversion failed.",
  );
}

function ocrPdfToMarkdown(inputPath, outputPath) {
  const pythonScript = `
from pathlib import Path
import sys
from pdf2image import convert_from_path
import pytesseract

input_path = sys.argv[1]
output_path = sys.argv[2]

images = convert_from_path(input_path, dpi=200)
parts = []

for index, image in enumerate(images, start=1):
    text = pytesseract.image_to_string(image, lang="eng").strip()
    heading = f"## Page {index}"
    parts.append(f"{heading}\\n\\n{text}" if text else f"{heading}\\n")

output = "\\n\\n---\\n\\n".join(parts).strip()

if not output:
    output = "No OCR text could be extracted from this PDF."

Path(output_path).write_text(output, encoding="utf-8")
`.trim();

  return runCommand(
    "python3",
    ["-c", pythonScript, inputPath, outputPath],
    240000,
    "OCR PDF conversion failed.",
  );
}

function protectPdfWithQpdf(inputPath, outputPath, userPassword, ownerPassword) {
  const args = [
    "--encrypt",
    userPassword,
    ownerPassword,
    "256",
    "--",
    inputPath,
    outputPath,
  ];

  return runCommand("qpdf", args, 120000, "PDF protection failed.");
}

function unlockPdfWithQpdf(inputPath, outputPath, password) {
  const args = [`--password=${password}`, "--decrypt", inputPath, outputPath];
  return runCommand("qpdf", args, 120000, "PDF unlock failed.");
}

function repairPdfWithQpdf(inputPath, outputPath) {
  const args = ["--linearize", inputPath, outputPath];
  return runCommand("qpdf", args, 120000, "PDF repair failed.");
}

function comparePdfs(firstPath, secondPath, outputPath) {
  const pythonScript = `
from pathlib import Path
import json
import sys
import difflib
import fitz

first_path = sys.argv[1]
second_path = sys.argv[2]
output_path = sys.argv[3]

def extract_pages(file_path):
    doc = fitz.open(file_path)
    pages = []
    for page in doc:
        pages.append(page.get_text("text").strip())
    doc.close()
    return pages

first_pages = extract_pages(first_path)
second_pages = extract_pages(second_path)

max_pages = max(len(first_pages), len(second_pages))
page_results = []
changed_pages = 0

for index in range(max_pages):
    left = first_pages[index] if index < len(first_pages) else ""
    right = second_pages[index] if index < len(second_pages) else ""
    identical = left == right
    ratio = difflib.SequenceMatcher(None, left, right).ratio() if (left or right) else 1.0

    diff_lines = []
    if not identical:
        changed_pages += 1
        diff_lines = list(
            difflib.unified_diff(
                left.splitlines(),
                right.splitlines(),
                fromfile="first",
                tofile="second",
                lineterm=""
            )
        )[:120]

    page_results.append({
        "page": index + 1,
        "identical": identical,
        "similarity": round(ratio, 4),
        "firstLength": len(left),
        "secondLength": len(right),
        "diffPreview": diff_lines,
    })

result = {
    "identical": len(first_pages) == len(second_pages) and changed_pages == 0,
    "firstPageCount": len(first_pages),
    "secondPageCount": len(second_pages),
    "changedPages": changed_pages,
    "pages": page_results,
}

Path(output_path).write_text(json.dumps(result), encoding="utf-8")
`.trim();

  return runCommand(
    "python3",
    ["-c", pythonScript, firstPath, secondPath, outputPath],
    240000,
    "PDF comparison failed.",
  );
}

function redactPdfTerms(inputPath, outputPath, terms) {
  const pythonScript = `
from pathlib import Path
import json
import sys
import fitz

input_path = sys.argv[1]
output_path = sys.argv[2]
terms_json = sys.argv[3]

terms = json.loads(terms_json)
terms = [str(term).strip() for term in terms if str(term).strip()]

if not terms:
    raise ValueError("No redaction terms provided.")

doc = fitz.open(input_path)

for page in doc:
    for term in terms:
        rects = page.search_for(term)
        for rect in rects:
            page.add_redact_annot(rect, fill=(0, 0, 0))
    page.apply_redactions()

doc.save(output_path, garbage=4, deflate=True)
doc.close()
`.trim();

  return runCommand(
    "python3",
    ["-c", pythonScript, inputPath, outputPath, JSON.stringify(terms)],
    240000,
    "PDF redaction failed.",
  );
}

function runCommand(binary, args, timeout, fallbackMessage) {
  return new Promise((resolve, reject) => {
    execFile(binary, args, { timeout }, (error, stdout, stderr) => {
      if (error) {
        reject(
          new Error(stderr || stdout || error.message || fallbackMessage),
        );
        return;
      }

      resolve();
    });
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

function streamFileResponse({
  res,
  filePath,
  contentType,
  downloadName,
  extraHeaders = {},
  cleanupPaths = [],
}) {
  res.setHeader("Content-Type", contentType);
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${downloadName}"`,
  );
  res.setHeader("Cache-Control", "no-store");

  for (const [key, value] of Object.entries(extraHeaders)) {
    res.setHeader(key, value);
  }

  const stream = fs.createReadStream(filePath);

  stream.on("close", async () => {
    await Promise.all(cleanupPaths.map((item) => safeDelete(item)));
  });

  stream.on("error", async () => {
    await Promise.all(cleanupPaths.map((item) => safeDelete(item)));
  });

  stream.pipe(res);
}

app.get("/", (_req, res) => {
  res.json({
    name: "Toolverse PDF API",
    status: "ok",
    routes: [
      "/api/pdf/compress",
      "/api/pdf/to-markdown",
      "/api/pdf/ocr",
      "/api/pdf/protect",
      "/api/pdf/unlock",
      "/api/pdf/repair",
      "/api/pdf/compare",
      "/api/pdf/redact",
    ],
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

    const originalSize = originalStats.size;
    const compressedSize = compressedStats.size;
    const shouldUseCompressed = compressedSize < originalSize;

    const fileToSend = shouldUseCompressed ? outputPath : inputPath;

    return streamFileResponse({
      res,
      filePath: fileToSend,
      contentType: "application/pdf",
      downloadName: getCompressedDownloadFileName(req.file.originalname),
      extraHeaders: {
        "X-Original-Size": String(originalSize),
        "X-Compressed-Size": String(compressedSize),
        "X-Compression-Used": shouldUseCompressed ? "compressed" : "original",
      },
      cleanupPaths: [inputPath, outputPath],
    });
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

app.post("/api/pdf/to-markdown", upload.single("file"), async (req, res) => {
  let inputPath = "";
  let outputPath = "";

  try {
    if (!req.file) {
      return res.status(400).json({ error: "PDF file is required." });
    }

    inputPath = req.file.path;
    outputPath = path.join(
      path.dirname(inputPath),
      `${crypto.randomBytes(16).toString("hex")}.md`,
    );

    await convertPdfToMarkdown(inputPath, outputPath);

    const markdown = await fsp.readFile(outputPath, "utf8");

    res.setHeader("Content-Type", "text/markdown; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${getMarkdownDownloadFileName(req.file.originalname)}"`,
    );
    res.setHeader("Cache-Control", "no-store");
    res.send(markdown);

    await safeDelete(inputPath);
    await safeDelete(outputPath);
  } catch (error) {
    await safeDelete(inputPath);
    await safeDelete(outputPath);

    console.error(error);
    res.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : "Could not convert this PDF to Markdown.",
    });
  }
});

app.post("/api/pdf/ocr", upload.single("file"), async (req, res) => {
  let inputPath = "";
  let outputPath = "";

  try {
    if (!req.file) {
      return res.status(400).json({ error: "PDF file is required." });
    }

    inputPath = req.file.path;
    outputPath = path.join(
      path.dirname(inputPath),
      `${crypto.randomBytes(16).toString("hex")}-ocr.md`,
    );

    await ocrPdfToMarkdown(inputPath, outputPath);

    const markdown = await fsp.readFile(outputPath, "utf8");

    res.setHeader("Content-Type", "text/markdown; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${getOcrDownloadFileName(req.file.originalname)}"`,
    );
    res.setHeader("Cache-Control", "no-store");
    res.send(markdown);

    await safeDelete(inputPath);
    await safeDelete(outputPath);
  } catch (error) {
    await safeDelete(inputPath);
    await safeDelete(outputPath);

    console.error(error);
    res.status(500).json({
      error:
        error instanceof Error ? error.message : "Could not OCR this PDF.",
    });
  }
});

app.post("/api/pdf/protect", upload.single("file"), async (req, res) => {
  let inputPath = "";
  let outputPath = "";

  try {
    if (!req.file) {
      return res.status(400).json({ error: "PDF file is required." });
    }

    const userPassword = String(req.body.password || "").trim();
    const nextOwnerPassword = String(req.body.ownerPassword || userPassword).trim();

    if (!userPassword) {
      return res.status(400).json({ error: "Password is required." });
    }

    if (userPassword.length < 4) {
      return res
        .status(400)
        .json({ error: "Password must be at least 4 characters long." });
    }

    inputPath = req.file.path;
    outputPath = path.join(
      path.dirname(inputPath),
      `${crypto.randomBytes(16).toString("hex")}-protected.pdf`,
    );

    await protectPdfWithQpdf(
      inputPath,
      outputPath,
      userPassword,
      nextOwnerPassword,
    );

    return streamFileResponse({
      res,
      filePath: outputPath,
      contentType: "application/pdf",
      downloadName: getProtectedDownloadFileName(req.file.originalname),
      cleanupPaths: [inputPath, outputPath],
    });
  } catch (error) {
    await safeDelete(inputPath);
    await safeDelete(outputPath);

    console.error(error);
    res.status(500).json({
      error:
        error instanceof Error ? error.message : "Could not protect this PDF.",
    });
  }
});

app.post("/api/pdf/unlock", upload.single("file"), async (req, res) => {
  let inputPath = "";
  let outputPath = "";

  try {
    if (!req.file) {
      return res.status(400).json({ error: "PDF file is required." });
    }

    const password = String(req.body.password || "").trim();

    if (!password) {
      return res.status(400).json({ error: "Password is required." });
    }

    inputPath = req.file.path;
    outputPath = path.join(
      path.dirname(inputPath),
      `${crypto.randomBytes(16).toString("hex")}-unlocked.pdf`,
    );

    await unlockPdfWithQpdf(inputPath, outputPath, password);

    return streamFileResponse({
      res,
      filePath: outputPath,
      contentType: "application/pdf",
      downloadName: getUnlockedDownloadFileName(req.file.originalname),
      cleanupPaths: [inputPath, outputPath],
    });
  } catch (error) {
    await safeDelete(inputPath);
    await safeDelete(outputPath);

    console.error(error);
    res.status(500).json({
      error:
        error instanceof Error ? error.message : "Could not unlock this PDF.",
    });
  }
});

app.post("/api/pdf/repair", upload.single("file"), async (req, res) => {
  let inputPath = "";
  let outputPath = "";

  try {
    if (!req.file) {
      return res.status(400).json({ error: "PDF file is required." });
    }

    inputPath = req.file.path;
    outputPath = path.join(
      path.dirname(inputPath),
      `${crypto.randomBytes(16).toString("hex")}-repaired.pdf`,
    );

    await repairPdfWithQpdf(inputPath, outputPath);

    return streamFileResponse({
      res,
      filePath: outputPath,
      contentType: "application/pdf",
      downloadName: getRepairedDownloadFileName(req.file.originalname),
      cleanupPaths: [inputPath, outputPath],
    });
  } catch (error) {
    await safeDelete(inputPath);
    await safeDelete(outputPath);

    console.error(error);
    res.status(500).json({
      error:
        error instanceof Error ? error.message : "Could not repair this PDF.",
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
    let outputPath = "";

    try {
      const firstFile = req.files?.firstFile?.[0];
      const secondFile = req.files?.secondFile?.[0];

      if (!firstFile || !secondFile) {
        return res.status(400).json({
          error: "Both firstFile and secondFile are required.",
        });
      }

      firstPath = firstFile.path;
      secondPath = secondFile.path;
      outputPath = path.join(
        path.dirname(firstPath),
        `${crypto.randomBytes(16).toString("hex")}-compare.json`,
      );

      await comparePdfs(firstPath, secondPath, outputPath);

      const json = await fsp.readFile(outputPath, "utf8");
      const result = JSON.parse(json);

      await safeDelete(firstPath);
      await safeDelete(secondPath);
      await safeDelete(outputPath);

      return res.json(result);
    } catch (error) {
      await safeDelete(firstPath);
      await safeDelete(secondPath);
      await safeDelete(outputPath);

      console.error(error);
      res.status(500).json({
        error:
          error instanceof Error ? error.message : "Could not compare PDFs.",
      });
    }
  },
);

app.post("/api/pdf/redact", upload.single("file"), async (req, res) => {
  let inputPath = "";
  let outputPath = "";

  try {
    if (!req.file) {
      return res.status(400).json({ error: "PDF file is required." });
    }

    const rawTerms = String(req.body.terms || "");
    const terms = rawTerms
      .split(/\r?\n|,/)
      .map((term) => term.trim())
      .filter(Boolean);

    if (!terms.length) {
      return res.status(400).json({
        error: "At least one redaction term is required.",
      });
    }

    inputPath = req.file.path;
    outputPath = path.join(
      path.dirname(inputPath),
      `${crypto.randomBytes(16).toString("hex")}-redacted.pdf`,
    );

    await redactPdfTerms(inputPath, outputPath, terms);

    return streamFileResponse({
      res,
      filePath: outputPath,
      contentType: "application/pdf",
      downloadName: getRedactedDownloadFileName(req.file.originalname),
      cleanupPaths: [inputPath, outputPath],
    });
  } catch (error) {
    await safeDelete(inputPath);
    await safeDelete(outputPath);

    console.error(error);
    res.status(500).json({
      error:
        error instanceof Error ? error.message : "Could not redact this PDF.",
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