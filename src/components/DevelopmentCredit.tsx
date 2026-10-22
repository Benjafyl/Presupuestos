import Image from "next/image";

export function DevelopmentCredit() {
  return (
    <footer className="development-credit">
      <a
        aria-label="Desarrollado por BYL: visitar sitio web (abre en una pestaña nueva)"
        className="development-credit-link"
        href="https://bylsoftware.cl/"
        rel="noopener noreferrer"
        target="_blank"
      >
        <Image alt="" className="development-credit-icon" height={64} src="/brand/byl-icon.svg" width={64} />
        <span>Desarrollado por <strong>BYL</strong></span>
      </a>
    </footer>
  );
}
