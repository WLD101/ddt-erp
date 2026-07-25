import assert from "node:assert/strict";
import test from "node:test";

import { normalizePakistanVoiceFixtureUtterance } from "@/modules/voice/erp/pk-language-fixtures";

const referenceDate = new Date("2026-07-25T00:00:00.000Z");

test("Pakistan mixed-language fixture normalizes order confirmation correctly", () => {
  const result = normalizePakistanVoiceFixtureUtterance({
    utterance: "Aap mera order confirm kar dein",
    referenceDate,
  });

  assert.equal(result.intent, "order_confirmation");
  assert.equal(result.customerConfirmed, true);
  assert.equal(result.paymentConfirmed, false);
});

test("Pakistan mixed-language fixture captures quantities from Roman Urdu and English order text", () => {
  const result = normalizePakistanVoiceFixtureUtterance({
    utterance: "Do zinger burgers aur one large fries",
    referenceDate,
  });

  assert.deepEqual(result.quantities, [
    { item: "zinger burger", quantity: 2 },
    { item: "large fries", quantity: 1 },
  ]);
  assert.equal(result.intent, "order_capture");
});

test("Pakistan mixed-language fixture extracts payment intent without marking payment paid", () => {
  const result = normalizePakistanVoiceFixtureUtterance({
    utterance: "JazzCash kar dunga",
    referenceDate,
  });

  assert.equal(result.intent, "payment_intent");
  assert.equal(result.paymentMethod, "jazzcash");
  assert.equal(result.paymentConfirmed, false);
});

test("Pakistan mixed-language fixture normalizes booking date and time", () => {
  const result = normalizePakistanVoiceFixtureUtterance({
    utterance: "Kal shaam 7 baje booking chahiye",
    referenceDate,
  });

  assert.equal(result.intent, "booking_request");
  assert.equal(result.requestedDate, "2026-07-26");
  assert.equal(result.requestedTime24h, "19:00");
});

test("Pakistan mixed-language fixture captures address and online payment intent safely", () => {
  const addressResult = normalizePakistanVoiceFixtureUtterance({
    utterance: "Address Susan Road Faisalabad hai",
    referenceDate,
  });
  const paymentResult = normalizePakistanVoiceFixtureUtterance({
    utterance: "Payment online karni hai lekin abhi nahi ki",
    referenceDate,
  });

  assert.equal(addressResult.intent, "address_capture");
  assert.equal(addressResult.address, "susan road faisalabad");
  assert.equal(paymentResult.intent, "payment_intent");
  assert.equal(paymentResult.paymentMethod, "online");
  assert.equal(paymentResult.paymentConfirmed, false);
});
