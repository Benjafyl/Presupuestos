export const FREELANCE_FULL_NAME = "Benjamín Yáñez Lasalvia";

// Keep existing quotes current without rewriting their stored signature or custom text.
export function formatFreelanceSignature(signature: string) {
  return signature.replace(
    /^([\t ]*)Benjamín Yáñez([\t ]*)(?=\r?$)/gm,
    (_line, leading: string, trailing: string) => `${leading}${FREELANCE_FULL_NAME}${trailing}`,
  );
}
