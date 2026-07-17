// Polyfill browser globals for libraries like pdf-parse in Node.js environment
if (typeof global.DOMMatrix === "undefined") {
  global.DOMMatrix = class DOMMatrix {};
}
