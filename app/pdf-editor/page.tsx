"use client";

import { useMemo, useState } from "react";
import {
  degrees,
  PDFCheckBox,
  PDFDocument,
  PDFDropdown,
  PDFOptionList,
  PDFRadioGroup,
  PDFTextField,
  StandardFonts,
  rgb,
} from "pdf-lib";
import {
  ArrowLeft,
  Combine,
  Crop,
  Download,
  Eraser,
  FileImage,
  FileSearch,
  FileText,
  FileX,
  Globe,
  Hash,
  ImageIcon,
  Loader2,
  LockKeyhole,
  RotateCw,
  Scissors,
  ShieldCheck,
  Stamp,
  Trash2,
  Upload,
} from "lucide-react";
import { Container } from "../../components/Container";
import { HowToUse } from "../../components/HowToUse";
import { formatFileSize } from "../../lib/formatFileSize";
import { fetchPdfApi } from "../../lib/apiBase";
import { getApiErrorMessage } from "../../lib/apiError";

type Category =
  "all" | "organize" | "convertToPdf" | "convertFromPdf" | "edit" | "security";

type Mode =
  | "merge"
  | "split"
  | "extract-pages"
  | "remove"
  | "rotate"
  | "reorder"
  | "page-numbers"
  | "watermark"
  | "image-watermark"
  | "crop-pdf"
  | "pdf-forms"
  | "images-to-pdf"
  | "scan-to-pdf"
  | "word-to-pdf"
  | "powerpoint-to-pdf"
  | "excel-to-pdf"
  | "html-to-pdf"
  | "pdf-to-jpg"
  | "pdf-to-word"
  | "pdf-to-powerpoint"
  | "pdf-to-excel"
  | "pdf-to-pdfa"
  | "compress-pdf"
  | "unlock-pdf"
  | "protect-pdf"
  | "redact-pdf"
  | "compare-pdf";

type OutputKind = "file" | "text";

type OutputFile = {
  name: string;
  blob: Blob;
  size: number;
  kind: OutputKind;
  previewText?: string;
};

type CompareResult = {
  identical: boolean;
  firstPageCount: number;
  secondPageCount: number;
  changedPages: number;
  pages: Array<{
    page: number;
    identical: boolean;
    similarity: number;
    firstLength: number;
    secondLength: number;
    diffPreview: string[];
  }>;
};

const categoryTabs: Array<{ id: Category; label: string }> = [
  { id: "all", label: "ALL" },
  { id: "organize", label: "ORGANIZE PDF" },
  { id: "convertToPdf", label: "CONVERT TO PDF" },
  { id: "convertFromPdf", label: "CONVERT FROM PDF" },
  { id: "edit", label: "EDIT PDF" },
  { id: "security", label: "PDF SECURITY" },
];

const modes: Array<{
  id: Mode;
  category: Exclude<Category, "all">;
  title: string;
  description: string;
  icon: React.ReactNode;
}> = [
  {
    id: "merge",
    category: "organize",
    title: "Merge PDF",
    description: "Combine multiple PDFs into one file.",
    icon: <Combine className="h-5 w-5" />,
  },
  {
    id: "split",
    category: "organize",
    title: "Split PDF",
    description: "Split a PDF by selected pages.",
    icon: <Scissors className="h-5 w-5" />,
  },
  {
    id: "remove",
    category: "organize",
    title: "Remove pages",
    description: "Delete selected pages from a PDF.",
    icon: <Trash2 className="h-5 w-5" />,
  },
  {
    id: "extract-pages",
    category: "organize",
    title: "Extract pages",
    description: "Extract selected pages into a new PDF.",
    icon: <Scissors className="h-5 w-5" />,
  },
  {
    id: "reorder",
    category: "organize",
    title: "Organize PDF",
    description: "Reorder PDF pages into a custom sequence.",
    icon: <FileText className="h-5 w-5" />,
  },
  {
    id: "scan-to-pdf",
    category: "organize",
    title: "Scan to PDF",
    description: "Turn image scans into a PDF.",
    icon: <ImageIcon className="h-5 w-5" />,
  },
  {
    id: "compress-pdf",
    category: "edit",
    title: "Compress PDF",
    description: "Reduce PDF file size using the backend.",
    icon: <FileText className="h-5 w-5" />,
  },
  {
    id: "images-to-pdf",
    category: "convertToPdf",
    title: "JPG to PDF",
    description: "Convert JPG, PNG, or WebP images into a PDF.",
    icon: <ImageIcon className="h-5 w-5" />,
  },
  {
    id: "word-to-pdf",
    category: "convertToPdf",
    title: "WORD to PDF",
    description: "Convert DOC or DOCX files into a PDF.",
    icon: <FileText className="h-5 w-5" />,
  },
  {
    id: "powerpoint-to-pdf",
    category: "convertToPdf",
    title: "POWERPOINT to PDF",
    description: "Convert PPT or PPTX files into a PDF.",
    icon: <FileText className="h-5 w-5" />,
  },
  {
    id: "excel-to-pdf",
    category: "convertToPdf",
    title: "EXCEL to PDF",
    description: "Convert XLS or XLSX files into a PDF.",
    icon: <FileText className="h-5 w-5" />,
  },
  {
    id: "html-to-pdf",
    category: "convertToPdf",
    title: "HTML to PDF",
    description: "Convert HTML content into a PDF.",
    icon: <Globe className="h-5 w-5" />,
  },
  {
    id: "pdf-to-jpg",
    category: "convertFromPdf",
    title: "PDF to JPG",
    description: "Convert PDF pages into JPG images.",
    icon: <FileImage className="h-5 w-5" />,
  },
  {
    id: "pdf-to-word",
    category: "convertFromPdf",
    title: "PDF to WORD",
    description: "Convert a PDF into a DOCX file.",
    icon: <FileText className="h-5 w-5" />,
  },
  {
    id: "pdf-to-powerpoint",
    category: "convertFromPdf",
    title: "PDF to POWERPOINT",
    description: "Convert a PDF into a PowerPoint presentation.",
    icon: <FileText className="h-5 w-5" />,
  },
  {
    id: "pdf-to-excel",
    category: "convertFromPdf",
    title: "PDF to EXCEL",
    description: "Convert PDF tables into an Excel workbook.",
    icon: <FileText className="h-5 w-5" />,
  },
  {
    id: "pdf-to-pdfa",
    category: "convertFromPdf",
    title: "PDF to PDF/A",
    description: "Convert a PDF into archival PDF/A format.",
    icon: <FileText className="h-5 w-5" />,
  },
  {
    id: "rotate",
    category: "edit",
    title: "Rotate PDF",
    description: "Rotate all or selected pages.",
    icon: <RotateCw className="h-5 w-5" />,
  },
  {
    id: "page-numbers",
    category: "edit",
    title: "Add page numbers",
    description: "Add page numbers to every page.",
    icon: <Hash className="h-5 w-5" />,
  },
  {
    id: "watermark",
    category: "edit",
    title: "Add watermark",
    description: "Add a text watermark across PDF pages.",
    icon: <Stamp className="h-5 w-5" />,
  },
  {
    id: "image-watermark",
    category: "edit",
    title: "Image watermark",
    description: "Add a logo/image watermark to PDF pages.",
    icon: <ImageIcon className="h-5 w-5" />,
  },
  {
    id: "crop-pdf",
    category: "edit",
    title: "Crop PDF",
    description: "Crop page edges using percentage margins.",
    icon: <Crop className="h-5 w-5" />,
  },
  {
    id: "pdf-forms",
    category: "edit",
    title: "PDF Forms",
    description: "Fill PDF form fields and optionally flatten them.",
    icon: <FileText className="h-5 w-5" />,
  },
  {
    id: "unlock-pdf",
    category: "security",
    title: "Unlock PDF",
    description: "Remove password protection from a PDF.",
    icon: <LockKeyhole className="h-5 w-5" />,
  },
  {
    id: "protect-pdf",
    category: "security",
    title: "Protect PDF",
    description: "Add password protection to a PDF.",
    icon: <ShieldCheck className="h-5 w-5" />,
  },
  {
    id: "redact-pdf",
    category: "security",
    title: "Redact PDF",
    description: "Permanently hide text terms in a PDF.",
    icon: <FileX className="h-5 w-5" />,
  },
  {
    id: "compare-pdf",
    category: "security",
    title: "Compare PDF",
    description: "Compare two PDFs and inspect differences.",
    icon: <FileSearch className="h-5 w-5" />,
  },
];

