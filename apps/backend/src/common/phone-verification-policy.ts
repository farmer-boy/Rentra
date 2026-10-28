/**
 * Phone verification is temporarily optional for tenant requests in local/test
 * environments. Production always enforces verification; tests can opt in with
 * REQUIRE_VERIFIED_PHONE_FOR_TENANT_REQUESTS=true.
 */
export function requiresVerifiedPhoneForTenantRequests(): boolean {
  return (
    process.env.NODE_ENV === 'production' ||
    process.env.REQUIRE_VERIFIED_PHONE_FOR_TENANT_REQUESTS === 'true'
  );
}
