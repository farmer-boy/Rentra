# Account and property verification

The API uses `emailVerifiedAt` and `phoneVerifiedAt` for contact verification.
Email confirmation uses the existing account email token flow; a logged-in user
can request another link with `POST /api/auth/verify-email/request`.
`API_PUBLIC_URL` must point to the externally reachable API base, including
`/api`, in production. Local development defaults to
`http://localhost:3000/api`.

Phone confirmation sends a six-digit, ten-minute code through Twilio. Configure
`TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_PHONE_NUMBER`. Phone values
must be E.164 formatted. Codes are HMAC-hashed in the database, expire, allow at
most five attempts, and are single-use. Delivery is limited to three requests
per user in fifteen minutes.

Authenticated users submit identity or host details at
`POST /api/verification/submissions`. The evidence links must use HTTPS; the
links and submitted details are returned only by the admin-only detail route,
`GET /api/verification/admin/submissions/:id`. Store sensitive files in a
private document store and provide access-controlled links; the property-image
upload is public and must not be used for identity documents.
Both email and phone must already be verified before evidence can be submitted
or property approval can be granted.

Landlords submit a property using
`POST /api/verification/properties/:propertyId`. Administrators inspect the
pending queue at `GET /api/verification/admin/submissions`, open the protected
detail route, and approve/reject using
`PATCH /api/verification/admin/submissions/:id`:

```json
{
  "decision": "APPROVED",
  "reviewNotes": "Ownership and property evidence verified."
}
```

An administrator can revoke a prior approval with
`POST /api/verification/admin/submissions/:id/revoke` and a
`{"reviewNotes":"Reason for revocation"}` body. Revoking identity or host
approval removes Rentra Verified from the owner's approved properties.

Property approval is refused unless the owner has approved identity and host
submissions. The property `verificationStatus` is set to `APPROVED`; property
and listing responses derive `isRentraVerified` exclusively from that state.
Publication status and the legacy user `isVerified` flag cannot grant the
Rentra Verified badge. Editing material property/listing details revokes the
property approval and requires resubmission.

Example authenticated phone flow:

```http
POST /api/verification/phone/send
Authorization: Bearer <access-token>
```

```http
POST /api/verification/phone/confirm
Authorization: Bearer <access-token>
Content-Type: application/json

{"code":"123456"}
```

No migration reset is needed. Apply the generated additive Prisma migration
using the backend package's existing migrate workflow.
