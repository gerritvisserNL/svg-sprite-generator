const fileInput = document.querySelector("#file-input");
const fileCount = document.querySelector("#file-count");
const generateBtn = document.querySelector("#generate");
const downloadBtn = document.querySelector("#download");
const downloadHTMLBtn = document.querySelector("#download-html");
const copyBtn = document.querySelector("#copy");
const output = document.querySelector("#output");
const preview = document.querySelector("#preview");

let svgFiles = [];

fileInput.addEventListener("change", (e) => {
  svgFiles = Array.from(e.target.files).filter((file) =>
    file.name.endsWith(".svg")
  );
  fileCount.textContent = `${svgFiles.length} SVG files selected`;
  generateBtn.disabled = svgFiles.length === 0;
});

generateBtn.addEventListener("click", async () => {
  const symbols = [];
  const htmlSnippets = [];

  for (const file of svgFiles) {
    let text = await file.text();

    // Remove xmlns from original text
    text = text.replace(/\s+xmlns="http:\/\/www\.w3\.org\/2000\/svg"/g, "");

    // Parse SVG
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, "image/svg+xml");
    const svg = doc.querySelector("svg");
    if (!svg) continue;

    const width = svg.getAttribute("width") || "24";
    const height = svg.getAttribute("height") || "24";

    // Ensure viewBox exists
    if (!svg.hasAttribute("viewBox")) {
      svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    }

    // Update fill/stroke for all elements
    svg.querySelectorAll("*").forEach((el) => {
      const d = el.getAttribute("d") || "";

      if (el.tagName.toLowerCase() === "path") {
        // Closed path: fill currentColor, remove stroke
        if (/[Zz]\s*$/.test(d)) {
          el.setAttribute("fill", "currentColor");
          el.removeAttribute("stroke");
        } else {
          // Open path: fill none, stroke currentColor
          el.setAttribute("fill", "none");
          el.setAttribute("stroke", "currentColor");
        }
      }

      // Override any remaining fill/stroke
      if (
        el.getAttribute("fill") &&
        el.getAttribute("fill") !== "currentColor" &&
        el.getAttribute("fill") !== "none"
      ) {
        el.setAttribute("fill", "currentColor");
      }

      if (
        el.getAttribute("stroke") &&
        el.getAttribute("stroke") !== "currentColor" &&
        el.getAttribute("stroke") !== "none"
      ) {
        el.setAttribute("stroke", "currentColor");
      }
    });

    // Remove any xmlns attributes
    svg
      .querySelectorAll("[xmlns]")
      .forEach((el) => el.removeAttribute("xmlns"));
    svg.removeAttribute("xmlns");

    const inner = svg.innerHTML.trim();
    const id = file.name.replace(".svg", "");

    // Build <symbol> for sprite
    const symbol = `
  <!-- ${id.replace(/-/g, " ")} -->
  <symbol id="${id}" viewBox="${svg.getAttribute("viewBox")}">
    ${inner}
  </symbol>
`;
    symbols.push(symbol);

    // Build <svg> HTML snippet
    const htmlSnippet = `
<svg class="${id}" width="${width}" height="${height}" role="img">
  <title>${id.charAt(0).toUpperCase() + id.slice(1)}</title>
  <use href="images/sprite.svg#${id}"></use>
</svg>
`;
    htmlSnippets.push(htmlSnippet.trim());
  }

  // Build sprite
  const sprite = `<svg xmlns="http://www.w3.org/2000/svg" style="display:none">
${symbols.join("\n")}
</svg>`;

  output.textContent = sprite;
  downloadBtn.disabled = false;
  downloadHTMLBtn.disabled = false;

  // Build preview
  preview.innerHTML = "";
  const spriteContainer = document.createElement("div");
  spriteContainer.innerHTML = sprite;
  document.body.appendChild(spriteContainer);

  for (const file of svgFiles) {
    const id = file.name.replace(".svg", "");
    const div = document.createElement("div");
    div.classList.add("preview-icon");
    div.innerHTML = `
      <svg><use href="#${id}"></use></svg>
      <span>${id}</span>
    `;
    preview.appendChild(div);
  }

  // Download sprite.svg
  downloadBtn.onclick = () => {
    const blob = new Blob([sprite], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sprite.svg";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Download svg.html
  downloadHTMLBtn.onclick = () => {
    const htmlContent = `<!-- SVG Snippets for embedding icons -->\n\n${htmlSnippets.join(
      "\n\n"
    )}`;
    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "svg.html";
    a.click();
    URL.revokeObjectURL(url);
  };
});
