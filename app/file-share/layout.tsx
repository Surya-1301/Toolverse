import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "File Share - Upload and Share Files",
  description:
    "Upload files and create temporary shareable download links with ToolverseX File Share.",
};

export default function FileShareLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}