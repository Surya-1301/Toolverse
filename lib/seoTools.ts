/**
 * Central catalog of SEO metadata + FAQ schema for every Toolverse tool.
 * Each layout.tsx imports its entry — edit here to update titles,
 * descriptions, and FAQ content site-wide.
 */

export type ToolSeo = {
  slug: string;
  title: string;
  description: string;
  faq: { q: string; a: string }[];
};

export const toolSeo: Record<string, ToolSeo> = {
  "audio-converter": {
    slug: "audio-converter",
    title: "Audio Converter - Convert Between Audio Formats Online",
    description:
      "Convert MP3, WAV, OGG, M4A, and other audio formats online for free. Fast, browser-based audio conversion by Toolverse — no upload needed.",
    faq: [
      {
        q: "Is the audio converter free to use?",
        a: "Yes, Toolverse audio converter is completely free with no limits on conversions.",
      },
      {
        q: "Which audio formats are supported?",
        a: "You can convert between popular formats including MP3, WAV, OGG, and M4A directly in your browser.",
      },
      {
        q: "Are my audio files uploaded to a server?",
        a: "No. Conversion happens locally in your browser, so your files never leave your device.",
      },
    ],
  },
  "background-remover": {
    slug: "background-remover",
    title: "Remove Background from Image Online Free - Toolverse",
    description:
      "Remove image backgrounds automatically with AI. Free online background remover — no signup, works in your browser.",
    faq: [
      {
        q: "How do I remove a background from an image?",
        a: "Upload your image and the AI background remover processes it automatically in seconds, leaving a transparent background.",
      },
      {
        q: "Is background removal free?",
        a: "Yes, removing backgrounds is completely free and unlimited on Toolverse.",
      },
      {
        q: "What image formats are supported?",
        a: "You can upload JPG, PNG, and WEBP images and download the result as a transparent PNG.",
      },
    ],
  },
  "base64-encoder-decoder": {
    slug: "base64-encoder-decoder",
    title: "Base64 Encoder / Decoder - Encode & Decode Text Online",
    description:
      "Encode text or files to Base64 and decode Base64 back to text instantly. Free online Base64 encoder and decoder by Toolverse.",
    faq: [
      {
        q: "What is Base64 encoding?",
        a: "Base64 is an encoding scheme that represents binary data in an ASCII string format, commonly used to embed images and files in text-based protocols.",
      },
      {
        q: "Can I encode files as well as text?",
        a: "Yes, the Toolverse Base64 tool supports both pasted text and file upload, converting either to Base64 instantly.",
      },
      {
        q: "Is Base64 encoding secure?",
        a: "Base64 is an encoding, not encryption. It is not secure for protecting data, but it is useful for safe data transfer.",
      },
    ],
  },
  "case-converter": {
    slug: "case-converter",
    title: "Case Converter - Convert Text to UPPER, lower or Title Case",
    description:
      "Convert text to UPPERCASE, lowercase, Title Case, camelCase, snake_case, and more. Free online case converter by Toolverse.",
    faq: [
      {
        q: "Which text cases can I convert to?",
        a: "UPPERCASE, lowercase, Title Case, Sentence case, camelCase, PascalCase, snake_case, and kebab-case are all supported.",
      },
      {
        q: "Is the case converter free?",
        a: "Yes, it is completely free with no limits on the amount of text you convert.",
      },
      {
        q: "Does case conversion happen in my browser?",
        a: "Yes, all conversion is done locally on your device so your text is never uploaded.",
      },
    ],
  },
  "color-converter": {
    slug: "color-converter",
    title: "Color Converter - HEX to RGB & HSL Converter Online",
    description:
      "Convert colors between HEX, RGB, HSL, and other formats instantly. Free online color converter by Toolverse.",
    faq: [
      {
        q: "What color formats are supported?",
        a: "HEX, RGB, RGBA, HSL, and HSLA color formats are supported with instant conversion between each.",
      },
      {
        q: "Is the color converter free?",
        a: "Yes, the color converter is completely free with unlimited conversions.",
      },
      {
        q: "Can I preview the color?",
        a: "Yes, the tool shows a live color preview alongside the converted values.",
      },
    ],
  },
  "credit-card-generator": {
    slug: "credit-card-generator",
    title: "Credit Card Generator - Generate Test Card Numbers",
    description:
      "Generate valid test credit card numbers for development and testing. Free dummy card data generator by Toolverse — for testing only.",
    faq: [
      {
        q: "Are these real credit cards?",
        a: "No. Generated numbers are for testing and validation purposes only and cannot be used for payments.",
      },
      {
        q: "Why do generated numbers pass Luhn validation?",
        a: "The generator creates numbers that match the Luhn algorithm so developers can test payment forms realistically.",
      },
      {
        q: "Which card brands are supported?",
        a: "Visa, Mastercard, American Express, and Discover test numbers can be generated.",
      },
    ],
  },
  "css-formatter": {
    slug: "css-formatter",
    title: "CSS Formatter - Beautify & Minify CSS Online",
    description:
      "Format, beautify, and minify CSS code instantly. Free online CSS formatter and minifier by Toolverse.",
    faq: [
      {
        q: "What can the CSS formatter do?",
        a: "It beautifies messy CSS into readable indented code, and can also minify CSS to reduce file size.",
      },
      {
        q: "Is my CSS sent to a server?",
        a: "No, all formatting runs locally in your browser for complete privacy.",
      },
      {
        q: "Is the CSS tool free?",
        a: "Yes, the CSS formatter and minifier is free with unlimited use.",
      },
    ],
  },
  "csv-json-converter": {
    slug: "csv-json-converter",
    title: "CSV to JSON Converter - Convert CSV Files Online",
    description:
      "Convert CSV to JSON and JSON to CSV online instantly. Free converter with preview by Toolverse.",
    faq: [
      {
        q: "How do I convert CSV to JSON?",
        a: "Paste or upload your CSV, choose the delimiter, and the tool converts it to valid JSON with a live preview.",
      },
      {
        q: "Can I convert JSON back to CSV?",
        a: "Yes, the tool works both directions — JSON to CSV with customizable field selection.",
      },
      {
        q: "Is the CSV and JSON converter free?",
        a: "Yes, completely free with no limits or signup required.",
      },
    ],
  },
  "domain-lookup": {
    slug: "domain-lookup",
    title: "Domain Lookup - Check WHOIS & DNS Info Online",
    description:
      "Look up domain information including WHOIS, DNS records, and availability. Free domain lookup tool by Toolverse.",
    faq: [
      {
        q: "What domain information can I look up?",
        a: "The tool shows WHOIS registration data as well as DNS records including A, AAAA, MX, NS, and TXT records.",
      },
      {
        q: "Is domain lookup free?",
        a: "Yes, unlimited domain lookups are completely free.",
      },
      {
        q: "Do I need an account?",
        a: "No account is required — just enter a domain and get results instantly.",
      },
    ],
  },
  "duplicate-line-remover": {
    slug: "duplicate-line-remover",
    title: "Remove Duplicate Lines Online Free - Toolverse",
    description:
      "Remove duplicate lines from text instantly. Free online duplicate line remover — sort, dedupe, and clean your text.",
    faq: [
      {
        q: "How does the duplicate line remover work?",
        a: "Paste your text and the tool instantly removes repeated lines, optionally sorting the results.",
      },
      {
        q: "Is it free to use?",
        a: "Yes, the duplicate line remover is completely free with no text size limits.",
      },
      {
        q: "Is my text uploaded anywhere?",
        a: "No, everything runs locally in your browser so your data stays private.",
      },
    ],
  },
  "email-phone-iban-validator": {
    slug: "email-phone-iban-validator",
    title: "Email, Phone & IBAN Validator - Validate Online",
    description:
      "Validate email addresses, phone numbers, and IBANs in real time. Free online validator suite by Toolverse.",
    faq: [
      {
        q: "What can the validator check?",
        a: "It validates email address format, international phone numbers, and IBAN structure including checksum verification.",
      },
      {
        q: "Is the validator free?",
        a: "Yes, all validators are free with instant results as you type.",
      },
      {
        q: "Do validations use live checks?",
        a: "Format and checksum validation runs locally; email deliverability is not guaranteed by format checks alone.",
      },
    ],
  },
  "excel-csv-converter": {
    slug: "excel-csv-converter",
    title: "Excel to CSV Converter - Convert XLS/XLSX Online",
    description:
      "Convert Excel XLS/XLSX files to CSV online for free. Fast, privacy-first spreadsheet converter by Toolverse.",
    faq: [
      {
        q: "Can I convert XLSX to CSV?",
        a: "Yes, upload your Excel file and download the CSV output in seconds.",
      },
      {
        q: "Does it handle multiple sheets?",
        a: "Yes, you can choose which sheet to convert when your workbook has multiple sheets.",
      },
      {
        q: "Is Excel to CSV conversion free?",
        a: "Yes, the converter is completely free with no file size limits enforced.",
      },
    ],
  },
  "fake-address-generator": {
    slug: "fake-address-generator",
    title: "Fake Address Generator - Generate Random US Addresses",
    description:
      "Generate realistic fake US addresses, names, and ZIP codes for testing. Free random data generator by Toolverse.",
    faq: [
      {
        q: "What is a fake address generator used for?",
        a: "Developers and testers use it to populate forms and databases with realistic but fictional data.",
      },
      {
        q: "Are the addresses real?",
        a: "No, all generated addresses are fictional and any resemblance to real locations is coincidental.",
      },
      {
        q: "Is the generator free?",
        a: "Yes, you can generate unlimited random addresses for free.",
      },
    ],
  },
  "favicon-generator": {
    slug: "favicon-generator",
    title: "Favicon Generator - Create Favicons From Text or Image",
    description:
      "Generate favicons for your website from text, emoji, or images. Free online favicon generator by Toolverse.",
    faq: [
      {
        q: "What sizes are generated?",
        a: "All standard favicon sizes including 16x16, 32x32, 48x48, and 180x180 are generated automatically.",
      },
      {
        q: "Can I create a favicon from text?",
        a: "Yes, type a letter or emoji and the generator renders it into a favicon instantly.",
      },
      {
        q: "Is the favicon generator free?",
        a: "Yes, it is completely free with no watermark.",
      },
    ],
  },
  "file-share": {
    slug: "file-share",
    title: "Share Files Online Free - Secure File Sharing | Toolverse",
    description:
      "Share files online securely with expiring links. Free file sharing service with encryption by Toolverse — no signup needed.",
    faq: [
      {
        q: "How do I share a file?",
        a: "Upload your file, and Toolverse creates a secure link you can send to anyone. Files expire automatically.",
      },
      {
        q: "Is file sharing secure?",
        a: "Yes, files are encrypted and links can include passwords and expiry times for extra control.",
      },
      {
        q: "Is there a file size limit?",
        a: "Free uploads include a generous size limit, with larger options available for heavier files.",
      },
    ],
  },
  "hash-generator": {
    slug: "hash-generator",
    title: "Hash Generator - MD5, SHA-1, SHA-256 & More Online",
    description:
      "Generate MD5, SHA-1, SHA-256, SHA-512, and other hashes from text instantly. Free online hash generator by Toolverse.",
    faq: [
      {
        q: "Which hash algorithms are supported?",
        a: "MD5, SHA-1, SHA-256, SHA-384, SHA-512, and CRC32 are all supported.",
      },
      {
        q: "What are hashes used for?",
        a: "Hashes verify data integrity, store passwords securely, and create fingerprints of files and content.",
      },
      {
        q: "Is hash generation free?",
        a: "Yes, generate unlimited hashes for free with no limits.",
      },
    ],
  },
  "html-formatter": {
    slug: "html-formatter",
    title: "HTML Formatter - Beautify & Minify HTML Online",
    description:
      "Format, beautify, and minify HTML code instantly. Free online HTML formatter by Toolverse.",
    faq: [
      {
        q: "What can the HTML formatter do?",
        a: "It indents and beautifies messy HTML, and can also minify it to reduce page weight.",
      },
      {
        q: "Is my HTML uploaded to a server?",
        a: "No, all formatting happens locally in your browser.",
      },
      {
        q: "Is the HTML formatter free?",
        a: "Yes, completely free with unlimited formatting.",
      },
    ],
  },
  "http-request-tester": {
    slug: "http-request-tester",
    title: "HTTP Request Tester - Test REST APIs Online",
    description:
      "Send GET, POST, PUT, DELETE requests and test REST APIs online. Free HTTP request tester by Toolverse.",
    faq: [
      {
        q: "What HTTP methods are supported?",
        a: "GET, POST, PUT, PATCH, DELETE, HEAD, and OPTIONS are all supported.",
      },
      {
        q: "Can I send headers and JSON bodies?",
        a: "Yes, you can customize headers and send raw or JSON request bodies.",
      },
      {
        q: "Is the HTTP tester free?",
        a: "Yes, it is free to use with unlimited requests while testing locally.",
      },
    ],
  },
  "image-blur": {
    slug: "image-blur",
    title: "Blur Image Online Free - Photo Blur Tool | Toolverse",
    description:
      "Blur images online for free with adjustable intensity. Apply pixel and Gaussian blur effects to any photo instantly.",
    faq: [
      {
        q: "How do I blur an image?",
        a: "Upload your image, adjust the blur intensity with the slider, and download the result instantly.",
      },
      {
        q: "Which blur effects are available?",
        a: "The tool supports both Gaussian blur and pixelation effects with adjustable radius.",
      },
      {
        q: "Is the image blur tool free?",
        a: "Yes, it is completely free and all processing happens in your browser.",
      },
    ],
  },
  "image-compressor": {
    slug: "image-compressor",
    title: "Compress Images Online Free - Reduce Image Size | Toolverse",
    description:
      "Compress JPG, PNG, and WEBP images online without losing quality. Reduce image size for free in your browser with Toolverse.",
    faq: [
      {
        q: "How much can I compress my images?",
        a: "Most images compress by 50–80% depending on format and content, with adjustable quality controls.",
      },
      {
        q: "Will compression reduce image quality?",
        a: "You control the balance — use lower compression for near-lossless results or higher compression for smaller files.",
      },
      {
        q: "Is image compression free?",
        a: "Yes, compress unlimited images for free with no signup or watermark.",
      },
    ],
  },
  "image-converter": {
    slug: "image-converter",
    title: "Image Converter - Convert JPG, PNG, WEBP Online",
    description:
      "Convert images between JPG, PNG, WEBP, and other formats online for free. Fast image format converter by Toolverse.",
    faq: [
      {
        q: "Which image formats can I convert between?",
        a: "JPG, PNG, WEBP, GIF, and BMP conversions are all supported.",
      },
      {
        q: "Can I convert multiple images at once?",
        a: "Yes, batch conversion lets you process multiple images and download them together.",
      },
      {
        q: "Is the image converter free?",
        a: "Yes, completely free with unlimited conversions.",
      },
    ],
  },
  "image-host": {
    slug: "image-host",
    title: "Free Image Hosting - Upload & Host Images Online",
    description:
      "Upload and host images online for free with direct links and CDN delivery. Free image hosting service by Toolverse.",
    faq: [
      {
        q: "How do I host an image?",
        a: "Upload your image and get a permanent direct link hosted on our CDN that you can embed anywhere.",
      },
      {
        q: "Is image hosting free?",
        a: "Yes, hosting is free and images stay online as long as they're accessed regularly.",
      },
      {
        q: "Can I hotlink hosted images?",
        a: "Yes, you can use the direct image URL in forums, websites, and embeds.",
      },
    ],
  },
  "image-placeholder": {
    slug: "image-placeholder",
    title: "Placeholder Image Generator - Create Placeholders Online",
    description:
      "Generate custom placeholder images with any size, text, and color. Free online placeholder image generator by Toolverse.",
    faq: [
      {
        q: "How do I create a placeholder image?",
        a: "Pick a size, background and text color, add your text, and download an SVG or PNG placeholder instantly.",
      },
      {
        q: "What sizes can I generate?",
        a: "Any custom dimensions are supported, from tiny icons to full-width banners.",
      },
      {
        q: "Is the placeholder generator free?",
        a: "Yes, it is completely free with unlimited generation.",
      },
    ],
  },
  "image-resizer-cropper": {
    slug: "image-resizer-cropper",
    title: "Resize & Crop Images Online Free - Toolverse",
    description:
      "Resize and crop images online for free. Change dimensions, crop to any aspect ratio, and download instantly.",
    faq: [
      {
        q: "How do I resize an image?",
        a: "Upload your image, enter new dimensions or choose a preset, and download the resized version instantly.",
      },
      {
        q: "Can I crop to a specific aspect ratio?",
        a: "Yes, preset ratios like 1:1, 4:3, 16:9, or a free-form drag crop are all supported.",
      },
      {
        q: "Is the resizer free?",
        a: "Yes, resize and crop unlimited images for free in your browser.",
      },
    ],
  },
  "image-to-base64": {
    slug: "image-to-base64",
    title: "Image to Base64 Converter - Encode Images Online",
    description:
      "Convert images to Base64 strings online for free. Encode JPG, PNG, WEBP to Base64 instantly with Toolverse.",
    faq: [
      {
        q: "Why convert an image to Base64?",
        a: "Base64 images can be embedded directly into HTML, CSS, and JSON, avoiding extra file requests.",
      },
      {
        q: "Does the tool output a data URI?",
        a: "Yes, you can copy the full data URI with the correct MIME type prefix ready for embedding.",
      },
      {
        q: "Is image to Base64 conversion free?",
        a: "Yes, completely free with no file size limits for reasonable images.",
      },
    ],
  },
  "image-upscaler": {
    slug: "image-upscaler",
    title: "Upscale Image Online Free - AI Image Upscaler",
    description:
      "Upscale and enlarge images online for free with AI enhancement. Increase image resolution without blur using Toolverse.",
    faq: [
      {
        q: "How does image upscaling work?",
        a: "AI-based upscaling reconstructs detail when enlarging images, producing sharper results than simple resizing.",
      },
      {
        q: "How much can I enlarge an image?",
        a: "You can upscale by 2x, 4x, or custom factors depending on the original resolution.",
      },
      {
        q: "Is the upscaler free?",
        a: "Yes, upscaling is free for images within the supported size limits.",
      },
    ],
  },
  "image-watermark-tool": {
    slug: "image-watermark-tool",
    title: "Add Watermark to Image Online Free - Photo Watermark",
    description:
      "Add text and image watermarks to photos online for free. Protect your images with Toolverse watermark tool.",
    faq: [
      {
        q: "Can I add a text watermark?",
        a: "Yes, add custom text watermarks with adjustable size, opacity, rotation, and position.",
      },
      {
        q: "Can I watermark multiple images at once?",
        a: "Yes, batch watermarking lets you apply the same watermark to many images in one go.",
      },
      {
        q: "Is the watermark tool free?",
        a: "Yes, completely free with no watermark added by Toolverse itself.",
      },
    ],
  },
  "ip-lookup": {
    slug: "ip-lookup",
    title: "IP Lookup - Find IP Address Location Online",
    description:
      "Look up IP address location, ISP, and geolocation data online. Free IP lookup tool by Toolverse.",
    faq: [
      {
        q: "What information does IP lookup show?",
        a: "It shows the approximate location, ISP, organization, and connection type for the IP address.",
      },
      {
        q: "How accurate is the location data?",
        a: "IP geolocation is approximate (often city-level) and depends on the accuracy of regional databases.",
      },
      {
        q: "Is the IP lookup tool free?",
        a: "Yes, unlimited IP lookups are completely free.",
      },
    ],
  },
  "javascript-formatter": {
    slug: "javascript-formatter",
    title: "JavaScript Formatter - Beautify & Minify JS Online",
    description:
      "Format, beautify, and minify JavaScript code instantly. Free online JavaScript formatter by Toolverse.",
    faq: [
      {
        q: "What can the JavaScript formatter do?",
        a: "It beautifies minified or messy code into readable indented JavaScript and can also minify it back.",
      },
      {
        q: "Is my code uploaded to a server?",
        a: "No, all formatting runs locally in your browser.",
      },
      {
        q: "Is the JavaScript formatter free?",
        a: "Yes, completely free with unlimited formatting.",
      },
    ],
  },
  "json-formatter": {
    slug: "json-formatter",
    title: "JSON Formatter - Format, Validate & Minify JSON Online",
    description:
      "Format, validate, and minify JSON instantly in your browser. Free online JSON formatter with tree view by Toolverse.",
    faq: [
      {
        q: "What can the JSON formatter do?",
        a: "It beautifies JSON with proper indentation, validates syntax, minifies, and even sorts keys.",
      },
      {
        q: "Can it fix invalid JSON?",
        a: "It highlights syntax errors with line numbers so you can locate and fix problems quickly.",
      },
      {
        q: "Is JSON formatting free?",
        a: "Yes, completely free with no limits and full browser-side privacy.",
      },
    ],
  },
  "json-xml-converter": {
    slug: "json-xml-converter",
    title: "JSON to XML Converter - Convert Between JSON & XML",
    description:
      "Convert JSON to XML and XML to JSON online instantly. Free converter with formatting options by Toolverse.",
    faq: [
      {
        q: "Can I convert JSON to XML?",
        a: "Yes, paste JSON and get valid XML output with configurable root element naming.",
      },
      {
        q: "Does it convert XML back to JSON?",
        a: "Yes, the converter handles both directions.",
      },
      {
        q: "Is the JSON XML converter free?",
        a: "Yes, completely free with unlimited conversions.",
      },
    ],
  },
  "jwt-decoder": {
    slug: "jwt-decoder",
    title: "JWT Decoder - Decode JSON Web Tokens Online",
    description:
      "Decode JWT tokens and inspect header, payload, and signature online. Free JWT debugger by Toolverse.",
    faq: [
      {
        q: "What information does JWT decoding show?",
        a: "It decodes the header and payload sections and shows the raw JSON content plus expiry and issuer claims.",
      },
      {
        q: "Can I verify the token signature?",
        a: "HS256 signature verification is supported when a secret is provided; RS256 shows the key ID for reference.",
      },
      {
        q: "Is JWT decoding free?",
        a: "Yes, completely free and done locally in your browser.",
      },
    ],
  },
  "lorem-ipsum-generator": {
    slug: "lorem-ipsum-generator",
    title: "Lorem Ipsum Generator - Generate Dummy Text Online",
    description:
      "Generate lorem ipsum placeholder text for design and development. Free dummy text generator by Toolverse.",
    faq: [
      {
        q: "What can the lorem ipsum generator produce?",
        a: "Generate by words, sentences, or paragraphs, with optional starting text and custom format.",
      },
      {
        q: "Can I copy the generated text?",
        a: "Yes, one-click copy puts the text on your clipboard, ready to paste anywhere.",
      },
      {
        q: "Is the lorem ipsum generator free?",
        a: "Yes, generate unlimited placeholder text for free.",
      },
    ],
  },
  "markdown-to-html": {
    slug: "markdown-to-html",
    title: "Markdown to HTML Converter - Convert MD Online",
    description:
      "Convert Markdown to clean HTML online instantly with live preview. Free Markdown to HTML converter by Toolverse.",
    faq: [
      {
        q: "Does the converter support GitHub flavored Markdown?",
        a: "Yes, tables, task lists, code blocks, and other GFM features render correctly.",
      },
      {
        q: "Can I copy the generated HTML?",
        a: "Yes, the HTML output can be copied with a single click, ready for publishing.",
      },
      {
        q: "Is Markdown to HTML conversion free?",
        a: "Yes, completely free with live preview as you type.",
      },
    ],
  },
  "markdown-to-pdf": {
    slug: "markdown-to-pdf",
    title: "Markdown to PDF - Convert MD Files to PDF Online",
    description:
      "Convert Markdown files to polished PDF documents online for free. Fast MD to PDF converter by Toolverse.",
    faq: [
      {
        q: "How do I convert Markdown to PDF?",
        a: "Paste your Markdown or upload an .md file, preview the styled result, and download the PDF.",
      },
      {
        q: "Will code blocks and tables render in the PDF?",
        a: "Yes, syntax-highlighted code blocks and tables are styled in the generated PDF.",
      },
      {
        q: "Is Markdown to PDF free?",
        a: "Yes, the converter is completely free to use.",
      },
    ],
  },
  "og-image-generator": {
    slug: "og-image-generator",
    title: "OG Image Generator - Create Social Share Images",
    description:
      "Create Open Graph images for social sharing with custom text, gradients, and logos. Free OG image generator by Toolverse.",
    faq: [
      {
        q: "What are OG images used for?",
        a: "Open Graph images appear when links are shared on social media such as Twitter, LinkedIn, and Facebook.",
      },
      {
        q: "What size should an OG image be?",
        a: "The recommended size is 1200x630 pixels, which this generator creates by default.",
      },
      {
        q: "Is the OG image generator free?",
        a: "Yes, generate unlimited share images for free.",
      },
    ],
  },
  "password-generator": {
    slug: "password-generator",
    title: "Password Generator - Create Strong Random Passwords",
    description:
      "Generate strong, secure passwords online for free. Customize length and character sets with Toolverse password generator.",
    faq: [
      {
        q: "How are the passwords generated?",
        a: "Secure cryptographic randomness is used to ensure strong, non-guessable passwords.",
      },
      {
        q: "What character types are available?",
        a: "Uppercase, lowercase, numbers, and symbols can each be toggled on or off.",
      },
      {
        q: "Is the password generator free and secure?",
        a: "Yes, free, and generation happens entirely in your browser — no passwords are sent to any server.",
      },
    ],
  },
  "password-strength-checker": {
    slug: "password-strength-checker",
    title: "Password Strength Checker - Test Password Security",
    description:
      "Check password strength and get tips to improve security. Free online password strength tester by Toolverse.",
    faq: [
      {
        q: "How is password strength calculated?",
        a: "Length, character variety, and common-pattern detection combine into a strength score with suggestions.",
      },
      {
        q: "Is my password sent anywhere?",
        a: "No, the check runs entirely in your browser and your password never leaves your device.",
      },
      {
        q: "Is the strength checker free?",
        a: "Yes, completely free with unlimited checks.",
      },
    ],
  },
  paste: {
    slug: "paste",
    title: "Paste - Share Text & Code Online Free",
    description:
      "Create text pastes and share code online with syntax highlighting and expiry times. Free paste service by Toolverse.",
    faq: [
      {
        q: "How do I share a paste?",
        a: "Paste your text or code, optionally set an expiry, and share the generated link. Language syntax is auto-detected.",
      },
      {
        q: "Can I protect a paste with a password?",
        a: "Yes, password-protected pastes keep your content private until the recipient enters the key.",
      },
      {
        q: "Is the paste service free?",
        a: "Yes, creating pastes is completely free.",
      },
    ],
  },
  "pdf-editor": {
    slug: "pdf-editor",
    title: "PDF Editor - Edit PDFs Online Free",
    description:
      "Edit PDF files online for free — annotate, highlight, fill forms, and more. Free online PDF editor by Toolverse.",
    faq: [
      {
        q: "What editing features are available?",
        a: "Text annotations, highlights, shapes, and form filling are supported directly in the browser.",
      },
      {
        q: "Can I add pages or images to a PDF?",
        a: "Yes, you can insert pages and overlay images onto existing PDFs.",
      },
      {
        q: "Is PDF editing free?",
        a: "Yes, the core PDF editor is completely free to use.",
      },
    ],
  },
  "pdf-to-markdown": {
    slug: "pdf-to-markdown",
    title: "PDF to Markdown Converter - Convert PDF Online",
    description:
      "Convert PDF files to Markdown online for free. Extract clean markdown from PDFs with Toolverse.",
    faq: [
      {
        q: "How does PDF to Markdown conversion work?",
        a: "The PDF is parsed and converted into structured Markdown with headings, lists, and code blocks preserved.",
      },
      {
        q: "Are PDF images and tables converted?",
        a: "Images are extracted and referenced, and tables are converted to Markdown table syntax where possible.",
      },
      {
        q: "Is the converter free?",
        a: "Yes, PDF to Markdown conversion is completely free.",
      },
    ],
  },
  "qr-generator": {
    slug: "qr-generator",
    title: "QR Code Generator - Create Custom QR Codes Online",
    description:
      "Create free QR codes for URLs, text, Wi-Fi, and more. Download as high-resolution PNG or SVG with Toolverse.",
    faq: [
      {
        q: "What can I encode in a QR code?",
        a: "URLs, plain text, email addresses, phone numbers, Wi-Fi credentials, and more.",
      },
      {
        q: "Can I customize the QR code colors?",
        a: "Yes, choose custom foreground and background colors plus error correction levels.",
      },
      {
        q: "Is the QR generator free?",
        a: "Yes, generate unlimited QR codes for free and download them in PNG or SVG.",
      },
    ],
  },
  "random-string-generator": {
    slug: "random-string-generator",
    title: "Random String Generator - Generate Secure Strings",
    description:
      "Generate random strings, tokens, and IDs online for free. Customize length and character types with Toolverse.",
    faq: [
      {
        q: "What is a random string generator used for?",
        a: "Creating tokens, IDs, salts, and test data with strong randomness.",
      },
      {
        q: "Can I choose which characters to include?",
        a: "Yes, toggle numbers, letters, symbols, and choose case sensitivity.",
      },
      {
        q: "Is the generator free?",
        a: "Yes, generate unlimited random strings for free.",
      },
    ],
  },
  "regex-tester": {
    slug: "regex-tester",
    title: "Regex Tester - Test Regular Expressions Online",
    description:
      "Test and debug regular expressions online with real-time matching. Free regex tester with cheatsheet by Toolverse.",
    faq: [
      {
        q: "How does the regex tester work?",
        a: "Type a pattern and test string; matches highlight live with capture groups listed below.",
      },
      {
        q: "Does it support flags and lookaheads?",
        a: "Yes, common flags (g, i, m, s) and JavaScript regex features like lookaheads are supported.",
      },
      {
        q: "Is the regex tester free?",
        a: "Yes, it is completely free with unlimited testing.",
      },
    ],
  },
  "share-file": {
    slug: "share-file",
    title: "Share File - Quick File Share Online",
    description:
      "Share files quickly with a secure link. Free quick file sharing by Toolverse — drag, drop, and share.",
    faq: [
      {
        q: "How is this different from the file share tool?",
        a: "This is a streamlined quick-share flow focused on speed — upload, copy link, and share in seconds.",
      },
      {
        q: "Is file sharing free?",
        a: "Yes, sharing files is completely free with automatic expiry.",
      },
      {
        q: "Are my files secure?",
        a: "Yes, files are encrypted at rest and links can expire automatically.",
      },
    ],
  },
  "sql-formatter": {
    slug: "sql-formatter",
    title: "SQL Formatter - Beautify & Minify SQL Online",
    description:
      "Format and beautify SQL queries online instantly. Free SQL formatter for multiple dialects by Toolverse.",
    faq: [
      {
        q: "Which SQL dialects are supported?",
        a: "MySQL, PostgreSQL, SQL Server, SQLite, and standard ANSI SQL are supported.",
      },
      {
        q: "Can I customize indentation?",
        a: "Yes, choose tab or space indentation and control keyword casing.",
      },
      {
        q: "Is the SQL formatter free?",
        a: "Yes, completely free with unlimited formatting.",
      },
    ],
  },
  "text-compare": {
    slug: "text-compare",
    title: "Compare Text Online Free - Diff Two Texts",
    description:
      "Compare two texts or files and see differences instantly. Free online text comparison tool by Toolverse.",
    faq: [
      {
        q: "How does text comparison work?",
        a: "Paste two versions and the tool highlights added, removed, and changed lines instantly.",
      },
      {
        q: "Can I compare code files?",
        a: "Yes, it works for code, configs, or any plain text content.",
      },
      {
        q: "Is text comparison free?",
        a: "Yes, completely free with unlimited comparisons.",
      },
    ],
  },
  "text-counter": {
    slug: "text-counter",
    title: "Character & Word Counter - Count Characters Online",
    description:
      "Count characters, words, sentences, and reading time online for free. Instant text counter by Toolverse.",
    faq: [
      {
        q: "What metrics does the counter show?",
        a: "Characters (with and without spaces), words, sentences, paragraphs, and estimated reading time.",
      },
      {
        q: "Does it count in real time?",
        a: "Yes, every metric updates live as you type or paste text.",
      },
      {
        q: "Is the text counter free?",
        a: "Yes, completely free with no limits on text length.",
      },
    ],
  },
  "text-to-speech": {
    slug: "text-to-speech",
    title: "Text to Speech - Convert Text to Audio Online",
    description:
      "Convert text to speech online for free with natural voices. Listen or download audio with Toolverse TTS.",
    faq: [
      {
        q: "How do I convert text to speech?",
        a: "Type or paste text, choose a voice, and either play it back or download the audio.",
      },
      {
        q: "Which languages are supported?",
        a: "Voices in many languages are available using your browser's built-in speech synthesis.",
      },
      {
        q: "Is text to speech free?",
        a: "Yes, text to speech is completely free with no character limits.",
      },
    ],
  },
  "timestamp-converter": {
    slug: "timestamp-converter",
    title: "Unix Timestamp Converter - Epoch to Date Online",
    description:
      "Convert Unix timestamps to readable dates and back online instantly. Free epoch converter by Toolverse.",
    faq: [
      {
        q: "What is a Unix timestamp?",
        a: "It's the number of seconds elapsed since January 1, 1970 UTC, commonly used in APIs and databases.",
      },
      {
        q: "Can I convert dates back to timestamps?",
        a: "Yes, the tool converts in both directions with timezone support.",
      },
      {
        q: "Is the timestamp converter free?",
        a: "Yes, completely free with instant conversion.",
      },
    ],
  },
  "typescript-formatter": {
    slug: "typescript-formatter",
    title: "TypeScript Formatter - Beautify TS Code Online",
    description:
      "Format and beautify TypeScript code online instantly. Free TypeScript formatter by Toolverse.",
    faq: [
      {
        q: "What can the TypeScript formatter do?",
        a: "It beautifies messy TypeScript, decorates type annotations, and normalizes indentation.",
      },
      {
        q: "Is my code uploaded to a server?",
        a: "No, all formatting runs locally in your browser.",
      },
      {
        q: "Is the TypeScript formatter free?",
        a: "Yes, completely free with unlimited formatting.",
      },
    ],
  },
  "url-shortener": {
    slug: "url-shortener",
    title: "URL Shortener - Shorten Links Online Free",
    description:
      "Shorten long URLs into fast, shareable links with click tracking. Free URL shortener by Toolverse.",
    faq: [
      {
        q: "How do I shorten a URL?",
        a: "Paste your long URL and get a short branded link you can share anywhere, with optional custom alias.",
      },
      {
        q: "Can I track link clicks?",
        a: "Yes, a built-in dashboard shows click counts for your shortened links.",
      },
      {
        q: "Is URL shortening free?",
        a: "Yes, shrinking links is completely free.",
      },
    ],
  },
  "url-tools": {
    slug: "url-tools",
    title: "URL Tools - Parse, Encode & Analyze URLs Online",
    description:
      "Parse, encode, decode, and analyze URL components online for free. Complete URL toolkit by Toolverse.",
    faq: [
      {
        q: "What URL tools are included?",
        a: "URL parsing, percent-encoding/decoding, query parameter extraction, and URL analysis are all included.",
      },
      {
        q: "Can I inspect query parameters?",
        a: "Yes, query strings are split into key-value pairs for easy inspection.",
      },
      {
        q: "Is the URL toolkit free?",
        a: "Yes, all URL tools are completely free.",
      },
    ],
  },
  "uuid-generator": {
    slug: "uuid-generator",
    title: "UUID Generator - Generate UUID v4 & v7 Online",
    description:
      "Generate UUIDs (GUIDs) v4 and v7 instantly in bulk. Free UUID generator by Toolverse for developers.",
    faq: [
      {
        q: "Which UUID versions are supported?",
        a: "UUID v4 (random) and v7 (time-ordered, sortable) are generated, plus v1 support.",
      },
      {
        q: "Can I generate multiple UUIDs at once?",
        a: "Yes, generate up to hundreds of UUIDs in one click with easy copy.",
      },
      {
        q: "Is the UUID generator free?",
        a: "Yes, completely free with no limits.",
      },
    ],
  },
  "yaml-json-converter": {
    slug: "yaml-json-converter",
    title: "YAML to JSON Converter - Convert YAML Online",
    description:
      "Convert YAML to JSON and JSON to YAML online instantly. Free converter with validation by Toolverse.",
    faq: [
      {
        q: "Can I convert YAML to JSON?",
        a: "Yes, paste YAML and get valid JSON output with proper indentation.",
      },
      {
        q: "Does it convert JSON back to YAML?",
        a: "Yes, the converter supports both directions.",
      },
      {
        q: "Is the YAML JSON converter free?",
        a: "Yes, completely free with unlimited conversions.",
      },
    ],
  },
};