# WhatsQuery Google Demo Scenarios

## Preferred first scenario

### UK professional services appointment booking

Target flow:

1. caller requests an appointment
2. WhatsQuery checks Google Calendar availability
3. available slots are returned
4. caller confirms a time
5. event is created
6. contact is matched or created
7. Gmail draft or confirmation is produced according to permission
8. audit log and usage record are written

## Second safe scenario

### Pakistan wholesale enquiry to Google Sheets

Target flow:

1. caller identifies themselves
2. enquiry details are captured
3. a row is appended to the configured sheet
4. optional follow-up task or draft is created
5. the team receives a safe internal follow-up path

## Current status

These flows are documented and scaffolded in provider/action design, but not yet claimed as live real-provider demonstrations from this workstation.
