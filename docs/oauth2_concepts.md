# OAuth 2.1 + OpenID Connect — Long-Term Notes

Designed for quick recall years later. Minimal. Protocol-level truth.

---

## OAuth 2.1
**Purpose**
- Delegated authorization
- Access ≠ identity

**Actors**
- Client
- Authorization Server
- Resource Server
- User (Resource Owner)

**Credentials / Tokens**
- Authorization Code → short-lived, one-time
- Access Token → API access
- Refresh Token → new access tokens

---

## Channels
- **Front channel**
  - Browser redirects only
  - URL parameters
  - Never carries tokens
- **Back channel**
  - HTTPS POST
  - Token endpoint
  - Carries secrets and tokens

Rule:
**Redirects are untrusted. POSTs are trusted.**

---

## Authorization Code Flow (with PKCE)
1. Client generates:
   - `state`
   - `code_verifier`
2. Redirect to authorization server with:
   - `client_id`
   - `redirect_uri`
   - `scope`
   - `state`
   - `code_challenge`
3. User authenticates
4. Redirect back with:
   - `authorization_code`
   - `state`
5. Client POSTs to `/token`:
   - `authorization_code`