function parsePageRanges(input: string, pageCount: number) {
  const cleaned = input.trim();

  if (!cleaned) {
    throw new Error("Enter page numbers first, for example: 1,3,5-7.");
  }

  const pages = new Set<number>();
  const parts = cleaned
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  for (const part of parts) {
    if (part.includes("-")) {
      const [startRaw, endRaw] = part.split("-").map((value) => value.trim());
      const start = Number(startRaw);
      const end = Number(endRaw);

      if (!Number.isInteger(start) || !Number.isInteger(end)) {
        throw new Error(`Invalid page range: ${part}`);
      }

      if (start < 1 || end < 1 || start > pageCount || end > pageCount) {
        throw new Error(`Page range out of bounds: ${part}`);
      }

      if (start > end) {
        throw new Error(`Invalid page range order: ${part}`);
      }

      for (let page = start; page <= end; page += 1) {
        pages.add(page - 1);
      }
    } else {
      const page = Number(part);

      if (!Number.isInteger(page)) {
        throw new Error(`Invalid page number: ${part}`);
      }

      if (page < 1 || page > pageCount) {
        throw new Error(`Page number out of bounds: ${page}`);
      }

      pages.add(page - 1);
    }
  }

  return [...pages];
}

function parsePageOrder(input: string, pageCount: number) {
  const indexes = parsePageRanges(input, pageCount);

  if (indexes.length !== pageCount) {
    throw new Error(
      `Enter all ${pageCount} pages exactly once, for example: ${Array.from(
        { length: pageCount },
        (_, index) => index + 1,
      )
        .reverse()
        .join(",")}`,
    );
  }

  const uniqueIndexes = new Set(indexes);

  if (uniqueIndexes.size !== pageCount) {
    throw new Error("Page order cannot contain duplicate pages.");
  }

  return indexes;
}

function makeDownloadName(file: File | null, suffix: string, ext = ".pdf") {
  const baseName = file?.name?.replace(/\.[^.]+$/i, "") || "document";
  return `${baseName}-${suffix}${ext}`;
}

function pdfBytesToBlob(bytes: Uint8Array) {
  return new Blob([Uint8Array.from(bytes)], {
    type: "application/pdf",
  });
}

function createFileOutput(name: string, blob: Blob): OutputFile {
  return {
    name,
    blob,
    size: blob.size,
    kind: "file",
  };
}

function createTextOutput(name: string, text: string): OutputFile {
  const blob = new Blob([text], {
    type: "application/json;charset=utf-8",
  });

  return {
    name,
    blob,
    size: blob.size,
    kind: "text",
    previewText: text,
  };
}

function isPdfFile(file: File) {
  return (
    file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")
  );
}

function isImageFile(file: File) {
  return (
    file.type.startsWith("image/") ||
    /\.(png|jpe?g|webp)$/i.test(file.name.toLowerCase())
  );
}

function isWordFile(file: File) {
  return (
    /\.(doc|docx)$/i.test(file.name.toLowerCase()) ||
    file.type === "application/msword" ||
    file.type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  );
}

function isPowerPointFile(file: File) {
  return (
    /\.(ppt|pptx)$/i.test(file.name.toLowerCase()) ||
    file.type === "application/vnd.ms-powerpoint" ||
    file.type ===
      "application/vnd.openxmlformats-officedocument.presentationml.presentation"
  );
}

function isExcelFile(file: File) {
  return (
    /\.(xls|xlsx)$/i.test(file.name.toLowerCase()) ||
    file.type === "application/vnd.ms-excel" ||
    file.type ===
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
}

function fileNameFromDisposition(disposition: string | null, fallback: string) {
  if (!disposition) return fallback;

  const utfMatch = disposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utfMatch?.[1]) {
    try {
      return decodeURIComponent(utfMatch[1]);
    } catch {
      return utfMatch[1];
    }
  }

  const plainMatch = disposition.match(/filename="([^"]+)"/i);
  if (plainMatch?.[1]) {
    return plainMatch[1];
  }

  return fallback;
}

function parseFormAssignments(input: string) {
  const map = new Map<string, string>();

  for (const line of input.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const separatorIndex = trimmed.includes("=")
      ? trimmed.indexOf("=")
      : trimmed.indexOf(":");

    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();

    if (key) {
      map.set(key, value);
    }
  }

  return map;
}

function isTruthyValue(value: string) {
  return ["true", "yes", "1", "checked", "on"].includes(value.toLowerCase());
}

