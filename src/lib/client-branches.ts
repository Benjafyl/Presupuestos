export type BranchLocation = {
  branch: string | null;
  commune: string | null;
  city: string | null;
};

function normalize(value: string | null | undefined) {
  return (value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toUpperCase().replace(/[^A-Z0-9]+/g, " ").trim();
}

export function canonicalBranchName(location: BranchLocation) {
  const name = normalize(location.branch);
  const inTemuco = normalize(location.commune || location.city) === "TEMUCO";
  // Confirmed aliases of this mall. Never infer identity from a store number:
  // LOCAL S506 / Paris and SHOPPING 506 are different locations.
  if (/^(MALL PORTAL TEMUCO|CENCO TEMUCO|CENCO ?MALL TEMUCO)( S506| SHOPPING 506)?$/.test(name)
    || (inTemuco && /^(CENCO|CENCO ?MALL|SHOPPING 506)$/.test(name))) {
    return "MALL PORTAL TEMUCO";
  }
  return (location.branch ?? "").replace(/\s+/g, " ").trim();
}

export function branchIdentity(location: BranchLocation) {
  const name = normalize(canonicalBranchName(location));
  if (!name) return "";
  const commune = normalize(location.commune || location.city);
  return `${name}|${commune || (name === "MALL PORTAL TEMUCO" ? "TEMUCO" : "")}`;
}

export function uniqueBranches<T extends BranchLocation & { id: number }>(branches: T[]) {
  const groups = new Map<string, T & { memberIds: number[] }>();
  for (const branch of [...branches].sort((a, b) => a.id - b.id)) {
    const key = branchIdentity(branch);
    if (!key) continue;
    const existing = groups.get(key);
    if (existing) existing.memberIds.push(branch.id);
    else groups.set(key, { ...branch, branch: canonicalBranchName(branch), memberIds: [branch.id] });
  }
  return [...groups.values()].sort((a, b) =>
    `${a.branch} ${a.commune ?? ""}`.localeCompare(`${b.branch} ${b.commune ?? ""}`, "es"));
}

// Deliberately return only location fields, never quote-specific data.
export function branchSelection(branch?: BranchLocation & { id: number }) {
  return {
    clientBranchId: branch?.id ?? null,
    branch: branch ? canonicalBranchName(branch) : "",
    commune: branch?.commune ?? "",
    city: branch?.city ?? "",
  };
}
