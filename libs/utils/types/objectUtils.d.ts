type PathImpl<K extends string | number, V, TraversedTypes> = V extends
  | Primitive
  | BrowserNativeObject
  ? `${K}`
  : true extends AnyIsEqual<TraversedTypes, V>
    ? `${K}`
    : `${K}` | `${K}.${PathInternal<V, TraversedTypes | V>}`;
type PathInternal<T, TraversedTypes = T> =
  T extends ReadonlyArray<infer V>
    ? IsTuple<T> extends true
      ? {
          [K in TupleKeys<T>]-?: PathImpl<K & string, T[K], TraversedTypes>;
        }[TupleKeys<T>]
      : PathImpl<ArrayKey, V, TraversedTypes>
    : {
        [K in keyof T]-?: PathImpl<K & string, T[K], TraversedTypes>;
      }[keyof T];
type Path<T> = T extends any ? PathInternal<T> : never;

type FieldValue<TFieldValues extends FieldValues> = TFieldValues[InternalFieldName];
type FieldValues = Record<string, any>;
type FieldPath<TFieldValues extends FieldValues> = Path<TFieldValues>;

type FieldPathValue<
  TFieldValues extends FieldValues,
  TFieldPath extends FieldPath<TFieldValues>,
> = PathValue<TFieldValues, TFieldPath>;

type DeepReadonly<T> = T extends Primitive | BrowserNativeObject
  ? T
  : T extends ReadonlyArray<infer U>
    ? ReadonlyArray<DeepReadonly<U>>
    : T extends Array<infer U>
      ? ReadonlyArray<DeepReadonly<U>>
      : T extends Map<infer K, infer V>
        ? ReadonlyMap<DeepReadonly<K>, DeepReadonly<V>>
        : T extends Set<infer U>
          ? ReadonlySet<DeepReadonly<U>>
          : {
              readonly [K in keyof T]: DeepReadonly<T[K]>;
            };

export abstract class ObjectUtils {
  static firstNotNullValue<
    TFieldValues extends FieldValues = FieldValues,
    TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
  >(property: TName, ...args: TFieldValues[]): FieldPathValue<TFieldValues, TName>;

  static goTo<
    TFieldValues extends FieldValues = FieldValues,
    TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
    TType = FieldPathValue<TFieldValues, TName> | undefined,
  >(obj: TFieldValues, property: TName, defaultValue?: TType): TType;

  static deepFreeze<T extends object>(obj: T): DeepReadonly<T>;
  static deepAssign<T extends object, S extends object[]>(
    target: T,
    ...sources: S
  ): T & UnionToIntersection<S[number]>;

  static getMethodNames<T extends object>(obj: T): Array<keyof T>;
  static toBase64<T extends object>(str: T): string;
}
