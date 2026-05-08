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

export function extractPlateCandidates(ocrText: string): LicensePlateCandidate[] {
  const upperText = ocrText
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();
  const candidates = new Map<string, LicensePlateCandidate>();

  const addCandidate = (rawValue: string, sourceText: string) => {
    const validation = validatePlate(rawValue);

    if (validation.isValid && validation.pattern) {
      candidates.set(validation.plate, {
        plate: validation.plate,
        pattern: validation.pattern,
        sourceText: sourceText.trim(),
      });
    }
  };

  for (const match of upperText.matchAll(DIRECT_PLATE_REGEX)) {
    addCandidate(match[0], match[0]);
  }

  const compactText = upperText.replace(/[^A-Z0-9]/g, '');

  for (let index = 0; index <= compactText.length - 7; index += 1) {
    const slice = compactText.slice(index, index + 7);
    addCandidate(slice, slice);
  }

  return Array.from(candidates.values());
}
