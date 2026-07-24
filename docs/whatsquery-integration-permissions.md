# WhatsQuery Integration Permissions

## Evaluation order

Permission evaluation currently considers:

1. provider status
2. feature enablement
3. plan allowance
4. connection readiness
5. request source
6. required industry capabilities
7. required provider scopes
8. explicit permission rules
9. action sensitivity and approval policy

## Rule subjects

- tenant
- role
- user
- voice agent

## Effects

- `allow`
- `deny`
- `approval_required`

## Key behavior

- low-risk actions can proceed when the provider, connection, request source, and scopes are valid
- high-risk and restricted actions require approval unless a safer future policy layer explicitly changes that behavior
- deny rules always win
- voice tools are filtered through the same rules before exposure
