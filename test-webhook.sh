#!/bin/bash
source .env.production
SECRET=$VAPI_WEBHOOK_SECRET
URL="https://voice.whatsquery.com/api/voice/vapi/webhook"

echo "Testing unauthenticated..."
curl -s -X POST -H "Content-Type: application/json" -d '{"message":{"type":"status-update","status":"queued"}}' $URL

echo -e "\nTesting authenticated status-update..."
curl -s -X POST -H "Content-Type: application/json" -H "x-vapi-secret: $SECRET" -d '{"message":{"type":"status-update","status":"ringing","call":{"id":"call_123","assistantId":"assist_123","customer":{"number":"+1234567890"}}}}' $URL

echo -e "\nTesting capture_lead..."
curl -s -X POST -H "Content-Type: application/json" -H "x-vapi-secret: $SECRET" -d '{"message":{"type":"tool-calls","call":{"id":"call_123","assistantId":"assist_123"},"toolWithToolCallList":[{"id":"tc_1","function":{"name":"capture_lead","arguments":{"name":"Test Lead","phone":"+1234","intent":"Inquiry"}}}]}}' $URL

echo -e "\nTesting request_appointment..."
curl -s -X POST -H "Content-Type: application/json" -H "x-vapi-secret: $SECRET" -d '{"message":{"type":"tool-calls","call":{"id":"call_123","assistantId":"assist_123"},"toolWithToolCallList":[{"id":"tc_2","function":{"name":"request_appointment","arguments":{"name":"Test Guest","phone":"+1234","datetime":"2026-06-10T19:00:00Z","partySize":2}}}]}}' $URL

echo -e "\nTesting create_order_request..."
curl -s -X POST -H "Content-Type: application/json" -H "x-vapi-secret: $SECRET" -d '{"message":{"type":"tool-calls","call":{"id":"call_123","assistantId":"assist_123"},"toolWithToolCallList":[{"id":"tc_3","function":{"name":"create_order_request","arguments":{"customerName":"Test Order","items":[{"name":"Pizza","quantity":1}],"deliveryType":"pickup"}}}]}}' $URL

echo -e "\nTesting end-of-call-report..."
curl -s -X POST -H "Content-Type: application/json" -H "x-vapi-secret: $SECRET" -d '{"message":{"type":"end-of-call-report","call":{"id":"call_123","assistantId":"assist_123","status":"completed","endedReason":"customer-ended","cost":0.10,"startedAt":"2026-06-05T00:00:00.000Z","endedAt":"2026-06-05T00:01:00.000Z"},"recordingUrl":"https://example.com/audio.wav","transcript":"Hello world"}}' $URL
