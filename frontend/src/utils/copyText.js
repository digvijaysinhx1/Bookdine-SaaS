export const copyText = async (
  value,
  {
    clipboard = globalThis.navigator?.clipboard,
    documentObject = globalThis.document,
  } = {}
) => {
  if (typeof value !== "string" || !value) throw new Error("There is no saved value to copy.");

  if (typeof clipboard?.writeText === "function") {
    try {
      await clipboard.writeText(value);
      return true;
    } catch {
      // Use the document fallback when browser clipboard permission is unavailable.
    }
  }

  if (!documentObject?.body || typeof documentObject.execCommand !== "function") {
    throw new Error("Clipboard access is unavailable in this browser.");
  }

  const input = documentObject.createElement("textarea");
  input.value = value;
  input.setAttribute("readonly", "");
  input.style.position = "fixed";
  input.style.opacity = "0";
  documentObject.body.appendChild(input);
  input.select();
  let copied = false;
  try {
    copied = documentObject.execCommand("copy");
  } finally {
    documentObject.body.removeChild(input);
  }
  if (!copied) throw new Error("The browser could not copy the saved value.");
  return true;
};
