export type StatusClass = {
  code: "1xx" | "2xx" | "3xx" | "4xx" | "5xx";
  name: string;
  description: string;
};

export type StatusCode = {
  code: number;
  title: string;
  class: StatusClass["code"];
  description: string;
};

export const statusClasses: StatusClass[] = [
  {
    code: "1xx",
    name: "Informational",
    description: "The request was received and is being processed.",
  },
  {
    code: "2xx",
    name: "Successful",
    description: "The request was understood and completed successfully.",
  },
  {
    code: "3xx",
    name: "Redirection",
    description: "Further action is needed to complete the request.",
  },
  {
    code: "4xx",
    name: "Client error",
    description: "The request contains bad syntax or cannot be fulfilled.",
  },
  {
    code: "5xx",
    name: "Server error",
    description: "The server failed to fulfill an otherwise valid request.",
  },
];

export const statusCodes: StatusCode[] = [
  { code: 100, title: "Continue", class: "1xx", description: "The server has received the request headers, and the client should proceed to send the request body." },
  { code: 101, title: "Switching Protocols", class: "1xx", description: "The requester has asked the server to switch protocols." },
  { code: 102, title: "Processing", class: "1xx", description: "The server has received and is processing the request, but no response is available yet." },
  { code: 103, title: "Early Hints", class: "1xx", description: "Used to return some response headers before the final HTTP message." },

  { code: 200, title: "OK", class: "2xx", description: "The request succeeded. The meaning depends on the HTTP method used." },
  { code: 201, title: "Created", class: "2xx", description: "The request succeeded, and a new resource was created as a result." },
  { code: 202, title: "Accepted", class: "2xx", description: "The request has been accepted for processing, but the processing has not been completed." },
  { code: 203, title: "Non-Authoritative Information", class: "2xx", description: "The returned metadata is not identical to the origin server's, collected from a local or third-party copy." },
  { code: 204, title: "No Content", class: "2xx", description: "The server successfully processed the request but is not returning any content." },
  { code: 205, title: "Reset Content", class: "2xx", description: "The server successfully processed the request, but requires the client to reset the document view." },
  { code: 206, title: "Partial Content", class: "2xx", description: "The server is delivering only part of the resource due to a range header sent by the client." },
  { code: 207, title: "Multi-Status", class: "2xx", description: "Conveys information about multiple resources (WebDAV)." },

  { code: 300, title: "Multiple Choices", class: "3xx", description: "The request has more than one possible response, and the user or agent should choose one." },
  { code: 301, title: "Moved Permanently", class: "3xx", description: "The requested resource has been permanently moved to a new URL." },
  { code: 302, title: "Found", class: "3xx", description: "The requested resource temporarily resides under a different URL." },
  { code: 303, title: "See Other", class: "3xx", description: "The response is available at another URI, which the client should retrieve with GET." },
  { code: 304, title: "Not Modified", class: "3xx", description: "The resource has not been modified since the version specified by the request headers." },
  { code: 307, title: "Temporary Redirect", class: "3xx", description: "The requested resource temporarily resides under a different URL, preserving the method." },
  { code: 308, title: "Permanent Redirect", class: "3xx", description: "The requested resource has been permanently moved, preserving the method." },

  { code: 400, title: "Bad Request", class: "4xx", description: "The server cannot process the request due to a client error in the request." },
  { code: 401, title: "Unauthorized", class: "4xx", description: "The request lacks valid authentication credentials for the target resource." },
  { code: 402, title: "Payment Required", class: "4xx", description: "Reserved for future use; sometimes used to gate access behind payment." },
  { code: 403, title: "Forbidden", class: "4xx", description: "The server understood the request but refuses to authorize it." },
  { code: 404, title: "Not Found", class: "4xx", description: "The server cannot find the requested resource." },
  { code: 405, title: "Method Not Allowed", class: "4xx", description: "The request method is known by the server but not supported for the resource." },
  { code: 406, title: "Not Acceptable", class: "4xx", description: "The server cannot produce a response matching the client's content negotiation preferences." },
  { code: 407, title: "Proxy Authentication Required", class: "4xx", description: "Authentication is required through a proxy before the request can be fulfilled." },
  { code: 408, title: "Request Timeout", class: "4xx", description: "The server closed the connection because it did not receive a complete request in time." },
  { code: 409, title: "Conflict", class: "4xx", description: "The request conflicts with the current state of the server." },
  { code: 410, title: "Gone", class: "4xx", description: "The requested content has been permanently deleted from the server." },
  { code: 411, title: "Length Required", class: "4xx", description: "The server requires a Content-Length header on the request." },
  { code: 412, title: "Precondition Failed", class: "4xx", description: "One or more conditions in the request header fields evaluated to false." },
  { code: 413, title: "Payload Too Large", class: "4xx", description: "The request entity is larger than the server is willing to process." },
  { code: 414, title: "URI Too Long", class: "4xx", description: "The request URI is longer than the server is willing to interpret." },
  { code: 415, title: "Unsupported Media Type", class: "4xx", description: "The request is in a media format the server does not support." },
  { code: 416, title: "Range Not Satisfiable", class: "4xx", description: "The range specified in the request header cannot be fulfilled." },
  { code: 417, title: "Expectation Failed", class: "4xx", description: "The expectation given in the Expect request header could not be met." },
  { code: 418, title: "I'm a Teapot", class: "4xx", description: "This code was an April Fools' joke from 1998; the server refuses to brew coffee in a teapot." },
  { code: 421, title: "Misdirected Request", class: "4xx", description: "The request was directed at a server that cannot produce a response." },
  { code: 422, title: "Unprocessable Content", class: "4xx", description: "The request was well-formed but contained semantic errors." },
  { code: 425, title: "Too Early", class: "4xx", description: "The server is unwilling to risk processing a request it might replay." },
  { code: 426, title: "Upgrade Required", class: "4xx", description: "The client should switch to a different protocol described in the Upgrade header." },
  { code: 428, title: "Precondition Required", class: "4xx", description: "The origin server requires the request to be conditional." },
  { code: 429, title: "Too Many Requests", class: "4xx", description: "The user has sent too many requests in a given amount of time." },
  { code: 431, title: "Request Header Fields Too Large", class: "4xx", description: "The request header fields are too large for the server to process." },
  { code: 451, title: "Unavailable For Legal Reasons", class: "4xx", description: "The server is denying access because of a legal demand." },

  { code: 500, title: "Internal Server Error", class: "5xx", description: "The server encountered an unexpected condition that prevented it from fulfilling the request." },
  { code: 501, title: "Not Implemented", class: "5xx", description: "The server does not support the functionality required to fulfill the request." },
  { code: 502, title: "Bad Gateway", class: "5xx", description: "The server, acting as a gateway, received an invalid response from an upstream server." },
  { code: 503, title: "Service Unavailable", class: "5xx", description: "The server is not ready to handle the request, often due to maintenance or overload." },
  { code: 504, title: "Gateway Timeout", class: "5xx", description: "The server, acting as a gateway, did not get a timely response from an upstream server." },
  { code: 505, title: "HTTP Version Not Supported", class: "5xx", description: "The server does not support the HTTP protocol version used in the request." },
  { code: 506, title: "Variant Also Negotiates", class: "5xx", description: "The server has an internal configuration error with content negotiation." },
  { code: 507, title: "Insufficient Storage", class: "5xx", description: "The server was unable to store the representation needed to complete the request." },
  { code: 508, title: "Loop Detected", class: "5xx", description: "The server detected an infinite loop while processing the request." },
  { code: 510, title: "Not Extended", class: "5xx", description: "Further extensions to the request are required for the server to fulfill it." },
  { code: 511, title: "Network Authentication Required", class: "5xx", description: "The client needs to authenticate to gain network access." },
];