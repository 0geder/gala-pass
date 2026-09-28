/** Prints only the element marked `.print-ticket` (see the print rules in styles.css). */
export function printTicketOnly() {
  const cleanup = () => {
    document.body.classList.remove("printing-ticket");
    window.removeEventListener("afterprint", cleanup);
  };
  document.body.classList.add("printing-ticket");
  window.addEventListener("afterprint", cleanup);
  window.print();
}
