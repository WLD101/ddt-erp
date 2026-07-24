import assert from "node:assert/strict";
import test from "node:test";
import { detectCallingCountry, normalizePhoneNumber, PhoneNumberError } from "@/modules/calls/phone";

test("normalizes Pakistan mobile numbers", () => {
  const result = normalizePhoneNumber("0300 1234567", "PK");
  assert.equal(result.e164, "+923001234567");
  assert.equal(result.countryCode, "PK");
  assert.equal(result.callingCode, "92");
  assert.equal(result.isValid, true);
});

test("normalizes Pakistan landlines", () => {
  const result = normalizePhoneNumber("021 34567890", "PK");
  assert.equal(result.e164, "+922134567890");
  assert.equal(result.countryCode, "PK");
});

test("normalizes US numbers", () => {
  const result = normalizePhoneNumber("(415) 555-2671", "US");
  assert.equal(result.e164, "+14155552671");
  assert.equal(result.countryCode, "US");
});

test("normalizes UK numbers", () => {
  const result = normalizePhoneNumber("020 7946 0018", "GB");
  assert.equal(result.e164, "+442079460018");
  assert.equal(result.countryCode, "GB");
});

test("does not treat Canadian NANP numbers as USA", () => {
  assert.throws(
    () => normalizePhoneNumber("+14165552671"),
    (error) => error instanceof PhoneNumberError && error.code === "UNSUPPORTED_COUNTRY"
  );
});

test("rejects malformed input", () => {
  assert.throws(
    () => normalizePhoneNumber("abc123", "PK"),
    (error) => error instanceof PhoneNumberError && error.code === "INVALID_PHONE_NUMBER"
  );
});

test("rejects ambiguous local input without default country", () => {
  assert.throws(
    () => normalizePhoneNumber("03001234567"),
    (error) => error instanceof PhoneNumberError && error.code === "AMBIGUOUS_PHONE_NUMBER"
  );
});

test("detects country from a valid E.164 number", () => {
  const detection = detectCallingCountry("+923001234567");
  assert.equal(detection.isoCode, "PK");
  assert.equal(detection.dialCode, "+92");
});
