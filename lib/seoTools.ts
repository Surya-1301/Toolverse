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
      {
        q: "Can I convert multiple audio files at once?",
        a: "Yes, queue up several audio files and convert them one after another without reloading the page.",
      },
      {
        q: "Does converting audio reduce its quality?",
        a: "Quality depends on the target format and bitrate. Converting between lossless formats keeps full quality, while MP3 and OGG apply compression to shrink file size.",
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
      {
        q: "Do I need to sign up to remove backgrounds?",
        a: "No signup or account is needed — open the tool, upload an image, and download the result.",
      },
      {
        q: "Does the background remover work on mobile?",
        a: "Yes, it works in any modern mobile or desktop browser with no app install required.",
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
      {
        q: "Is there a size limit for Base64 conversion?",
        a: "No hard limit — text of any practical length converts instantly, and files are processed locally in your browser.",
      },
      {
        q: "Does Base64 encoding work offline?",
        a: "Yes, once the page loads, all encoding and decoding runs locally so it works without an internet connection.",
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
      {
        q: "Is there a character limit for case conversion?",
        a: "No, paste anything from a single word to a full document and convert it instantly.",
      },
      {
        q: "Can I convert code variable names with this tool?",
        a: "Yes, camelCase, PascalCase, snake_case, and kebab-case outputs are handy for renaming variables and identifiers.",
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
      {
        q: "Can I copy the converted color values?",
        a: "Yes, every converted HEX, RGB, and HSL value has a one-click copy button.",
      },
      {
        q: "Does the color converter work on mobile?",
        a: "Yes, it is fully responsive and works in any modern mobile or desktop browser.",
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
      {
        q: "Can I use generated cards for real purchases?",
        a: "No. They are dummy numbers for testing checkout forms and validation logic only.",
      },
      {
        q: "Is the credit card generator free?",
        a: "Yes, generating test card numbers is completely free with no signup.",
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
        q: "Can I minify CSS as well as format it?",
        a: "Yes, switch between beautify mode for readable code and minify mode for smaller production files.",
      },
      {
        q: "Does the CSS formatter work offline?",
        a: "Yes, once the page loads, all formatting runs locally with no internet connection needed.",
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
      {
        q: "Does it handle headers and custom delimiters?",
        a: "Yes, the first row is treated as headers and you can switch between comma, semicolon, tab, and pipe delimiters.",
      },
      {
        q: "Is my data uploaded anywhere?",
        a: "No, all conversion runs locally in your browser so your data stays private.",
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
      {
        q: "Why is some WHOIS data hidden or redacted?",
        a: "Registrars mask personal contact details to comply with privacy regulations like GDPR.",
      },
      {
        q: "Can I check if a domain is available to register?",
        a: "Yes, if no registration records are found the domain is likely available for purchase.",
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
      {
        q: "Is duplicate removal case-sensitive?",
        a: "By default lines must match exactly, with options to ignore case or extra whitespace.",
      },
      {
        q: "Can I sort lines while removing duplicates?",
        a: "Yes, enable sorting to alphabetize the cleaned list in one step.",
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
      {
        q: "Which countries are supported for phone and IBAN checks?",
        a: "Phone validation covers international formats with country detection, and IBAN checks support all official IBAN-registry countries.",
      },
      {
        q: "Is my input uploaded anywhere?",
        a: "No, all validation runs locally in your browser so your data never leaves your device.",
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
      {
        q: "Which Excel formats are supported?",
        a: "Both modern XLSX and legacy XLS workbooks are supported, including multi-sheet files.",
      },
      {
        q: "Are my spreadsheets uploaded to a server?",
        a: "No, files are parsed locally in your browser so your data never leaves your device.",
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
      {
        q: "Which countries are supported?",
        a: "Addresses can be generated for the US, UK, Canada, Australia, India, and many more countries.",
      },
      {
        q: "Can I generate addresses in bulk?",
        a: "Yes, generate multiple addresses at once and copy or export the whole list.",
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
      {
        q: "Which file formats can I upload?",
        a: "PNG, JPG, SVG, and WEBP images all work as favicon sources.",
      },
      {
        q: "Will the favicon work in all browsers?",
        a: "Yes, the bundle includes ICO plus PNG sizes so it displays in every modern browser.",
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
      {
        q: "How long do file links last?",
        a: "You choose the expiry when uploading, from one hour up to never expiring.",
      },
      {
        q: "Do I need an account to share files?",
        a: "No account or signup is needed — upload a file and share the link instantly.",
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
      {
        q: "Are hashes reversible?",
        a: "No, hashes are one-way — the original text cannot be recovered from a hash value.",
      },
      {
        q: "Can I compare two hashes?",
        a: "Yes, generate a hash and compare it against a known value to verify data integrity.",
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
      {
        q: "Can I minify HTML as well as format it?",
        a: "Yes, switch between beautify mode for readable code and minify mode for smaller production files.",
      },
      {
        q: "Does the HTML formatter work offline?",
        a: "Yes, once the page loads, all formatting runs locally with no internet connection needed.",
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
      {
        q: "Can I add authentication headers?",
        a: "Yes, add any custom headers including Authorization bearer tokens and API keys.",
      },
      {
        q: "Is my request data stored anywhere?",
        a: "No, requests go straight from your browser to the target URL and nothing is logged.",
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
      {
        q: "Can I blur only part of an image?",
        a: "Yes, brush over specific areas to blur faces, plates, or text while keeping the rest sharp.",
      },
      {
        q: "Are my images uploaded to a server?",
        a: "No, blurring happens locally in your browser so your photos never leave your device.",
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
      {
        q: "Which image formats are supported?",
        a: "JPG, PNG, WEBP, and AVIF images can all be compressed right in your browser.",
      },
      {
        q: "Are my images uploaded anywhere?",
        a: "No, compression runs locally on your device so your photos stay private.",
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
      {
        q: "Will converting change my image quality?",
        a: "Converting between lossless formats keeps full quality, while JPG and WEBP targets let you balance quality and size.",
      },
      {
        q: "Are my images uploaded to a server?",
        a: "No, all conversion happens locally in your browser so your images never leave your device.",
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
      {
        q: "How long are hosted images kept?",
        a: "You pick the expiry when uploading, from one hour to indefinitely.",
      },
      {
        q: "Is there a file size limit for uploads?",
        a: "Yes, a generous per-file size limit applies so images load fast everywhere they are embedded.",
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
      {
        q: "Can I customize colors and text?",
        a: "Yes, set any width, height, background and text colors, plus custom label text.",
      },
      {
        q: "How do I embed a placeholder in my HTML?",
        a: "Copy the generated image URL straight into an img tag or use it as a CSS background.",
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
      {
        q: "Will resizing reduce my image quality?",
        a: "Downsizing keeps sharp results, while enlarging beyond the original size can soften details.",
      },
      {
        q: "Are my images uploaded anywhere?",
        a: "No, resizing and cropping run locally in your browser so your photos stay private.",
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
      {
        q: "Is there a file size limit?",
        a: "No hard limit, but very large images produce very long strings — compress first for embedding.",
      },
      {
        q: "Does conversion happen locally?",
        a: "Yes, your image is encoded in the browser and never uploaded to any server.",
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
      {
        q: "Which image formats can I upscale?",
        a: "JPG, PNG, and WEBP images are supported, up to the maximum input resolution.",
      },
      {
        q: "Are my images uploaded to a server?",
        a: "Processing runs through the Toolverse image API over HTTPS, and temporary copies are deleted afterward.",
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
      {
        q: "Can I use my own logo as a watermark?",
        a: "Yes, upload any PNG logo and place it with adjustable opacity, size, and position.",
      },
      {
        q: "Are my images uploaded anywhere?",
        a: "No, watermarking runs locally in your browser so your photos never leave your device.",
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
      {
        q: "Can I look up any IP address?",
        a: "Yes, enter any public IPv4 or IPv6 address to see its location, ISP, and network details.",
      },
      {
        q: "Is my own IP stored when I use this tool?",
        a: "No, lookups are stateless and neither your IP nor your queries are stored.",
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
      {
        q: "Can I minify JavaScript as well as format it?",
        a: "Yes, switch between beautify mode for readable code and minify mode for smaller production files.",
      },
      {
        q: "Does the JavaScript formatter work offline?",
        a: "Yes, once the page loads, all formatting runs locally with no internet connection needed.",
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
      {
        q: "Can I minify JSON as well as format it?",
        a: "Yes, use minify mode to strip whitespace for compact payloads, or format mode for readable output.",
      },
      {
        q: "Is my JSON uploaded anywhere?",
        a: "No, all parsing and formatting runs locally in your browser so your data stays private.",
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
      {
        q: "Can I customize the XML root element?",
        a: "Yes, set a custom root tag name and control how arrays and attributes are converted.",
      },
      {
        q: "Is my data uploaded anywhere?",
        a: "No, all conversion runs locally in your browser so your data stays private.",
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
      {
        q: "Is my token sent to a server?",
        a: "No, decoding happens entirely in your browser so your tokens stay private.",
      },
      {
        q: "What happens if a token is expired?",
        a: "The tool still decodes the payload and flags the expiry claim so you can inspect it.",
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
      {
        q: "Can I generate paragraphs, sentences, or words?",
        a: "Yes, choose the unit type and how many you need for your mockup.",
      },
      {
        q: "Does the generator work offline?",
        a: "Yes, once the page loads, text generation runs locally with no internet needed.",
      },
    ],
  },
  "instagram-reels-downloader": {
    slug: "instagram-reels-downloader",
    title: "Instagram Reels Downloader - Download Reels in HD",
    description:
      "Download Instagram reels, posts and carousels in HD online for free. Paste the link and save the video with Toolverse — no signup.",
    faq: [
      {
        q: "How do I download an Instagram reel?",
        a: "Copy the reel link from Instagram, paste it into the tool, and hit Get download link to save the video in HD.",
      },
      {
        q: "Does it work with carousels?",
        a: "Yes, carousel posts show one download button per item.",
      },
      {
        q: "Is the Instagram reels downloader free?",
        a: "Yes, downloading reels is completely free with no signup.",
      },
    ],
  },
  "music-downloader": {
    slug: "music-downloader",
    title: "Music Downloader - Extract Audio as MP3 Online",
    description:
      "Extract audio from videos as MP3, OGG, WAV or OPUS online for free. Paste a link and download the track with Toolverse — no signup.",
    faq: [
      {
        q: "How do I download music as MP3?",
        a: "Paste the video or track link, pick a format and bitrate, then hit Extract audio to get your download link.",
      },
      {
        q: "Which sites are supported?",
        a: "YouTube, SoundCloud, TikTok and many other platforms are supported.",
      },
      {
        q: "What audio quality can I choose?",
        a: "Bitrates from 96 kbps up to 320 kbps in MP3, OGG, OPUS or WAV formats.",
      },
    ],
  },
  "youtube-downloader": {
    slug: "youtube-downloader",
    title: "YouTube Video Downloader - Download MP4 & MP3 Online",
    description:
      "Download YouTube videos as MP4 in 360p to 1080p or extract audio as MP3 online for free. No signup, works with Toolverse.",
    faq: [
      {
        q: "How do I download a YouTube video?",
        a: "Paste the YouTube link, choose a quality, and hit Get download link to save the MP4.",
      },
      {
        q: "Can I download just the audio?",
        a: "Yes, tick Audio only to extract the soundtrack as an MP3 file.",
      },
      {
        q: "Is the YouTube downloader free?",
        a: "Yes, it is completely free with no signup. Only download videos you own or have permission to keep.",
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
      {
        q: "Is my Markdown uploaded anywhere?",
        a: "No, conversion runs locally in your browser so your documents stay private.",
      },
      {
        q: "Can I preview the rendered output?",
        a: "Yes, a live preview shows the formatted result side by side as you type.",
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
      {
        q: "Can I customize the PDF styling?",
        a: "Yes, adjust page size, margins, and theme before exporting your document.",
      },
      {
        q: "Are my documents uploaded anywhere?",
        a: "No, PDF generation happens locally in your browser so your content stays private.",
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
      {
        q: "Which templates are available?",
        a: "Pick from blog, product, announcement, and minimal templates, each fully customizable.",
      },
      {
        q: "Can I use my own fonts and images?",
        a: "Yes, upload background images and brand assets to match your site design.",
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
      {
        q: "What password length should I use?",
        a: "Use at least 16 characters with mixed character types for strong, secure passwords.",
      },
      {
        q: "Are generated passwords stored anywhere?",
        a: "No, passwords are created locally in your browser and never sent or stored.",
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
      {
        q: "What makes a password strong?",
        a: "Length plus a mix of upper and lowercase letters, numbers, and symbols — ideally over 60 bits of entropy.",
      },
      {
        q: "Can I test multiple passwords?",
        a: "Yes, type or paste a new password any time to get an instant fresh analysis.",
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
      {
        q: "How long do pastes last?",
        a: "You choose the expiry when creating a paste, from one hour up to never expiring.",
      },
      {
        q: "Can I edit a paste after creating it?",
        a: "Yes, reopen your paste from recent history and save an updated version.",
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
      {
        q: "Are my PDFs uploaded to a server?",
        a: "No, all editing happens locally in your browser so your documents stay private.",
      },
      {
        q: "Do I need to sign up to edit PDFs?",
        a: "No account is needed — open the editor and start working on your PDF instantly.",
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
      {
        q: "Are my PDFs uploaded to a server?",
        a: "Files are processed securely over HTTPS and temporary copies are deleted afterward.",
      },
      {
        q: "How long does conversion take?",
        a: "Most documents convert in seconds, with larger files taking a little longer.",
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
      {
        q: "Can I download the QR code as PNG or SVG?",
        a: "Yes, export your QR code in either format with a single click.",
      },
      {
        q: "Do QR codes expire?",
        a: "No, codes encoding text or URLs work forever since the data lives inside the code itself.",
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
      {
        q: "How long can the generated strings be?",
        a: "Generate strings from a single character up to thousands of characters long.",
      },
      {
        q: "Are generated strings truly random?",
        a: "Yes, they use the browser cryptographic random generator, suitable for tokens and secrets.",
      },
    ],
  },
  "meta-tag-generator": {
    slug: "meta-tag-generator",
    title: "Meta Tag Generator - SEO, Open Graph & Twitter Cards",
    description:
      "Generate SEO meta tags, Open Graph and Twitter card tags online for free. Preview Google and social snippets, then copy the HTML head snippet with Toolverse.",
    faq: [
      {
        q: "What does the meta tag generator create?",
        a: "A ready-to-paste HTML head snippet with title, description, keywords, canonical, robots, theme-color, Open Graph and Twitter card tags.",
      },
      {
        q: "Can I preview how my page looks on Google?",
        a: "Yes, the tool shows a live Google search result preview and a social share card preview as you type.",
      },
      {
        q: "Is the meta tag generator free?",
        a: "Yes, generating meta tags is completely free and everything runs in your browser.",
      },
      {
        q: "Which platforms are covered?",
        a: "Google search results, Open Graph for Facebook and LinkedIn, and Twitter cards are all included.",
      },
      {
        q: "Where do I paste the generated tags?",
        a: "Copy the snippet into the head section of your HTML page, before the closing head tag.",
      },
    ],
  },
  "robots-txt-generator": {
    slug: "robots-txt-generator",
    title: "robots.txt Generator - Create Crawl Rules Online",
    description:
      "Generate a robots.txt file online for free. Build per-bot allow/disallow rules, crawl delays and sitemap entries, then download robots.txt with Toolverse.",
    faq: [
      {
        q: "What is a robots.txt file?",
        a: "A text file at your domain root that tells search engine crawlers which pages they may or may not visit.",
      },
      {
        q: "Where do I put the generated robots.txt?",
        a: "Upload it to your domain root so it is served at https://yourdomain.com/robots.txt.",
      },
      {
        q: "Do all bots obey robots.txt?",
        a: "Well-behaved crawlers like Googlebot obey it. It is advisory — malicious scrapers may ignore it.",
      },
      {
        q: "Can I block specific pages from crawlers?",
        a: "Yes, add disallow rules for any path, from single pages to whole directories.",
      },
      {
        q: "Is the robots.txt generator free?",
        a: "Yes, building and downloading robots.txt files is completely free.",
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
      {
        q: "Which regex flavor is used?",
        a: "Patterns run on the JavaScript regex engine, matching behavior in browsers and Node.js.",
      },
      {
        q: "Is my test data uploaded anywhere?",
        a: "No, all matching runs locally in your browser so your patterns and data stay private.",
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
      {
        q: "How long do share links last?",
        a: "Pick an expiry when uploading — links can last from one hour to indefinitely.",
      },
      {
        q: "Is there a file size limit?",
        a: "Yes, a generous per-file limit applies so uploads stay fast and reliable.",
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
      {
        q: "Can I minify SQL as well as format it?",
        a: "Yes, switch between readable formatting and compact minified output.",
      },
      {
        q: "Is my SQL uploaded anywhere?",
        a: "No, all formatting runs locally in your browser so your queries stay private.",
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
      {
        q: "Is my text uploaded anywhere?",
        a: "No, comparison runs locally in your browser so your content stays private.",
      },
      {
        q: "Can I ignore whitespace when comparing?",
        a: "Yes, toggle whitespace-insensitive mode to focus on real content differences.",
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
      {
        q: "Is there a text length limit?",
        a: "No, paste anything from a sentence to a full manuscript and get instant counts.",
      },
      {
        q: "Is my text uploaded anywhere?",
        a: "No, all counting runs locally in your browser so your content stays private.",
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
      {
        q: "Can I download the spoken audio?",
        a: "Yes, export the narration as an audio file to reuse in videos and presentations.",
      },
      {
        q: "Does text to speech work on mobile?",
        a: "Yes, it works in any modern mobile or desktop browser with sound enabled.",
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
      {
        q: "Which timezones are supported?",
        a: "Convert in UTC or your local timezone, with support for common named zones.",
      },
      {
        q: "Does it handle millisecond timestamps?",
        a: "Yes, both second and millisecond epoch values are detected and converted automatically.",
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
      {
        q: "Can I minify TypeScript as well as format it?",
        a: "Yes, switch between beautify mode for readable code and minify mode for smaller files.",
      },
      {
        q: "Does the TypeScript formatter work offline?",
        a: "Yes, once the page loads, all formatting runs locally with no internet connection needed.",
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
      {
        q: "Can I use a custom alias for my link?",
        a: "Yes, pick your own short alias instead of a random code, subject to availability.",
      },
      {
        q: "Do shortened links expire?",
        a: "You choose — links can last from one hour up to permanently.",
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
      {
        q: "Is my URL data uploaded anywhere?",
        a: "No, all parsing and encoding runs locally in your browser.",
      },
      {
        q: "Can I build query strings from scratch?",
        a: "Yes, add key-value pairs and the tool assembles a properly encoded query string.",
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
      {
        q: "What is a UUID used for?",
        a: "UUIDs serve as unique IDs for database rows, API resources, files, and distributed systems.",
      },
      {
        q: "Are generated UUIDs truly unique?",
        a: "Yes, v4 UUIDs use cryptographic randomness making collisions practically impossible.",
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
      {
        q: "Does it validate my YAML syntax?",
        a: "Yes, invalid YAML shows a clear error message pointing at the problem.",
      },
      {
        q: "Is my data uploaded anywhere?",
        a: "No, all conversion runs locally in your browser so your data stays private.",
      },
    ],
  },
};