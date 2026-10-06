export type DefinedProperties<T extends object> = {
  [K in keyof T as undefined extends T[K] ? never : K]: T[K];
} & {
  [K in keyof T as undefined extends T[K] ? K : never]?: Exclude<T[K], undefined>;
};

/** Omit absent fields when constructing records or forwarding optional props. */
export function omitUndefinedProperties<const T extends object>(value: T): DefinedProperties<T> {
  return Object.fromEntries(
    Object.entries(value).filter(([, property]) => property !== undefined),
  ) as DefinedProperties<T>;
}
