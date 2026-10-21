async function responseError(response) {
  const body = await response.text();
  if (body) {
    try {
      const payload = JSON.parse(body);
      return payload.error || payload.detail || payload.message || body;
    } catch {
      return body;
    }
  }
  return response.statusText || `Request failed with status ${response.status}`;
}

export async function downloadPdfResponse(response, fallbackFilename) {
  if (!response.ok) {
    throw new Error(await responseError(response));
  }

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.toLowerCase().startsWith("application/pdf")) {
    throw new Error(await responseError(response));
  }

  const disposition = response.headers.get("content-disposition") || "";
  const encodedFilename = disposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  const plainFilename = disposition.match(/filename="?([^";]+)"?/i)?.[1];
  let filename = fallbackFilename;
  if (encodedFilename) {
    try {
      filename = decodeURIComponent(encodedFilename);
    } catch {
      filename = encodedFilename;
    }
  } else if (plainFilename) {
    filename = plainFilename;
  }

  const url = URL.createObjectURL(await response.blob());
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.hidden = true;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
