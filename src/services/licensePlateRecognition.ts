export type LicensePlatePattern = 'old' | 'mercosul';

export type LicensePlateCandidate = {
  plate: string;
  pattern: LicensePlatePattern;
  sourceText: string;
};

export const OLD_PLATE_REGEX = /^[A-Z]{3}-?[0-9]{4}$/;
export const MERCOSUL_PLATE_REGEX = /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/;

const DIRECT_PLATE_REGEX = /[A-Z]{3}[-\s]?[0-9]{4}|[A-Z]{3}[-\s]?[0-9][A-Z][0-9]{2}/g;

export function normalizePlateInput(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, '')
    .replace(/-{2,}/g, '-');
}

export function compactPlateInput(value: string) {
  return normalizePlateInput(value).replace(/-/g, '');
}

export function getPlatePattern(value: string): LicensePlatePattern | null {
  const normalized = normalizePlateInput(value);
  const compact = compactPlateInput(value);

  if (OLD_PLATE_REGEX.test(normalized) || OLD_PLATE_REGEX.test(compact)) {
    return 'old';
  }

  if (MERCOSUL_PLATE_REGEX.test(compact)) {
    return 'mercosul';
  }

  return null;
}

export function formatPlate(value: string) {
  const compact = compactPlateInput(value);
  const pattern = getPlatePattern(compact);

  if (pattern === 'old') {
    return `${compact.slice(0, 3)}-${compact.slice(3)}`;
  }

  if (pattern === 'mercosul') {
    return compact;
  }

  return normalizePlateInput(value);
}

export function validatePlate(value: string) {
  const pattern = getPlatePattern(value);

  return {
    isValid: pattern !== null,
    pattern,
    plate: pattern ? formatPlate(value) : normalizePlateInput(value),
  };
}

const CHAR_MAP_TO_DIGIT: Record<string, string> = {
  'O': '0', 'Q': '0', 'D': '0',
  'I': '1', 'L': '1', 'J': '1',
  'Z': '2',
  'S': '5',
  'G': '6',
  'B': '8',
};

const DIGIT_MAP_TO_CHAR: Record<string, string> = {
  '0': 'O', '1': 'I', '2': 'Z',
  '5': 'S', '6': 'G', '8': 'B',
};

export function tryCorrectPlate(raw: string): string | null {
  const clean = raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (clean.length !== 7) return null;

  const isLetter = (c: string) => /[A-Z]/.test(c);
  const isDigit = (c: string) => /[0-9]/.test(c);

  const forceLetter = (c: string) => {
    if (isLetter(c)) return c;
    return DIGIT_MAP_TO_CHAR[c] ?? c;
  };

  const forceDigit = (c: string) => {
    if (isDigit(c)) return c;
    return CHAR_MAP_TO_DIGIT[c] ?? c;
  };

  // Pos 0, 1, 2 devem ser letras
  const p0 = forceLetter(clean[0]);
  const p1 = forceLetter(clean[1]);
  const p2 = forceLetter(clean[2]);

  // Pos 3 deve ser número
  const p3 = forceDigit(clean[3]);

  // Pos 5, 6 devem ser números
  const p5 = forceDigit(clean[5]);
  const p6 = forceDigit(clean[6]);

  // Pos 4 pode ser letra (Mercosul) ou número (Antigo)
  const p4_old = forceDigit(clean[4]);
  const candidateOld = `${p0}${p1}${p2}${p3}${p4_old}${p5}${p6}`;

  const p4_merco = forceLetter(clean[4]);
  const candidateMerco = `${p0}${p1}${p2}${p3}${p4_merco}${p5}${p6}`;

  const isOldValid = OLD_PLATE_REGEX.test(candidateOld);
  const isMercoValid = MERCOSUL_PLATE_REGEX.test(candidateMerco);

  if (isOldValid && isMercoValid) {
    if (isDigit(clean[4])) {
      return candidateOld;
    } else {
      return candidateMerco;
    }
  }

  if (isMercoValid) return candidateMerco;
  if (isOldValid) return candidateOld;

  return null;
}

export function extractPlateCandidates(ocrText: string): LicensePlateCandidate[] {
  const upperText = ocrText
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();
  const candidates = new Map<string, LicensePlateCandidate>();

  const addCandidate = (rawValue: string, sourceText: string) => {
    const corrected = tryCorrectPlate(rawValue);
    const lookupValue = corrected || rawValue;
    const validation = validatePlate(lookupValue);

    if (validation.isValid && validation.pattern) {
      candidates.set(validation.plate, {
        plate: validation.plate,
        pattern: validation.pattern,
        sourceText: sourceText.trim(),
      });
    }
  };

  // Busca abrangente: 3 caracteres alfanuméricos, hífen/espaço opcional e 4 alfanuméricos
  const broadRegex = /[A-Z0-9]{3}[-\s]?[A-Z0-9]{4}/g;
  for (const match of upperText.matchAll(broadRegex)) {
    addCandidate(match[0], match[0]);
  }

  const compactText = upperText.replace(/[^A-Z0-9]/g, '');

  for (let index = 0; index <= compactText.length - 7; index += 1) {
    const slice = compactText.slice(index, index + 7);
    addCandidate(slice, slice);
  }

  return Array.from(candidates.values());
}
