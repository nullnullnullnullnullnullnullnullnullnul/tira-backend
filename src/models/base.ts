// Marker interface for model entities so they can participate in
// generics like PaginatedResult<T extends BaseModel>. Deliberately
// has no members: the previous `[key: string]: any` index signature
// collapsed every Omit<Model, K>['field'] to `any` through TypeScript's
// mapped-type machinery, which silently disabled strict null checks
// across the service and repository layers. Keeping this empty leaves
// the constraint in place without poisoning property access.
export interface BaseModel {}
