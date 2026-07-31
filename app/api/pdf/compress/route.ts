import fs from "fs/promises";
import os from "os";
import path from "path";
import { randomUUID } from "crypto";
import { execFile } from "child_process";
import { promisify } from "util";
import { NextResponse } from "next/server";

const execFileAsync = promisify(execFile);

function getPdfSettings(quality: number) {
  if (quality >= 0.85) return "/prepress";
  if (quality >= 0.65) return "/printer";
  if (quality >= 0.4) return "/ebook";
  return "/screen";
}

export async function POST(request: Request) {
  const tempId = randomUUID();
  const tempDir = path.join(os.tmpdir(), `ToolverseX-pdf-${tempId}`);
  const inputPath = path.join(tempDir, "input.pdf");
  const outputPath = path.join(tempDir, "output.pdf");

  try {
    const formData = await request.formData();

    const file = formData.get("file");
    const qualityValue = Number(formData.get("quality") || "0.7");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "PDF file is required." },
        { status: 400 }
      );
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Please upload a valid PDF file." },
        { status: 400 }
      );
    }

    const maxSize = 100 * 1024 * 1024;

    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "PDF is too large. Max size is 100 MB." },
        { status: 400 }
      );
    }

    await fs.mkdir(tempDir, { recursive: true });

    const arrayBuffer = await file.arrayBuffer();
    await fs.writeFile(inputPath, Buffer.from(arrayBuffer));

    const pdfSettings = getPdfSettings(qualityValue);

    await execFileAsync(
      "gs",
      [
        "-sDEVICE=pdfwrite",
        "-dCompatibilityLevel=1.4",
        `-dPDFSETTINGS=${pdfSettings}`,
        "-dNOPAUSE",
        "-dQUIET",
        "-dBATCH",
        "-dDetectDuplicateImages=true",
        "-dCompressFonts=true",
        "-dSubsetFonts=true",
        "-dColorImageDownsampleType=/Bicubic",
        "-dGrayImageDownsampleType=/Bicubic",
        "-dMonoImageDownsampleType=/Subsample",
        "-dColorImageResolution=150",
        "-dGrayImageResolution=150",
        "-dMonoImageResolution=300",
        `-sOutputFile=${outputPath}`,
        inputPath,
      ],
      {
        timeout: 120_000,
      }
    );

    const compressedBuffer = await fs.readFile(outputPath);

    return new Response(compressedBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="compressed.pdf"`,
        "Content-Length": String(compressedBuffer.length),
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          "Could not compress PDF. Make sure Ghostscript is installed locally.",
      },
      { status: 500 }
    );
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
  }
}