import Image from "next/image";

export function DevelopmentCredit() {
  return (
    <footer className="development-credit">
      <span>Desarrollado por</span>
      <a
        aria-label="BYL: visitar sitio web (abre en una pestaña nueva)"
        className="development-credit-link"
        href="https://byl-software.vercel.app/"
        rel="noopener noreferrer"
        target="_blank"
      >
        <Image alt="" className="development-credit-icon" height={64} src="/brand/byl-icon.svg" width={64} />
        <Image alt="BYL" className="development-credit-logo" height={2418} src="/brand/byl-logo.svg" width={3109} />
      </a>
    </footer>
  );
}
