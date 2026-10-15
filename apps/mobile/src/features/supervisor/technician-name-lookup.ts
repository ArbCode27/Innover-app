import type { TechnicianDirectoryEntry } from "@/types/domain";

const normalizeName = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

const tokensOf = (value: string) =>
  normalizeName(value)
    .split(/[\s/_-]+/)
    .filter((token) => token.length > 0);

export const isPersonalQueueQuery = (query: string) => {
  const normalized = normalizeName(query);
  return (
    normalized === "mis tickets" ||
    normalized === "mi ruta" ||
    normalized === "mis pendientes" ||
    normalized === "mi cola"
  );
};

export type TechnicianNameLookup =
  | { status: "empty" }
  | { status: "personal" }
  | { status: "not_found"; query: string }
  | { status: "resolved"; technician: TechnicianDirectoryEntry }
  | {
      status: "ambiguous";
      query: string;
      candidates: TechnicianDirectoryEntry[];
    };

const nameMatchesQuery = (
  technician: TechnicianDirectoryEntry,
  query: string,
) => {
  const normalizedQuery = normalizeName(query);
  const normalizedName = normalizeName(technician.name);
  if (!normalizedQuery || !normalizedName) {
    return false;
  }
  if (normalizedName === normalizedQuery) {
    return true;
  }

  const queryTokens = tokensOf(query);
  const nameTokens = tokensOf(technician.name);
  if (queryTokens.length === 0) {
    return false;
  }

  return queryTokens.every((token) => nameTokens.includes(token));
};

export const lookupTechnicianAsTyped = (
  directory: TechnicianDirectoryEntry[],
  query: string,
): TechnicianNameLookup => {
  const trimmed = query.trim();
  if (!trimmed) {
    return { status: "empty" };
  }
  if (isPersonalQueueQuery(trimmed)) {
    return { status: "personal" };
  }

  const matches = directory.filter((technician) =>
    nameMatchesQuery(technician, trimmed),
  );

  const [first, ...rest] = matches;
  if (!first) {
    return { status: "not_found", query: trimmed };
  }
  if (rest.length === 0) {
    return { status: "resolved", technician: first };
  }
  return {
    status: "ambiguous",
    query: trimmed,
    candidates: matches,
  };
};
