/**
 * Base interface that all model entities should extend
 * Ensures only proper model types can be used in generic operations
 * like pagination, filtering, etc.
 */
export interface BaseModel {
  // Only key, value pairs are valid
  // Key must be a string while values can be any
  [key: string]: any;
}