export default function PdfEditorPage() {
  const [activeCategory, setActiveCategory] = useState<Category>("all");
  const [mode, setMode] = useState<Mode>("merge");
  const [showToolPanel, setShowToolPanel] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [secondCompareFile, setSecondCompareFile] = useState<File | null>(null);
  const [pageRanges, setPageRanges] = useState("");
  const [rotation, setRotation] = useState("90");
  const [compressionQuality, setCompressionQuality] = useState("0.6");
  const [pageNumberPosition, setPageNumberPosition] = useState("bottom-center");
  const [watermarkText, setWatermarkText] = useState("CONFIDENTIAL");
  const [watermarkOpacity, setWatermarkOpacity] = useState(0.25);
  const [imageWatermarkFile, setImageWatermarkFile] = useState<File | null>(
    null,
  );
  const [htmlContent, setHtmlContent] = useState("");
  const [htmlFileName, setHtmlFileName] = useState("html-document");
  const [password, setPassword] = useState("");
  const [ownerPassword, setOwnerPassword] = useState("");
  const [redactionTerms, setRedactionTerms] = useState("");
  const [cropTop, setCropTop] = useState("5");
  const [cropRight, setCropRight] = useState("5");
  const [cropBottom, setCropBottom] = useState("5");
  const [cropLeft, setCropLeft] = useState("5");
  const [formFieldsText, setFormFieldsText] = useState(
    "Full Name=Alex Doe\nEmail=alex@example.com",
  );
  const [flattenForms, setFlattenForms] = useState(true);
  const [detectedFormFields, setDetectedFormFields] = useState<string[]>([]);
  const [output, setOutput] = useState<OutputFile | null>(null);
  const [error, setError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const visibleModes = useMemo(() => {
    if (activeCategory === "all") return modes;
    return modes.filter((item) => item.category === activeCategory);
  }, [activeCategory]);

  const selectedMode = useMemo(
    () => modes.find((item) => item.id === mode) || modes[0],
    [mode],
  );

  const isHtmlMode = mode === "html-to-pdf";
  const isImageMode = mode === "images-to-pdf" || mode === "scan-to-pdf";
  const isWordMode = mode === "word-to-pdf";
  const isPowerPointMode = mode === "powerpoint-to-pdf";
  const isExcelMode = mode === "excel-to-pdf";
  const isUnlockMode = mode === "unlock-pdf";
  const isProtectMode = mode === "protect-pdf";
  const isRedactMode = mode === "redact-pdf";
  const isCompareMode = mode === "compare-pdf";
  const isCropMode = mode === "crop-pdf";
  const isPdfFormsMode = mode === "pdf-forms";

  const needsPageInput = [
    "split",
    "extract-pages",
    "remove",
    "rotate",
    "reorder",
  ].includes(mode);

  async function inspectPdfForms(file: File) {
    try {
      const pdf = await PDFDocument.load(await file.arrayBuffer());
      const form = pdf.getForm();
      const fields = form.getFields().map((field) => field.getName());
      setDetectedFormFields(fields);
    } catch {
      setDetectedFormFields([]);
    }
  }

  function resetWorkingState() {
    setFiles([]);
    setSecondCompareFile(null);
    setPageRanges("");
    setRotation("90");
    setCompressionQuality("0.6");
    setPageNumberPosition("bottom-center");
    setWatermarkText("CONFIDENTIAL");
    setWatermarkOpacity(0.25);
    setImageWatermarkFile(null);
    setHtmlContent("");
    setHtmlFileName("");
    setPassword("");
    setOwnerPassword("");
    setRedactionTerms("");
    setCropTop("5");
    setCropRight("5");
    setCropBottom("5");
    setCropLeft("5");
    setFormFieldsText("Full Name=Alex Doe\nEmail=alex@example.com");
    setFlattenForms(true);
    setDetectedFormFields([]);
    setOutput(null);
    setError("");
    setIsProcessing(false);
  }

  function switchMode(nextMode: Mode) {
    setShowToolPanel(true);
    setMode(nextMode);
    resetWorkingState();
  }

  function switchCategory(nextCategory: Category) {
    setActiveCategory(nextCategory);
    setShowToolPanel(false);

    const nextVisibleModes =
      nextCategory === "all"
        ? modes
        : modes.filter((item) => item.category === nextCategory);

    if (!nextVisibleModes.find((item) => item.id === mode)) {
      setMode(nextVisibleModes[0].id);
    }

    resetWorkingState();
  }

  function backToTools() {
    setShowToolPanel(false);
    resetWorkingState();
  }

  function handleFilesChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(event.target.files || []);

    setError("");
    setOutput(null);
    setDetectedFormFields([]);

    if (!selectedFiles.length) return;

    const invalidFile = selectedFiles.find((file) => {
      if (isImageMode) return !isImageFile(file);
      if (isWordMode) return !isWordFile(file);
      if (isPowerPointMode) return !isPowerPointFile(file);
      if (isExcelMode) return !isExcelFile(file);
      return !isPdfFile(file);
    });

    if (invalidFile) {
      if (isImageMode) {
        setError("Please upload JPG, PNG, or WebP images only.");
      } else if (isWordMode) {
        setError("Please upload DOC or DOCX files only.");
      } else if (isPowerPointMode) {
        setError("Please upload PPT or PPTX files only.");
      } else if (isExcelMode) {
        setError("Please upload XLS or XLSX files only.");
      } else {
        setError("Please upload PDF files only.");
      }

      setFiles([]);
      return;
    }

    setFiles(selectedFiles);

    if (isPdfFormsMode && selectedFiles[0] && isPdfFile(selectedFiles[0])) {
      void inspectPdfForms(selectedFiles[0]);
    }
  }

  function handleSecondCompareFileChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const selectedFile = event.target.files?.[0] || null;

    setError("");
    setOutput(null);

    if (!selectedFile) {
      setSecondCompareFile(null);
      return;
    }

    if (!isPdfFile(selectedFile)) {
      setError("Please upload a PDF file for comparison.");
      setSecondCompareFile(null);
      return;
    }

    setSecondCompareFile(selectedFile);
  }

  async function mergePdfs() {
    if (files.length < 2) {
      throw new Error("Upload at least two PDF files to merge.");
    }

    const mergedPdf = await PDFDocument.create();

    for (const file of files) {
      const sourcePdf = await PDFDocument.load(await file.arrayBuffer());
      const copiedPages = await mergedPdf.copyPages(
        sourcePdf,
        sourcePdf.getPageIndices(),
      );
      copiedPages.forEach((page) => mergedPdf.addPage(page));
    }

    return pdfBytesToBlob(await mergedPdf.save());
  }

  async function splitPdf() {
    const file = files[0];
    if (!file) throw new Error("Upload one PDF file first.");

    const sourcePdf = await PDFDocument.load(await file.arrayBuffer());
    const pageIndexes = parsePageRanges(pageRanges, sourcePdf.getPageCount());
    const newPdf = await PDFDocument.create();
    const copiedPages = await newPdf.copyPages(sourcePdf, pageIndexes);
    copiedPages.forEach((page) => newPdf.addPage(page));

    return pdfBytesToBlob(await newPdf.save());
  }

  async function removePages() {
    const file = files[0];
    if (!file) throw new Error("Upload one PDF file first.");

    const sourcePdf = await PDFDocument.load(await file.arrayBuffer());
    const pageCount = sourcePdf.getPageCount();
    const removeIndexes = new Set(parsePageRanges(pageRanges, pageCount));
    const keepIndexes = sourcePdf
      .getPageIndices()
      .filter((pageIndex) => !removeIndexes.has(pageIndex));

    if (!keepIndexes.length) {
      throw new Error("You cannot remove every page from the PDF.");
    }

    const newPdf = await PDFDocument.create();
    const copiedPages = await newPdf.copyPages(sourcePdf, keepIndexes);
    copiedPages.forEach((page) => newPdf.addPage(page));

    return pdfBytesToBlob(await newPdf.save());
  }

  async function rotatePages() {
    const file = files[0];
    if (!file) throw new Error("Upload one PDF file first.");

    const pdf = await PDFDocument.load(await file.arrayBuffer());
    const pageCount = pdf.getPageCount();
    const angle = Number(rotation);

    if (![90, 180, 270].includes(angle)) {
      throw new Error("Choose a valid rotation angle.");
    }

    const pageIndexes = pageRanges.trim()
      ? parsePageRanges(pageRanges, pageCount)
      : pdf.getPageIndices();

    pageIndexes.forEach((pageIndex) => {
      const page = pdf.getPage(pageIndex);
      const currentAngle = page.getRotation().angle;
      page.setRotation(degrees((currentAngle + angle) % 360));
    });

    return pdfBytesToBlob(await pdf.save());
  }

  async function reorderPages() {
    const file = files[0];
    if (!file) throw new Error("Upload one PDF file first.");

    const sourcePdf = await PDFDocument.load(await file.arrayBuffer());
    const pageOrder = parsePageOrder(pageRanges, sourcePdf.getPageCount());
    const newPdf = await PDFDocument.create();
    const copiedPages = await newPdf.copyPages(sourcePdf, pageOrder);
    copiedPages.forEach((page) => newPdf.addPage(page));

    return pdfBytesToBlob(await newPdf.save());
  }

  async function addPageNumbers() {
    const file = files[0];
    if (!file) throw new Error("Upload one PDF file first.");

    const pdf = await PDFDocument.load(await file.arrayBuffer());
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const pages = pdf.getPages();

    pages.forEach((page, index) => {
      const { width, height } = page.getSize();
      const label = `${index + 1} / ${pages.length}`;
      const fontSize = 11;
      const textWidth = font.widthOfTextAtSize(label, fontSize);
      const margin = 28;

      let x = width / 2 - textWidth / 2;
      let y = 24;

      if (pageNumberPosition.startsWith("top")) y = height - 34;
      if (pageNumberPosition.endsWith("left")) x = margin;
      if (pageNumberPosition.endsWith("right")) x = width - textWidth - margin;

      page.drawText(label, {
        x,
        y,
        size: fontSize,
        font,
        color: rgb(0.25, 0.25, 0.3),
      });
    });

    return pdfBytesToBlob(await pdf.save());
  }

  async function addWatermark() {
    const file = files[0];
    if (!file) throw new Error("Upload one PDF file first.");

    const text = watermarkText.trim();
    if (!text) throw new Error("Enter watermark text first.");

    const pdf = await PDFDocument.load(await file.arrayBuffer());
    const font = await pdf.embedFont(StandardFonts.HelveticaBold);

    pdf.getPages().forEach((page) => {
      const { width, height } = page.getSize();
      const fontSize = Math.max(28, Math.min(width, height) / 10);
      const textWidth = font.widthOfTextAtSize(text, fontSize);

      page.drawText(text, {
        x: width / 2 - textWidth / 2,
        y: height / 2,
        size: fontSize,
        font,
        color: rgb(0.75, 0.75, 0.8),
        opacity: watermarkOpacity,
        rotate: degrees(-35),
      });
    });

    return pdfBytesToBlob(await pdf.save());
  }

  async function addImageWatermark() {
    const file = files[0];
    if (!file) throw new Error("Upload one PDF file first.");
    if (!imageWatermarkFile) throw new Error("Upload a watermark image first.");

    const pdf = await PDFDocument.load(await file.arrayBuffer());
    const imageBytes = await imageWatermarkFile.arrayBuffer();

    const embeddedImage =
      imageWatermarkFile.type === "image/png" ||
      imageWatermarkFile.name.toLowerCase().endsWith(".png")
        ? await pdf.embedPng(imageBytes)
        : await pdf.embedJpg(imageBytes);

    pdf.getPages().forEach((page) => {
      const { width } = page.getSize();
      const maxWidth = width * 0.28;
      const scale = maxWidth / embeddedImage.width;
      const imageWidth = embeddedImage.width * scale;
      const imageHeight = embeddedImage.height * scale;

      page.drawImage(embeddedImage, {
        x: width - imageWidth - 32,
        y: 32,
        width: imageWidth,
        height: imageHeight,
        opacity: watermarkOpacity,
      });
    });

    return pdfBytesToBlob(await pdf.save());
  }

  async function cropPdf() {
    const file = files[0];
    if (!file) throw new Error("Upload one PDF file first.");

    const topPct = Number(cropTop);
    const rightPct = Number(cropRight);
    const bottomPct = Number(cropBottom);
    const leftPct = Number(cropLeft);

    const values = [topPct, rightPct, bottomPct, leftPct];
    if (
      values.some((value) => Number.isNaN(value) || value < 0 || value >= 45)
    ) {
      throw new Error("Crop values must be numbers between 0 and 44.");
    }

    if (leftPct + rightPct >= 90 || topPct + bottomPct >= 90) {
      throw new Error("Crop percentages are too large.");
    }

    const pdf = await PDFDocument.load(await file.arrayBuffer());
    const pageCount = pdf.getPageCount();
    const targetPages = pageRanges.trim()
      ? parsePageRanges(pageRanges, pageCount)
      : pdf.getPageIndices();

    targetPages.forEach((pageIndex) => {
      const page = pdf.getPage(pageIndex);
      const { width, height } = page.getSize();

      const left = (width * leftPct) / 100;
      const right = (width * rightPct) / 100;
      const bottom = (height * bottomPct) / 100;
      const top = (height * topPct) / 100;

      const croppedWidth = width - left - right;
      const croppedHeight = height - top - bottom;

      if (croppedWidth <= 10 || croppedHeight <= 10) {
        throw new Error("Crop would make one or more pages too small.");
      }

      page.setCropBox(left, bottom, croppedWidth, croppedHeight);
    });

    return pdfBytesToBlob(await pdf.save());
  }

  async function fillPdfForms() {
    const file = files[0];
    if (!file) throw new Error("Upload one PDF file first.");

    const assignments = parseFormAssignments(formFieldsText);
    if (!assignments.size) {
      throw new Error("Enter at least one form assignment like Name=Alex.");
    }

    const pdf = await PDFDocument.load(await file.arrayBuffer());
    const form = pdf.getForm();
    const fields = form.getFields();
    const availableFieldNames = fields.map((field) => field.getName());
    let updated = 0;

    for (const field of fields) {
      const name = field.getName();
      if (!assignments.has(name)) continue;

      const value = assignments.get(name) || "";

      if (field instanceof PDFTextField) {
        field.setText(value);
        updated += 1;
      } else if (field instanceof PDFCheckBox) {
        if (isTruthyValue(value)) {
          field.check();
        } else {
          field.uncheck();
        }
        updated += 1;
      } else if (field instanceof PDFDropdown) {
        field.select(value);
        updated += 1;
      } else if (field instanceof PDFOptionList) {
        field.select(value);
        updated += 1;
      } else if (field instanceof PDFRadioGroup) {
        field.select(value);
        updated += 1;
      }
    }

    if (!updated) {
      throw new Error(
        availableFieldNames.length
          ? `No matching fields were updated. Available fields: ${availableFieldNames.join(", ")}`
          : "No fillable fields were found in this PDF.",
      );
    }

    if (flattenForms) {
      form.flatten();
    }

    return pdfBytesToBlob(await pdf.save());
  }

  async function imagesToPdf() {
    if (!files.length) throw new Error("Upload one or more images first.");

    const pdf = await PDFDocument.create();

    for (const file of files) {
      const imageBytes = await file.arrayBuffer();
      const embeddedImage =
        file.type === "image/png" || file.name.toLowerCase().endsWith(".png")
          ? await pdf.embedPng(imageBytes)
          : await pdf.embedJpg(imageBytes);

      const page = pdf.addPage([embeddedImage.width, embeddedImage.height]);
      page.drawImage(embeddedImage, {
        x: 0,
        y: 0,
        width: embeddedImage.width,
        height: embeddedImage.height,
      });
    }

    return pdfBytesToBlob(await pdf.save());
  }

  async function compressPdf() {
    const file = files[0];
    if (!file) throw new Error("Upload one PDF file first.");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("quality", compressionQuality);

    const response = await fetchPdfApi("/api/pdf/compress", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error((await response.text()) || "Could not compress PDF.");
    }

    return response.blob();
  }

  async function officeToPdf() {
    const file = files[0];
    if (!file) throw new Error("Upload one file first.");

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetchPdfApi("/api/pdf/office-to-pdf", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
  throw new Error(
    await getApiErrorMessage(
      response,
      "Could not convert this Office file to PDF. Please try again.",
    ),
  );
}

    return response.blob();
  }

  async function htmlToPdf() {
    const html = htmlContent.trim();
    if (!html) throw new Error("Enter HTML content first.");

    const response = await fetchPdfApi("/api/pdf/html-to-pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        html,
        fileName: htmlFileName.trim() || "html-document",
      }),
    });

    if (!response.ok) {
  throw new Error(
    await getApiErrorMessage(
      response,
      "Could not convert this HTML to PDF. Please try again.",
    ),
  );
}

    return response.blob();
  }

  async function pdfToJpg() {
    const file = files[0];
    if (!file) throw new Error("Upload one PDF file first.");

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetchPdfApi("/api/pdf/to-jpg", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
  throw new Error(
    await getApiErrorMessage(
      response,
      "Could not convert this PDF to JPG. Please try again.",
    ),
  );
}

    const blob = await response.blob();
    const contentDisposition = response.headers.get("content-disposition");
    const fallback =
      blob.type === "application/zip"
        ? makeDownloadName(file, "jpg", ".zip")
        : `${file.name.replace(/\.[^.]+$/i, "")}.jpg`;

    return {
      blob,
      name: fileNameFromDisposition(contentDisposition, fallback),
    };
  }

  async function pdfToWord() {
    const file = files[0];
    if (!file) throw new Error("Upload one PDF file first.");

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetchPdfApi("/api/pdf/to-word", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
  throw new Error(
    await getApiErrorMessage(
      response,
      "Could not convert this PDF to Word. Please try again.",
    ),
  );
}

    const blob = await response.blob();
    const contentDisposition = response.headers.get("content-disposition");

    return {
      blob,
      name: fileNameFromDisposition(
        contentDisposition,
        makeDownloadName(file, "converted", ".docx"),
      ),
    };
  }

  async function pdfToPowerPoint() {
    const file = files[0];
    if (!file) throw new Error("Upload one PDF file first.");

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetchPdfApi("/api/pdf/to-powerpoint", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
  throw new Error(
    await getApiErrorMessage(
      response,
      "Could not convert this PDF to PowerPoint. Please try again.",
    ),
  );
}

    const blob = await response.blob();
    const contentDisposition = response.headers.get("content-disposition");

    return {
      blob,
      name: fileNameFromDisposition(
        contentDisposition,
        makeDownloadName(file, "powerpoint", ".pptx"),
      ),
    };
  }

  async function pdfToExcel() {
    const file = files[0];
    if (!file) throw new Error("Upload one PDF file first.");

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetchPdfApi("/api/pdf/to-excel", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
  throw new Error(
    await getApiErrorMessage(
      response,
      "Could not convert this PDF to Excel. Please try again.",
    ),
  );
}

    const blob = await response.blob();
    const contentDisposition = response.headers.get("content-disposition");

    return {
      blob,
      name: fileNameFromDisposition(
        contentDisposition,
        makeDownloadName(file, "excel", ".xlsx"),
      ),
    };
  }

  async function pdfToPdfa() {
    const file = files[0];
    if (!file) throw new Error("Upload one PDF file first.");

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetchPdfApi("/api/pdf/to-pdfa", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
  throw new Error(
    await getApiErrorMessage(
      response,
      "Could not convert this PDF to PDF/A. Please try again.",
    ),
  );
}
    const blob = await response.blob();
    const contentDisposition = response.headers.get("content-disposition");

    return {
      blob,
      name: fileNameFromDisposition(
        contentDisposition,
        makeDownloadName(file, "pdfa"),
      ),
    };
  }

  async function unlockPdf() {
    const file = files[0];
    if (!file) throw new Error("Upload one PDF file first.");

    const currentPassword = password.trim();
    if (!currentPassword) {
      throw new Error("Enter the current PDF password first.");
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("password", currentPassword);

    const response = await fetchPdfApi("/api/pdf/unlock", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
  throw new Error(
    await getApiErrorMessage(
      response,
      "We could not unlock this PDF. Please check the password and try again.",
    ),
  );
}

    return response.blob();
  }

  async function protectPdf() {
    const file = files[0];
    if (!file) throw new Error("Upload one PDF file first.");

    const userPassword = password.trim();
    const nextOwnerPassword = ownerPassword.trim() || userPassword;

    if (!userPassword) throw new Error("Enter a password first.");
    if (userPassword.length < 4) {
      throw new Error("Password must be at least 4 characters long.");
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("password", userPassword);
    formData.append("ownerPassword", nextOwnerPassword);

    const response = await fetchPdfApi("/api/pdf/protect", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
  throw new Error(
    await getApiErrorMessage(
      response,
      "Could not protect this PDF. Please try again.",
    ),
  );
}

    return response.blob();
  }

  async function redactPdf() {
    const file = files[0];
    if (!file) throw new Error("Upload one PDF file first.");

    const terms = redactionTerms.trim();
    if (!terms) {
      throw new Error("Enter at least one redaction term.");
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("terms", terms);

    const response = await fetchPdfApi("/api/pdf/redact", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
  throw new Error(
    await getApiErrorMessage(
      response,
      "Could not redact this PDF. Please try again.",
    ),
  );
}

    return response.blob();
  }

  async function comparePdfs() {
    const firstFile = files[0];
    const secondFile = secondCompareFile;

    if (!firstFile || !secondFile) {
      throw new Error("Upload both PDF files to compare.");
    }

    const formData = new FormData();
    formData.append("firstFile", firstFile);
    formData.append("secondFile", secondFile);

    const response = await fetchPdfApi("/api/pdf/compare", {
      method: "POST",
      body: formData,
    });

    const responseText = await response.text();

    if (!response.ok) {
  throw new Error(
    await getApiErrorMessage(
      response,
      "Could not compare these PDFs. Please try again.",
    ),
  );
}

    return JSON.parse(responseText) as CompareResult;
  }

  async function processPdf() {
    try {
      setError("");
      setOutput(null);
      setIsProcessing(true);

      let nextOutput: OutputFile;

      if (mode === "merge") {
        nextOutput = createFileOutput("merged-pdf.pdf", await mergePdfs());
      } else if (mode === "split") {
        nextOutput = createFileOutput(
          makeDownloadName(files[0] || null, "split"),
          await splitPdf(),
        );
      } else if (mode === "extract-pages") {
        nextOutput = createFileOutput(
          makeDownloadName(files[0] || null, "extracted-pages"),
          await splitPdf(),
        );
      } else if (mode === "remove") {
        nextOutput = createFileOutput(
          makeDownloadName(files[0] || null, "pages-removed"),
          await removePages(),
        );
      } else if (mode === "rotate") {
        nextOutput = createFileOutput(
          makeDownloadName(files[0] || null, "rotated"),
          await rotatePages(),
        );
      } else if (mode === "reorder") {
        nextOutput = createFileOutput(
          makeDownloadName(files[0] || null, "organized"),
          await reorderPages(),
        );
      } else if (mode === "page-numbers") {
        nextOutput = createFileOutput(
          makeDownloadName(files[0] || null, "numbered"),
          await addPageNumbers(),
        );
      } else if (mode === "watermark") {
        nextOutput = createFileOutput(
          makeDownloadName(files[0] || null, "watermarked"),
          await addWatermark(),
        );
      } else if (mode === "image-watermark") {
        nextOutput = createFileOutput(
          makeDownloadName(files[0] || null, "image-watermarked"),
          await addImageWatermark(),
        );
      } else if (mode === "crop-pdf") {
        nextOutput = createFileOutput(
          makeDownloadName(files[0] || null, "cropped"),
          await cropPdf(),
        );
      } else if (mode === "pdf-forms") {
        nextOutput = createFileOutput(
          makeDownloadName(
            files[0] || null,
            flattenForms ? "forms-filled" : "forms-updated",
          ),
          await fillPdfForms(),
        );
      } else if (mode === "images-to-pdf") {
        nextOutput = createFileOutput("images-to-pdf.pdf", await imagesToPdf());
      } else if (mode === "scan-to-pdf") {
        nextOutput = createFileOutput("scan-to-pdf.pdf", await imagesToPdf());
      } else if (
        mode === "word-to-pdf" ||
        mode === "powerpoint-to-pdf" ||
        mode === "excel-to-pdf"
      ) {
        nextOutput = createFileOutput(
          makeDownloadName(files[0] || null, "converted"),
          await officeToPdf(),
        );
      } else if (mode === "html-to-pdf") {
        nextOutput = createFileOutput(
          `${(htmlFileName.trim() || "html-document").replace(/\.[^.]+$/, "")}.pdf`,
          await htmlToPdf(),
        );
      } else if (mode === "pdf-to-jpg") {
        const result = await pdfToJpg();
        nextOutput = createFileOutput(result.name, result.blob);
      } else if (mode === "pdf-to-word") {
        const result = await pdfToWord();
        nextOutput = createFileOutput(result.name, result.blob);
      } else if (mode === "pdf-to-powerpoint") {
        const result = await pdfToPowerPoint();
        nextOutput = createFileOutput(result.name, result.blob);
      } else if (mode === "pdf-to-excel") {
        const result = await pdfToExcel();
        nextOutput = createFileOutput(result.name, result.blob);
      } else if (mode === "pdf-to-pdfa") {
        const result = await pdfToPdfa();
        nextOutput = createFileOutput(result.name, result.blob);
      } else if (mode === "unlock-pdf") {
        nextOutput = createFileOutput(
          makeDownloadName(files[0] || null, "unlocked"),
          await unlockPdf(),
        );
      } else if (mode === "protect-pdf") {
        nextOutput = createFileOutput(
          makeDownloadName(files[0] || null, "protected"),
          await protectPdf(),
        );
      } else if (mode === "redact-pdf") {
        nextOutput = createFileOutput(
          makeDownloadName(files[0] || null, "redacted"),
          await redactPdf(),
        );
      } else if (mode === "compare-pdf") {
        const result = await comparePdfs();
        nextOutput = createTextOutput(
          "pdf-compare-result.json",
          JSON.stringify(result, null, 2),
        );
      } else {
        nextOutput = createFileOutput(
          makeDownloadName(files[0] || null, "compressed"),
          await compressPdf(),
        );
      }

      setOutput(nextOutput);
    } catch (caughtError) {
      console.error(caughtError);
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not process this file. Please try again.",
      );
    } finally {
      setIsProcessing(false);
    }
  }

  function downloadOutput() {
    if (!output) return;

    const url = URL.createObjectURL(output.blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = output.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  const canProcess = isHtmlMode
    ? !!htmlContent.trim()
    : isCompareMode
      ? files.length > 0 && !!secondCompareFile
      : files.length > 0;

  return (
    <Container className="py-12 sm:py-16">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
          PDF Editor
        </h1>

        <p className="mt-4 text-base leading-7 text-slate-400">
          Merge, split, extract, remove, scan, edit, convert, compress, and
          secure PDFs in one place.
        </p>
      </div>

      {!showToolPanel ? (
        <div className="mx-auto mt-8 max-w-6xl">
          <div className="flex flex-wrap gap-3">
            {categoryTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => switchCategory(tab.id)}
                className={`rounded-full border px-6 py-3 text-sm font-semibold tracking-[0.14em] transition ${
                  activeCategory === tab.id
                    ? "border-white bg-white text-slate-950"
                    : "border-white/10 bg-white/[0.05] text-slate-400 hover:bg-white/[0.08] hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {visibleModes.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => switchMode(item.id)}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-left transition hover:border-violet-500/50 hover:bg-white/[0.05]"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-violet-600 text-white">
                  {item.icon}
                </div>

                <h2 className="font-semibold text-white">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  {item.description}
                </p>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {showToolPanel ? (
        <div className="mx-auto mt-8 max-w-6xl">
          <button
            type="button"
            onClick={backToTools}
            className="mb-5 inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to all PDF tools
          </button>

          <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-600 text-white">
                  {selectedMode.icon}
                </div>
                <div>
                  <h2 className="font-semibold text-white">
                    {selectedMode.title}
                  </h2>
                  <p className="text-sm text-slate-400">
                    {selectedMode.description}
                  </p>
                </div>
              </div>

              {isHtmlMode ? (
                <div className="space-y-5">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">
                      File name
                    </label>
                    <input
                      value={htmlFileName}
                      onChange={(event) => setHtmlFileName(event.target.value)}
                      placeholder="html-document"
                      className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-violet-500"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">
                      HTML content
                    </label>
                    <textarea
                      value={htmlContent}
                      onChange={(event) => setHtmlContent(event.target.value)}
                      rows={14}
                      className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 font-mono text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-violet-500"
                    />
                  </div>
                </div>
              ) : (
                <>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Upload{" "}
                    {isImageMode
                      ? "images"
                      : isWordMode
                        ? "Word file"
                        : isPowerPointMode
                          ? "PowerPoint file"
                          : isExcelMode
                            ? "Excel file"
                            : isCompareMode
                              ? "first PDF"
                              : `PDF ${mode === "merge" ? "files" : "file"}`}
                  </label>

                  <label className="flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-slate-950 p-6 text-center transition hover:border-violet-500/60 hover:bg-white/[0.03]">
                    <Upload className="mb-3 h-8 w-8 text-violet-300" />

                    <span className="font-medium text-white">
                      Click to choose{" "}
                      {isImageMode
                        ? "images"
                        : isWordMode
                          ? "Word file"
                          : isPowerPointMode
                            ? "PowerPoint file"
                            : isExcelMode
                              ? "Excel file"
                              : isCompareMode
                                ? "first PDF"
                                : `PDF ${mode === "merge" ? "files" : "file"}`}
                    </span>

                    <span className="mt-2 text-sm text-slate-500">
                      {isImageMode
                        ? "Select JPG, PNG, or WebP images"
                        : isWordMode
                          ? "Select one DOC or DOCX file"
                          : isPowerPointMode
                            ? "Select one PPT or PPTX file"
                            : isExcelMode
                              ? "Select one XLS or XLSX file"
                              : mode === "merge"
                                ? "Select two or more PDFs"
                                : "Select one PDF file"}
                    </span>

                    <input
                      type="file"
                      accept={
                        isImageMode
                          ? "image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
                          : isWordMode
                            ? ".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                            : isPowerPointMode
                              ? ".ppt,.pptx,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                              : isExcelMode
                                ? ".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                                : "application/pdf,.pdf"
                      }
                      multiple={mode === "merge" || isImageMode}
                      onChange={handleFilesChange}
                      className="hidden"
                    />
                  </label>

                  {files.length ? (
                    <div className="mt-4 space-y-2">
                      {files.map((file) => (
                        <div
                          key={`${file.name}-${file.size}`}
                          className="rounded-xl border border-white/10 bg-slate-950 px-4 py-3"
                        >
                          <p className="break-all text-sm font-medium text-white">
                            {file.name}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {formatFileSize(file.size)}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </>
              )}

              {isCompareMode ? (
                <div className="mt-5">
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Upload second PDF
                  </label>
                  <input
                    type="file"
                    accept="application/pdf,.pdf"
                    onChange={handleSecondCompareFileChange}
                    className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white file:mr-4 file:rounded-lg file:border-0 file:bg-violet-600 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
                  />

                  {secondCompareFile ? (
                    <div className="mt-3 rounded-xl border border-white/10 bg-slate-950 px-4 py-3">
                      <p className="break-all text-sm font-medium text-white">
                        {secondCompareFile.name}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {formatFileSize(secondCompareFile.size)}
                      </p>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {needsPageInput ? (
                <div className="mt-5">
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    {mode === "reorder"
                      ? "New page order"
                      : mode === "rotate"
                        ? "Pages to rotate"
                        : mode === "remove"
                          ? "Pages to remove"
                          : "Pages to extract"}
                  </label>
                  <input
                    value={pageRanges}
                    onChange={(event) => setPageRanges(event.target.value)}
                    placeholder={
                      mode === "rotate"
                        ? "Leave empty for all pages, or use 1,3,5-7"
                        : mode === "reorder"
                          ? "Example: 3,1,2,4"
                          : "Example: 1,3,5-7"
                    }
                    className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-violet-500"
                  />
                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    {mode === "reorder"
                      ? "Enter every page exactly once in the new order."
                      : mode === "remove"
                        ? "Use commas and ranges to remove pages, for example: 1,3,5-7."
                        : mode === "extract-pages" || mode === "split"
                          ? "Use commas and ranges to extract pages, for example: 1,3,5-7."
                          : "Use commas and ranges, for example: 1,3,5-7."}
                  </p>
                </div>
              ) : null}

              {mode === "rotate" ? (
                <div className="mt-5">
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Rotation
                  </label>
                  <select
                    value={rotation}
                    onChange={(event) => setRotation(event.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-violet-500"
                  >
                    <option value="90">90° clockwise</option>
                    <option value="180">180°</option>
                    <option value="270">270° clockwise</option>
                  </select>
                </div>
              ) : null}

              {mode === "compress-pdf" ? (
                <div className="mt-5">
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Compression level
                  </label>
                  <select
                    value={compressionQuality}
                    onChange={(event) =>
                      setCompressionQuality(event.target.value)
                    }
                    className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-violet-500"
                  >
                    <option value="0.85">Low compression / high quality</option>
                    <option value="0.6">Balanced</option>
                    <option value="0.35">
                      High compression / smaller file
                    </option>
                  </select>
                </div>
              ) : null}

              {mode === "page-numbers" ? (
                <div className="mt-5">
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Number position
                  </label>
                  <select
                    value={pageNumberPosition}
                    onChange={(event) =>
                      setPageNumberPosition(event.target.value)
                    }
                    className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-violet-500"
                  >
                    <option value="bottom-center">Bottom center</option>
                    <option value="bottom-left">Bottom left</option>
                    <option value="bottom-right">Bottom right</option>
                    <option value="top-center">Top center</option>
                    <option value="top-left">Top left</option>
                    <option value="top-right">Top right</option>
                  </select>
                </div>
              ) : null}

              {mode === "image-watermark" ? (
                <div className="mt-5">
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Watermark image
                  </label>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,.png,.jpg,.jpeg"
                    onChange={(event) => {
                      setImageWatermarkFile(event.target.files?.[0] || null);
                      setOutput(null);
                      setError("");
                    }}
                    className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white file:mr-4 file:rounded-lg file:border-0 file:bg-violet-600 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
                  />
                </div>
              ) : null}

              {mode === "watermark" || mode === "image-watermark" ? (
                <div className="mt-5 grid gap-5 sm:grid-cols-2">
                  {mode === "watermark" ? (
                    <div className="sm:col-span-2">
                      <label className="mb-2 block text-sm font-medium text-slate-300">
                        Watermark text
                      </label>
                      <input
                        value={watermarkText}
                        onChange={(event) =>
                          setWatermarkText(event.target.value)
                        }
                        placeholder="CONFIDENTIAL"
                        className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-violet-500"
                      />
                    </div>
                  ) : null}

                  <div className="sm:col-span-2">
                    <div className="flex items-center justify-between gap-3">
                      <label className="block text-sm font-medium text-slate-300">
                        Opacity
                      </label>
                      <span className="rounded-full border border-white/10 bg-slate-950 px-3 py-1 text-xs text-slate-300">
                        {Math.round(watermarkOpacity * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.05"
                      max="0.6"
                      step="0.05"
                      value={watermarkOpacity}
                      onChange={(event) =>
                        setWatermarkOpacity(Number(event.target.value))
                      }
                      className="mt-3 w-full accent-violet-500"
                    />
                  </div>
                </div>
              ) : null}

              {isCropMode ? (
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  {[
                    { label: "Top %", value: cropTop, setValue: setCropTop },
                    {
                      label: "Right %",
                      value: cropRight,
                      setValue: setCropRight,
                    },
                    {
                      label: "Bottom %",
                      value: cropBottom,
                      setValue: setCropBottom,
                    },
                    { label: "Left %", value: cropLeft, setValue: setCropLeft },
                  ].map((item) => (
                    <div key={item.label}>
                      <label className="mb-2 block text-sm font-medium text-slate-300">
                        {item.label}
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="44"
                        value={item.value}
                        onChange={(event) => item.setValue(event.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-violet-500"
                      />
                    </div>
                  ))}
                </div>
              ) : null}

              {isPdfFormsMode ? (
                <div className="mt-5 space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">
                      Field values
                    </label>
                    <textarea
                      value={formFieldsText}
                      onChange={(event) =>
                        setFormFieldsText(event.target.value)
                      }
                      rows={7}
                      placeholder={"Full Name=Alex Doe\nEmail=alex@example.com"}
                      className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 font-mono text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-violet-500"
                    />
                    <p className="mt-2 text-xs text-slate-500">
                      Use one field per line in the format `Field Name=Value`.
                    </p>
                  </div>

                  <label className="inline-flex items-center gap-3 text-sm text-slate-300">
                    <input
                      type="checkbox"
                      checked={flattenForms}
                      onChange={(event) =>
                        setFlattenForms(event.target.checked)
                      }
                      className="h-4 w-4 rounded border-white/20 bg-slate-950"
                    />
                    Flatten form after filling
                  </label>

                  {detectedFormFields.length ? (
                    <div className="rounded-xl border border-white/10 bg-slate-950 p-4">
                      <p className="mb-2 text-sm font-medium text-white">
                        Detected fields
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {detectedFormFields.map((field) => (
                          <span
                            key={field}
                            className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-slate-300"
                          >
                            {field}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {isUnlockMode || isProtectMode ? (
                <div className="mt-5 grid gap-5">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">
                      {isProtectMode ? "User password" : "Current password"}
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder={
                        isProtectMode
                          ? "Enter password to protect PDF"
                          : "Enter current PDF password"
                      }
                      className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-violet-500"
                    />
                  </div>

                  {isProtectMode ? (
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-300">
                        Owner password (optional)
                      </label>
                      <input
                        type="password"
                        value={ownerPassword}
                        onChange={(event) =>
                          setOwnerPassword(event.target.value)
                        }
                        placeholder="Optional. Uses user password if left empty."
                        className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-violet-500"
                      />
                    </div>
                  ) : null}
                </div>
              ) : null}

              {isRedactMode ? (
                <div className="mt-5">
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Terms to redact
                  </label>
                  <textarea
                    value={redactionTerms}
                    onChange={(event) => setRedactionTerms(event.target.value)}
                    placeholder="Enter words or phrases separated by commas or new lines"
                    rows={5}
                    className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-violet-500"
                  />
                </div>
              ) : null}

              {error ? (
                <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {error}
                </div>
              ) : null}

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={processPdf}
                  disabled={!canProcess || isProcessing}
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {isProcessing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <FileText className="h-4 w-4" />
                  )}
                  {isProcessing ? "Processing..." : selectedMode.title}
                </button>

                <button
                  type="button"
                  onClick={resetWorkingState}
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-red-500/30 px-4 py-2.5 text-sm font-semibold text-red-300 transition hover:bg-red-500/10"
                >
                  <Eraser className="h-4 w-4" />
                  Clear
                </button>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
              <h2 className="font-semibold text-white">Output</h2>

              <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950 p-4">
                {output ? (
                  <>
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div>
                        <p className="break-all font-medium text-white">
                          {output.name}
                        </p>
                        <p className="mt-1 text-sm text-slate-400">
                          {formatFileSize(output.size)}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={downloadOutput}
                        className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500"
                      >
                        <Download className="h-4 w-4" />
                        Download
                      </button>
                    </div>

                    {output.kind === "text" ? (
                      <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap rounded-xl border border-white/10 bg-slate-900 p-4 text-left text-sm leading-6 text-slate-200">
                        {output.previewText || "No preview output."}
                      </pre>
                    ) : (
                      <div className="flex min-h-[260px] items-center justify-center rounded-xl border border-white/10 bg-slate-900 text-center text-sm text-slate-500">
                        <div>
                          <FileText className="mx-auto mb-3 h-10 w-10" />
                          Your output file is ready to download.
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex min-h-[320px] items-center justify-center text-center text-sm text-slate-500">
                    <div>
                      <FileText className="mx-auto mb-3 h-10 w-10" />
                      Your output file will appear here.
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <HowToUse
        title="How to use PDF Editor"
        subtitle=""
        steps={[
          {
            title: "Browse tools",
            description:
              "All PDF tools stay visible under the ALL view by default.",
            icon: <FileText className="h-5 w-5" />,
          },
          {
            title: "Choose a tool",
            description:
              "Click Merge PDF, Rotate PDF, Compress PDF, PDF to Excel, or any other tool card.",
            icon: <Crop className="h-5 w-5" />,
          },
          {
            title: "Upload file",
            description:
              "Upload a PDF, image set, Office file, or use HTML content depending on the selected tool.",
            icon: <Upload className="h-5 w-5" />,
          },
          {
            title: "Set options",
            description:
              "Adjust page ranges, crop margins, passwords, form values, watermark settings, or conversion options.",
            icon: <Scissors className="h-5 w-5" />,
          },
          {
            title: "Process",
            description:
              "Run the action using browser tools or the PDF backend, depending on the tool.",
            icon: <Loader2 className="h-5 w-5" />,
          },
          {
            title: "Download",
            description:
              "Download the finished PDF, DOCX, JPG, ZIP, PPTX, XLSX, or compare report.",
            icon: <Download className="h-5 w-5" />,
          },
        ]}
      />
    </Container>
  );
}
