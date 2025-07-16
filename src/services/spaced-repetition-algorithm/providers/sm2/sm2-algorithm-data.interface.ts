/**
 * SM2 algorithm-specific data structure
 * Based on the SuperMemo 2 algorithm
 */
export interface SM2AlgorithmData {
  /** The ease factor, which determines how quickly the interval increases (min 1.3) */
  efactor: number;
  /** The number of times the item has been successfully recalled in a row */
  repetition: number;
}
