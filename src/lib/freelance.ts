import { buildQuoteCode } from "@/lib/quote-format";

export const freelanceSettings = {
  quotePrefix: "BY",
  signatureDefault: "Atentamente,\n\nBenjamín Yáñez\nFreelance Developer / Soluciones Digitales",
  name: "Benjamín Yáñez",
  brand: "BY",
  area: "Desarrollo Web y Soluciones Digitales",
  services: "Sitios web, e-commerce, software a medida, automatizaciones, chatbots y soluciones digitales",
  email: "benjafyl@gmail.com",
};

export const freelanceTemplate = {
  mainText:
    "Esta propuesta considera el diseño, desarrollo e implementación de una solución digital según los requerimientos del proyecto.",
  exclusions:
    "No incluye servicios, licencias, integraciones o funcionalidades no descritas explícitamente en esta propuesta.",
  warranty:
    "Condiciones comerciales: 50% de anticipo para iniciar el proyecto y 50% contra entrega, salvo acuerdo distinto entre las partes.",
  executionTime: "Plazo estimado: A convenir según alcance final del proyecto.",
};

export function defaultFreelanceCode(today: string) {
  return buildQuoteCode(freelanceSettings.quotePrefix, "WEB", today);
}
