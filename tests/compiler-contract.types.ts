import { omitUndefinedProperties } from "../packages/engine/src/defined-properties";

interface RecordWithOptionalField {
  kind: "record";
  label?: string;
}
const valid: RecordWithOptionalField = omitUndefinedProperties({
  kind: "record",
  label: undefined as string | undefined,
});
// @ts-expect-error Absence is distinct from an explicitly undefined persisted field.
const invalid: RecordWithOptionalField = { kind: "record", label: undefined };
void valid;
void invalid;
