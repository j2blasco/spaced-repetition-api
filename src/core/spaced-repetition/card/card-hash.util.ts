import { createHash } from 'crypto';

export interface CardHashData {
  readonly userId: string;
  readonly data: Record<string, unknown>;
  readonly tags?: readonly string[];
}

export function generateCardDataHash(cardData: CardHashData): string {
  const sortedData = sortObjectDeep(cardData.data);
  const sortedTags = cardData.tags ? [...cardData.tags].sort() : [];
  
  const hashInput = JSON.stringify({
    userId: cardData.userId,
    data: sortedData,
    tags: sortedTags,
  });
  
  return createHash('sha256').update(hashInput).digest('hex');
}

function sortObjectDeep(obj: Record<string, unknown>): Record<string, unknown> {
  if (obj === null || typeof obj !== 'object') {
    return obj as Record<string, unknown>;
  }
  
  if (Array.isArray(obj)) {
    return obj.map((item) => 
      typeof item === 'object' && item !== null ? sortObjectDeep(item as Record<string, unknown>) : item
    ) as unknown as Record<string, unknown>;
  }
  
  const sortedKeys = Object.keys(obj).sort();
  const sorted: Record<string, unknown> = {};
  
  for (const key of sortedKeys) {
    const value = obj[key];
    if (value !== undefined) {
      sorted[key] = typeof value === 'object' && value !== null && !Array.isArray(value)
        ? sortObjectDeep(value as Record<string, unknown>)
        : value;
    }
  }
  
  return sorted;
}