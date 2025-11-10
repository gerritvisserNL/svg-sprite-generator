const fileInput = document.querySelector("#file-input");
const fileCount = document.querySelector("#file-count");
const generateBtn = document.querySelector("#generate");
const downloadBtn = document.querySelector("#download");
const downloadHTMLBtn = document.querySelector("#download-html");
const output = document.querySelector("#output");
const htmlOutput = document.querySelector("#html-output");
const preview = document.querySelector("#preview");
const spriteContainer = document.querySelector("#sprite-container");

const copySpriteBtn = document.querySelector("#copy-sprite");
const copyHTMLBtn = document.querySelector("#copy-html");

// Select hidden result sections
const resultSections = document.querySelectorAll(
  ".code-card.hidden, .preview-card.hidden"
);

let svgFiles = [];

// --- FILE INPUT HANDLING ---
fileInput.addEventListener("change", (e) => {
  svgFiles = Array.from(e.target.files).filter((file) =>
    file.name.endsWith(".svg")
  );
  fileCount.textContent = `${svgFiles.length} SVG files selected`;
  generateBtn.disabled = svgFiles.length === 0;
});

// --- GENERATE SPRITE ---
generateBtn.addEventListener("click", async () => {
  const symbols = [];
  const htmlSnippets = [];

  preview.innerHTML = ""; // Clear preview section
  spriteContainer.innerHTML = ""; // Clear previous sprite from DOM

  for (const file of svgFiles) {
    let text = await file.text();
    text = text.replace(/\s+xmlns="http:\/\/www\.w3\.org\/2000\/svg"/g, "");

    const parser = new DOMParser();
    const doc = parser.parseFromString(text, "image/svg+xml");
    const svg = doc.querySelector("svg");
    if (!svg) continue;

    const width = svg.getAttribute("width") || "24";
    const height = svg.getAttribute("height") || "24";

    // Add missing viewBox if not present
    if (!svg.hasAttribute("viewBox")) {
      svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    }

    // Normalize fill and stroke attributes
    svg.querySelectorAll("*").forEach((el) => {
      const d = el.getAttribute("d") || "";
      if (el.tagName.toLowerCase() === "path") {
        if (/[Zz]\s*$/.test(d)) {
          el.setAttribute("fill", "currentColor");
          el.removeAttribute("stroke");
        } else {
          el.setAttribute("fill", "none");
          el.setAttribute("stroke", "currentColor");
        }
      }

      if (
        el.getAttribute("fill") &&
        !["currentColor", "none"].includes(el.getAttribute("fill"))
      ) {
        el.setAttribute("fill", "currentColor");
      }
      if (
        el.getAttribute("stroke") &&
        !["currentColor", "none"].includes(el.getAttribute("stroke"))
      ) {
        el.setAttribute("stroke", "currentColor");
      }
    });

    // Remove xmlns attributes
    svg
      .querySelectorAll("[xmlns]")
      .forEach((el) => el.removeAttribute("xmlns"));
    svg.removeAttribute("xmlns");

    const inner = svg.innerHTML.trim();
    const id = file.name.replace(".svg", "");

    // --- CREATE SYMBOL ELEMENT ---
    const symbol = `
  <!-- ${id.replace(/-/g, " ")} -->
  <symbol id="${id}" viewBox="${svg.getAttribute("viewBox")}">
    ${inner}
  </symbol>`;
    symbols.push(symbol);

    // --- CREATE HTML SNIPPET ---
    const titleText = id.replace(/-/g, " ").toLowerCase();
    const htmlSnippet = `
<svg class="${id.toLowerCase()}" width="${width}" height="${height}" role="img">
  <title>${titleText}</title>
  <use href="images/sprite.svg#${id.toLowerCase()}"></use>
</svg>`;
    htmlSnippets.push(htmlSnippet.trim());

    // --- PREVIEW ITEM ---
    const div = document.createElement("div");
    div.classList.add("preview-icon");
    div.innerHTML = `
      <svg><use href="#${id}"></use></svg>
      <span>${id}</span>`;
    preview.appendChild(div);
  }

  // --- BUILD SPRITE STRING ---
  const sprite = `<svg xmlns="http://www.w3.org/2000/svg" style="display:none">
${symbols.join("\n")}
</svg>`;

  // Inject sprite into DOM
  spriteContainer.innerHTML = sprite;

  // --- UPDATE OUTPUTS ---
  output.textContent = sprite;
  htmlOutput.textContent = htmlSnippets.join("\n\n");

  downloadBtn.disabled = false;
  downloadHTMLBtn.disabled = false;
  copySpriteBtn.disabled = false;
  copyHTMLBtn.disabled = false;

  // --- DOWNLOAD SPRITE ---
  downloadBtn.onclick = () => {
    const blob = new Blob([sprite], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sprite.svg";
    a.click();
    URL.revokeObjectURL(url);
  };

  // --- DOWNLOAD HTML SNIPPETS ---
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

  // --- COPY SPRITE TO CLIPBOARD ---
  copySpriteBtn.onclick = async () => {
    try {
      await navigator.clipboard.writeText(output.textContent);
      copySpriteBtn.textContent = "Copied!";
      setTimeout(() => (copySpriteBtn.textContent = "Copy Sprite"), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  // --- COPY HTML SNIPPETS TO CLIPBOARD ---
  copyHTMLBtn.onclick = async () => {
    try {
      await navigator.clipboard.writeText(htmlOutput.textContent);
      copyHTMLBtn.textContent = "Copied!";
      setTimeout(() => (copyHTMLBtn.textContent = "Copy HTML"), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  // --- SHOW HIDDEN RESULT SECTIONS ---
  resultSections.forEach((section) => section.classList.remove("hidden"));
});
