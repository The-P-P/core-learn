import { save } from "@tauri-apps/plugin-dialog";
import { writeFile } from "@tauri-apps/plugin-fs";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { marked } from "marked";

export function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function markdownToHtml(markdown: string): string {
  marked.setOptions({ gfm: true, breaks: true });
  return marked.parse(markdown || "", { async: false }) as string;
}

function buildPrintDocument(opts: {
  title: string;
  breadcrumb: string;
  markdown: string;
}): HTMLDivElement {
  const root = document.createElement("div");
  root.setAttribute("data-pdf-root", "true");
  Object.assign(root.style, {
    position: "fixed",
    left: "-10000px",
    top: "0",
    width: "794px",
    padding: "48px 56px",
    background: "#faf6ec",
    color: "#16233f",
    fontFamily: '"Source Serif 4", Georgia, serif',
    fontSize: "14px",
    lineHeight: "1.55",
    zIndex: "-1",
  });

  const crumb = document.createElement("div");
  crumb.textContent = opts.breadcrumb;
  Object.assign(crumb.style, {
    fontFamily: '"IBM Plex Mono", ui-monospace, monospace',
    fontSize: "10px",
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: "#2f6e6e",
    marginBottom: "8px",
  });

  const title = document.createElement("h1");
  title.textContent = opts.title;
  Object.assign(title.style, {
    fontSize: "28px",
    fontWeight: "600",
    margin: "0 0 8px",
    lineHeight: "1.25",
  });

  const meta = document.createElement("div");
  meta.textContent = `Core Learn · Resumo · ${new Date().toLocaleDateString("pt-BR")}`;
  Object.assign(meta.style, {
    fontFamily: '"IBM Plex Mono", ui-monospace, monospace',
    fontSize: "10px",
    color: "#5a6578",
    marginBottom: "28px",
    paddingBottom: "16px",
    borderBottom: "1px solid #d4cbb8",
  });

  const body = document.createElement("div");
  body.className = "md-pdf-body";
  body.innerHTML = markdownToHtml(opts.markdown);
  const style = document.createElement("style");
  style.textContent = `
    [data-pdf-root] .md-pdf-body h1 { font-size: 22px; margin: 1.4em 0 0.5em; font-weight: 600; }
    [data-pdf-root] .md-pdf-body h2 { font-size: 18px; margin: 1.3em 0 0.45em; font-weight: 600; }
    [data-pdf-root] .md-pdf-body h3 { font-size: 15px; margin: 1.2em 0 0.4em; font-weight: 600; }
    [data-pdf-root] .md-pdf-body p { margin: 0.6em 0; }
    [data-pdf-root] .md-pdf-body ul, [data-pdf-root] .md-pdf-body ol { margin: 0.6em 0; padding-left: 1.4em; }
    [data-pdf-root] .md-pdf-body li { margin: 0.25em 0; }
    [data-pdf-root] .md-pdf-body code {
      font-family: "IBM Plex Mono", ui-monospace, monospace;
      font-size: 12px;
      background: #efe8d8;
      padding: 0.1em 0.35em;
    }
    [data-pdf-root] .md-pdf-body pre {
      background: #efe8d8;
      padding: 12px 14px;
      overflow: hidden;
      white-space: pre-wrap;
      font-family: "IBM Plex Mono", ui-monospace, monospace;
      font-size: 12px;
    }
    [data-pdf-root] .md-pdf-body blockquote {
      margin: 0.8em 0;
      padding-left: 14px;
      border-left: 3px solid #2f6e6e;
      color: #3a4660;
    }
    [data-pdf-root] .md-pdf-body a { color: #2f6e6e; }
    [data-pdf-root] .md-pdf-body hr { border: none; border-top: 1px solid #d4cbb8; margin: 1.4em 0; }
    [data-pdf-root] .md-pdf-body table { border-collapse: collapse; width: 100%; margin: 0.8em 0; }
    [data-pdf-root] .md-pdf-body th, [data-pdf-root] .md-pdf-body td {
      border: 1px solid #d4cbb8; padding: 6px 8px; text-align: left;
    }
    [data-pdf-root] .md-pdf-body th { background: #efe8d8; }
  `;

  root.append(style, crumb, title, meta, body);
  document.body.appendChild(root);
  return root;
}

async function renderPdfBytes(root: HTMLDivElement): Promise<Uint8Array> {
  const canvas = await html2canvas(root, {
    scale: 2,
    backgroundColor: "#faf6ec",
    useCORS: true,
    logging: false,
    windowWidth: root.scrollWidth,
    windowHeight: root.scrollHeight,
  });

  const imgData = canvas.toDataURL("image/jpeg", 0.92);
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 0;
  const imgWidth = pageWidth - margin * 2;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = 0;

  pdf.addImage(imgData, "JPEG", margin, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  while (heightLeft > 2) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, "JPEG", margin, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  const arrayBuffer = pdf.output("arraybuffer");
  return new Uint8Array(arrayBuffer);
}

export async function exportSummaryPdf(opts: {
  title: string;
  breadcrumb: string;
  markdown: string;
}): Promise<"saved" | "cancelled"> {
  const root = buildPrintDocument(opts);
  try {
    const bytes = await renderPdfBytes(root);
    const slug = slugify(opts.title) || "topico";
    const date = new Date().toISOString().slice(0, 10);
    const path = await save({
      defaultPath: `resumo-${slug}-${date}.pdf`,
      filters: [{ name: "PDF", extensions: ["pdf"] }],
    });
    if (!path) return "cancelled";
    await writeFile(path, bytes);
    return "saved";
  } finally {
    root.remove();
  }
}
