import type { LucideIcon } from "lucide-react";
import {
  FileText,
  FileCode2,
  Braces,
  Code2,
  Paintbrush,
  AlignLeft,
  Table2,
  ArrowLeftRight,
  FileJson,
} from "lucide-react";

export type ConversionTool = {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  status?: "Live" | "Beta";
};

export const conversionTools: ConversionTool[] = [
  {
    id: "markdown-to-pdf",
    title: "Markdown to PDF",
    description: "Write Markdown with live preview and download it as a PDF.",
    href: "/tools/markdown-to-pdf",
    icon: FileText,
    status: "Live",
  },
  {
    id: "markdown-to-html",
    title: "Markdown to HTML",
    description: "Convert Markdown into clean HTML instantly in your browser.",
    href: "/tools/markdown-to-html",
    icon: FileCode2,
    status: "Live",
  },
  {
    id: "html-formatter",
    title: "HTML Formatter / Minifier",
    description: "Format, minify, validate tags, and copy HTML output.",
    href: "/tools/html-formatter",
    icon: Code2,
    status: "Live",
  },
  {
    id: "css-formatter",
    title: "CSS Formatter / Minifier",
    description: "Format CSS, minify styles, remove comments.",
    href: "/tools/css-formatter",
    icon: Paintbrush,
    status: "Live",
  },
  {
    id: "js-formatter",
    title: "JavaScript Formatter / Minifier",
    description: "Beautify, format, minify, and copy JavaScript code.",
    href: "/tools/js-formatter",
    icon: AlignLeft,
    status: "Live",
  },
  {
    id: "yaml-json",
    title: "YAML ↔ JSON Converter",
    description: "Convert YAML to JSON or JSON to YAML with validation errors.",
    href: "/tools/yaml-json",
    icon: Braces,
    status: "Live",
  },
  {
    id: "csv-json",
    title: "CSV ↔ JSON Converter",
    description: "Convert CSV to JSON or JSON to CSV with upload/download.",
    href: "/tools/csv-json",
    icon: Table2,
    status: "Live",
  },
  {
    id: "excel-csv",
    title: "Excel to CSV / CSV to Excel",
    description: "Convert CSV and Excel files and download results.",
    href: "/tools/excel-csv",
    icon: ArrowLeftRight,
    status: "Live",
  },
  {
    id: "json-formatter",
    title: "JSON Formatter",
    description: "Format, validate, and minify JSON instantly in your browser.",
    href: "/tools/json-formatter",
    icon: FileJson,
    status: "Live",
  },
];