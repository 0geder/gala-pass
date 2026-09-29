/**
 * Prints only the element marked `.print-ticket` (see the print rules in styles.css),
 * on a page sized exactly to the ticket so the saved PDF is the ticket with no margins.
 */
export function printTicketOnly() {
  const ticket = document.querySelector<HTMLElement>(".print-ticket");
  const rect = ticket?.getBoundingClientRect();

  const pageStyle = document.createElement("style");
  if (ticket && rect) {
    const width = Math.ceil(rect.width);
    const height = Math.ceil(rect.height);
    pageStyle.textContent = `
      @page { size: ${width}px ${height}px; margin: 0; }
      @media print { body.printing-ticket .print-ticket { width: ${width}px !important; } }
    `;
    document.head.appendChild(pageStyle);
  }

  const cleanup = () => {
    document.body.classList.remove("printing-ticket");
    pageStyle.remove();
    window.removeEventListener("afterprint", cleanup);
  };
  document.body.classList.add("printing-ticket");
  window.addEventListener("afterprint", cleanup);
  window.print();
}
