import assert from "node:assert/strict";
import test from "node:test";

import { parseVoiceErpAutomationConfig } from "@/modules/voice/erp/automation-config";
import { assessVoiceOrderConversion } from "@/modules/voice/erp/order-conversion";
import { assessVoiceBookingConversion } from "@/modules/voice/erp/booking-conversion";
import { assessVoicePaymentConversion } from "@/modules/voice/erp/payment-conversion";
import { buildVoiceErpIdempotencyKey } from "@/modules/voice/erp/outcome-links";

test("automation config defaults to safe review-only and disabled financial modes", () => {
  const config = parseVoiceErpAutomationConfig(null);
  assert.equal(config.voiceOrderAutomationEnabled, false);
  assert.equal(config.voiceOrderAutomationMode, "review_only");
  assert.equal(config.voiceInvoiceAutomationEnabled, false);
  assert.equal(config.voiceAccountingAutomationMode, "disabled");
});

test("order conversion stays blocked without confirmed catalog items", () => {
  const readiness = assessVoiceOrderConversion({
    automation: parseVoiceErpAutomationConfig(null),
    orderDetailsText: "2 burgers for pickup",
    confirmedCatalogItems: null,
    approvalGranted: false,
  });

  assert.equal(readiness.status, "needs_information");
});

test("order conversion still requires staff approval while automation is off", () => {
  const readiness = assessVoiceOrderConversion({
    automation: parseVoiceErpAutomationConfig(JSON.stringify({
      voiceOrderAutomationEnabled: false,
      voiceOrderAutomationMode: "review_only",
    })),
    orderDetailsText: "2 burgers for pickup",
    confirmedCatalogItems: [{ productId: "prod-1", quantity: 2 }],
    approvalGranted: false,
  });

  assert.equal(readiness.status, "needs_staff_review");
});

test("booking conversion needs normalized time and customer identity", () => {
  const missing = assessVoiceBookingConversion({
    automation: parseVoiceErpAutomationConfig(null),
    requestedTime: null,
    customerName: null,
    approvalGranted: false,
  });

  assert.equal(missing.status, "needs_information");
});

test("payment conversion refuses unconfirmed settlement and unknown methods", () => {
  const wrongMethod = assessVoicePaymentConversion({
    automation: parseVoiceErpAutomationConfig(JSON.stringify({
      voicePaymentAutomationEnabled: true,
      voicePaymentAutomationMode: "after_caller_confirmation",
    })),
    marketKey: "pk",
    paymentMethod: "crypto",
    paymentConfirmed: true,
  });
  const unpaid = assessVoicePaymentConversion({
    automation: parseVoiceErpAutomationConfig(JSON.stringify({
      voicePaymentAutomationEnabled: true,
      voicePaymentAutomationMode: "after_caller_confirmation",
    })),
    marketKey: "pk",
    paymentMethod: "cash",
    paymentConfirmed: false,
  });

  assert.equal(wrongMethod.status, "needs_information");
  assert.equal(unpaid.status, "needs_staff_review");
});

test("voice ERP idempotency keys are deterministic and tenant-scoped", () => {
  const left = buildVoiceErpIdempotencyKey({
    organizationId: "org-a",
    branchId: "branch-1",
    providerCallId: "call-1",
    requestId: "req-1",
    outcomeType: "order",
  });
  const right = buildVoiceErpIdempotencyKey({
    organizationId: "org-a",
    branchId: "branch-1",
    providerCallId: "call-1",
    requestId: "req-1",
    outcomeType: "order",
  });

  assert.equal(left, right);
  assert.match(left, /^voice-erp:order:org-a:branch-1:call-1:req-1$/);
});
