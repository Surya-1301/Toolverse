export async function getApiErrorMessage(
  response: Response,
  fallback = "Something went wrong. Please try again.",
) {
  let responseText = "";

  try {
    responseText = await response.text();
  } catch {
    return fallback;
  }

  if (!responseText) {
    return fallback;
  }

  try {
    const data = JSON.parse(responseText) as {
      error?: string;
      message?: string;
    };

    if (data.error) return data.error;
    if (data.message) return data.message;
  } catch {
    // Continue to HTML/plain-text cleanup.
  }

  const cleanedText = responseText
    .replace(/<!DOCTYPE[^>]*>/gi, "")
    .replace(/<html[^>]*>/gi, "")
    .replace(/<\/html>/gi, "")
    .replace(/<head[^>]*>[\s\S]*?<\/head>/gi, "")
    .replace(/<body[^>]*>/gi, "")
    .replace(/<\/body>/gi, "")
    .replace(/<pre[^>]*>/gi, "")
    .replace(/<\/pre>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleanedText) {
    return fallback;
  }

  if (/cannot\s+(post|get|put|delete|patch)/i.test(cleanedText)) {
    return "This tool is not available on the backend yet. Please redeploy the PDF backend or check the API route.";
  }

  if (/failed to fetch/i.test(cleanedText)) {
    return "Could not reach the backend. Please check your internet connection or try again in a moment.";
  }

  if (/not allowed by cors/i.test(cleanedText)) {
    return "The backend blocked this request. Please check the allowed frontend origin in the backend CORS settings.";
  }

  if (/password/i.test(cleanedText) && /invalid|incorrect|wrong/i.test(cleanedText)) {
    return "The password you entered is incorrect. Please check the current PDF password and try again.";
  }

  if (/traceback|file \"<string>\"|python/i.test(cleanedText)) {
    return fallback;
  }

  return cleanedText;
}