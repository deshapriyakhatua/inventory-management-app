import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

/**
 * Generates and downloads a multi-page PDF for an invoice element.
 * Properly manages top and bottom page margins and avoids splitting table rows across page boundaries.
 * 
 * @param {HTMLElement} element - The DOM node to render into PDF
 * @param {string} filename - The output filename for the downloaded PDF
 */
export async function downloadInvoicePdf(element, filename = "Invoice.pdf") {
  if (!element) return;

  if (typeof document !== "undefined" && document.fonts) {
    await document.fonts.ready;
  }

  // 1. Capture full element via html2canvas
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: "#ffffff",
    onclone: (clonedDoc) => {
      const style = clonedDoc.createElement("style");
      style.innerHTML = `
        * {
          font-family: "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
      `;
      clonedDoc.head.appendChild(style);
    },
  });

  const pdf = new jsPDF("p", "mm", "a4");
  const pageWidth = pdf.internal.pageSize.getWidth(); // 210 mm
  const pageHeight = pdf.internal.pageSize.getHeight(); // 297 mm

  const marginTop = 12; // 12 mm top margin on page 2+
  const marginBottom = 12; // 12 mm bottom margin on all pages

  // Ratio to convert canvas pixels to PDF mm
  const pxToMm = pageWidth / canvas.width;
  const totalHeightMm = canvas.height * pxToMm;

  // Single page document
  if (totalHeightMm <= pageHeight) {
    const imgData = canvas.toDataURL("image/png");
    pdf.addImage(imgData, "PNG", 0, 0, pageWidth, totalHeightMm);
    pdf.save(filename);
    return;
  }

  // Multi-page document: measure element break points to avoid cutting rows
  const containerRect = element.getBoundingClientRect();
  const scaleCanvas = canvas.height / containerRect.height;

  // Find breakable child elements (table rows, totals section, QR section, bottom grids)
  const breakableElements = Array.from(
    element.querySelectorAll(
      "tr, div[class*='sampleTotalsGrid'], div[class*='sampleQrGrid'], div[class*='totalsList'], div[class*='qrCard'], div[class*='sampleBottomGrid'], div[class*='bottomGrid']"
    )
  );

  // Compute pixel boundaries of breakable elements relative to container
  const elementBounds = breakableElements
    .map((el) => {
      const rect = el.getBoundingClientRect();
      return {
        topPx: (rect.top - containerRect.top) * scaleCanvas,
        bottomPx: (rect.bottom - containerRect.top) * scaleCanvas,
      };
    })
    .filter((b) => b.bottomPx > b.topPx)
    .sort((a, b) => a.topPx - b.topPx);

  let currentY = 0;
  let pageIndex = 0;

  while (currentY < canvas.height - 1) {
    // Top margin is 0 for Page 1 because .pdfPreviewCard has top padding (~12mm) built-in
    const pageTopMargin = pageIndex === 0 ? 0 : marginTop;
    const maxPageHeightMm = pageHeight - pageTopMargin - marginBottom;
    const maxCanvasY = currentY + maxPageHeightMm / pxToMm;

    let splitY = maxCanvasY;

    if (splitY < canvas.height) {
      // Find an element straddling the page break line
      const straddlingElement = elementBounds.find(
        (b) => b.topPx < splitY && b.bottomPx > splitY
      );

      // If an element is split by the break line, move break point to before this element
      if (straddlingElement && straddlingElement.topPx > currentY + 20) {
        splitY = straddlingElement.topPx;
      }
    } else {
      splitY = canvas.height;
    }

    // Guard against potential infinite loop if an element is taller than available space
    if (splitY <= currentY) {
      splitY = maxCanvasY;
    }

    const sliceHeight = Math.min(splitY - currentY, canvas.height - currentY);
    if (sliceHeight <= 0) break;

    // Render slice canvas
    const pageCanvas = document.createElement("canvas");
    pageCanvas.width = canvas.width;
    pageCanvas.height = sliceHeight;

    const ctx = pageCanvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
    ctx.drawImage(
      canvas,
      0,
      currentY,
      canvas.width,
      sliceHeight,
      0,
      0,
      canvas.width,
      sliceHeight
    );

    const sliceImgData = pageCanvas.toDataURL("image/png");
    const sliceHeightMm = sliceHeight * pxToMm;

    if (pageIndex > 0) {
      pdf.addPage();
    }

    const destY = pageIndex === 0 ? 0 : marginTop;
    pdf.addImage(sliceImgData, "PNG", 0, destY, pageWidth, sliceHeightMm);

    currentY = splitY;
    pageIndex++;
  }

  pdf.save(filename);
}
