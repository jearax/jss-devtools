---
id: 0049
title: The Nest preset answers every JSON response as { status, message, data }, in the request's language
status: Accepted
date: 2026-11-13
supersedes: none
---

# 0049: The Nest preset answers every JSON response as { status, message, data }, in the request's language

## Context

[0047](./0047-init-nest-preset.md) set the Nest app's modules but no response contract. The user's
reference template wraps success and error alike, with an interceptor and a catch-all filter; its
filter drops the field list of Nest 12's validation errors, and its interceptor wraps file
downloads. RFC 9457 (`application/problem+json`) was weighed: none of its members is required, so
it adds nothing the user's three fields lack for a first-party frontend.

## Decision

Every JSON response of the generated app, success and error, is `{ status, message, data }`, with
`status` equal to the HTTP status. `message` is translated per request: `?lang=`, then `x-lang`,
then `Accept-Language`, else `en`. A validation error puts `{ path, code, message }` per field in
`data`. An exception's message is an i18n key; text that is no catalog key, Nest's own messages
and any 5xx detail never reach the client. Files and server-sent events pass through unwrapped.

> "A, giữ status, message, data" (user, 2026-11-13)

> "Viết lại code cho adapter, chuẩn, đúng, best practice dùm tôi nhé." · "còn việc xử lý i18n
> bên trong nữa nha, kiểu lấy lang từ request á." (user, 2026-11-13)

## Options considered

| Option                                          | Consequence                                             |
| ----------------------------------------------- | ------------------------------------------------------- |
| `{ status, message, data }` everywhere (chosen) | One shape the user's frontends already read             |
| RFC 9457 errors, same success envelope          | Generic tooling reads errors; two shapes for one client |
| RFC 9457 errors, unwrapped success              | Closest to the standard; every frontend changes         |

## Consequences

- Easier: one shape to parse; a frontend branches on `data[].code`, never on translated text.
- Harder: a handler throws `new NotFoundException('users.notFound')` with a catalog key, not free
  text. A malformed JSON body is parsed before the i18n middleware, so it reads `en`.
- Enforced by: `templates/nest/test/response.e2e-spec.ts` and `templates/nest/test/app.e2e-spec.ts`.
