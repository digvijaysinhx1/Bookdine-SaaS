import test from "node:test";
import assert from "node:assert/strict";
import { copyText } from "./copyText.js";

test("clipboard API copies the supplied absolute booking URL", async () => {
  let copied;
  await copyText("https://bookdine.example.com/book/roasted-beans-cafe", {
    clipboard: { writeText: async (value) => { copied = value; } },
    documentObject: null,
  });
  assert.equal(copied, "https://bookdine.example.com/book/roasted-beans-cafe");
});

test("legacy copy fallback succeeds when clipboard permission is denied", async () => {
  let appended;
  let removed;
  const documentObject = {
    body: {
      appendChild(input) { appended = input; },
      removeChild(input) { removed = input; },
    },
    createElement() { return { style: {}, setAttribute() {}, select() {} }; },
    execCommand(command) { assert.equal(command, "copy"); return true; },
  };
  await copyText("roasted-beans-cafe", {
    clipboard: { writeText: async () => { throw new Error("permission denied"); } },
    documentObject,
  });
  assert.equal(appended.value, "roasted-beans-cafe");
  assert.equal(removed, appended);
});

test("copy failure is reported when neither clipboard path succeeds", async () => {
  await assert.rejects(copyText("roasted-beans-cafe", { clipboard: null, documentObject: null }), /Clipboard access is unavailable/);
});
