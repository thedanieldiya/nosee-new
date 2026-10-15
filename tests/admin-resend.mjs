import assert from "node:assert/strict";
import test from "node:test";
import { randomBytes, randomUUID } from "node:crypto";
import { resendInvitationTransport } from "../src/lib/admin/resend-mail.ts";
import { invitationTransport } from "../src/lib/admin/invitation-mail.ts";
import { renderInvitationEmail } from "../src/lib/admin/invitation-email.ts";

const environment = { RESEND_API_KEY: `re_${randomBytes(24).toString("base64url")}`, ADMIN_INVITATION_FROM: "administration@example.invalid", ADMIN_ORIGIN: "https://preview.example.invalid" };
const code = randomBytes(32).toString("base64url");
const mail = { ...renderInvitationEmail({ firstName: "Recipient", inviterName: "Reviewer", role: "editor", code, origin: environment.ADMIN_ORIGIN }), to: "recipient@example.invalid" };
const options = () => ({ signal: new AbortController().signal, idempotencyKey: randomUUID() });
const accepted = id => Response.json({ id });

test("missing or malformed mail configuration fails closed without calling a provider", () => {
  let calls = 0;
  const request = async () => { calls++; throw new Error("No network is permitted."); };
  for (const config of [{}, { ...environment, RESEND_API_KEY: "" }, { ...environment, RESEND_API_KEY: "bad\r\nkey" }, { ...environment, RESEND_API_KEY: "x".repeat(513) }, { ...environment, ADMIN_INVITATION_FROM: "" }, { ...environment, ADMIN_INVITATION_FROM: "NOSEE <sender@example.invalid>" }, { ...environment, ADMIN_INVITATION_FROM: "bad\r\nBcc: other@example.invalid" }, { ...environment, ADMIN_ORIGIN: "http://example.invalid" }, { ...environment, ADMIN_ORIGIN: "https://example.invalid/path" }]) assert.equal(resendInvitationTransport(config, request), null);
  assert.equal(calls, 0);
});

test("production factory uses server-only configuration and remains unavailable with no mail key", t => {
  const names = ["RESEND_API_KEY", "ADMIN_INVITATION_FROM", "ADMIN_ORIGIN"], saved = names.map(name => process.env[name]);
  t.after(() => names.forEach((name, i) => { if (saved[i] === undefined) delete process.env[name]; else process.env[name] = saved[i]; }));
  names.forEach(name => delete process.env[name]);
  assert.equal(invitationTransport(), null);
  Object.assign(process.env, environment);
  assert.equal(typeof invitationTransport()?.send, "function");
});

test("acceptance uses the fixed HTTPS API, safe sender, unchanged HTML/text and attempt idempotency header", async () => {
  const id = "email_accepted-123", attempt = options(); let calls = 0;
  const transport = resendInvitationTransport(environment, async (url, init) => {
    calls++;
    assert.equal(url, "https://api.resend.com/emails"); assert.equal(init.method, "POST"); assert.equal(init.redirect, "error"); assert.equal(init.cache, "no-store");
    const headers = new Headers(init.headers), body = JSON.parse(init.body);
    assert.ok(headers.get("authorization") === `Bearer ${environment.RESEND_API_KEY}`);
    assert.equal(headers.get("content-type"), "application/json"); assert.equal(headers.get("idempotency-key"), `nosee-admin-invitation/${attempt.idempotencyKey}`);
    assert.equal(body.from, "NOSEE <administration@example.invalid>"); assert.deepEqual(body.to, [mail.to]);
    for (const field of ["subject", "html", "text"]) assert.ok(body[field] === mail[field], `${field} must be preserved`);
    assert.equal(Object.keys(body).length, 5); assert.equal(init.signal.aborted, false);
    assert.equal(url.includes(code) || JSON.stringify(init.headers).includes(code), false);
    return accepted(id);
  });
  assert.deepEqual(await transport.send(mail, attempt), { status: "accepted", messageId: id }); assert.equal(calls, 1);
});

test("same-attempt replay has a stable key/body; explicit reissue has a new key", async () => {
  const cache = new Map(), headers = []; let acceptedMessages = 0;
  const transport = resendInvitationTransport(environment, async (_url, init) => {
    const key = new Headers(init.headers).get("idempotency-key"); headers.push(key);
    if (!cache.has(key)) { cache.set(key, { body: init.body, id: randomUUID() }); acceptedMessages++; }
    assert.ok(cache.get(key).body === init.body); return accepted(cache.get(key).id);
  });
  const attempt = options(), first = await transport.send(mail, attempt), replay = await transport.send(mail, attempt);
  assert.deepEqual(replay, first); assert.equal(acceptedMessages, 1);
  await transport.send({ ...mail, text: mail.text.replace(code, randomBytes(32).toString("base64url")) }, options());
  assert.equal(acceptedMessages, 2); assert.equal(headers[0], headers[1]); assert.notEqual(headers[1], headers[2]);
});

test("explicit HTTP rejections and rate limits are failed once, without logging or returning provider bodies", async t => {
  let calls = 0; const logs = [];
  for (const method of ["log", "warn", "error"]) t.mock.method(console, method, (...args) => logs.push(args));
  for (const status of [400, 401, 403, 404, 405, 413, 415, 422, 429]) {
    const transport = resendInvitationTransport(environment, async () => { calls++; return Response.json({ name: "provider_error", message: `${code} ${environment.RESEND_API_KEY}` }, { status, headers: { "Retry-After": "60" } }); });
    assert.deepEqual(await transport.send(mail, options()), { status: "failed" });
  }
  assert.equal(calls, 9); assert.equal(logs.length, 0);
});

test("server errors, request timeout and idempotency conflicts stay unconfirmed without automatic retries", async () => {
  for (const status of [302, 408, 409, 500, 502, 503, 504]) {
    let calls = 0;
    const transport = resendInvitationTransport(environment, async () => { calls++; return new Response("untrusted provider details", { status }); });
    assert.deepEqual(await transport.send(mail, options()), { status: "unconfirmed" }); assert.equal(calls, 1);
  }
});

test("unexpected, malformed or secret-reflecting success responses never become acceptance", async () => {
  for (const body of [{}, { id: null }, { id: "" }, { id: "x".repeat(201) }, { id: "bad\r\nvalue" }, { id: code }, { id: environment.RESEND_API_KEY }, { error: "not sent" }]) {
    const transport = resendInvitationTransport(environment, async () => Response.json(body));
    assert.deepEqual(await transport.send(mail, options()), { status: "unconfirmed" });
  }
  for (const response of [new Response("not JSON"), new Response(null, { status: 204 }), Response.json({ id: randomUUID() }, { status: 202 })]) assert.deepEqual(await resendInvitationTransport(environment, async () => response).send(mail, options()), { status: "unconfirmed" });
});

test("network errors and caller aborts remain private and uncertain", async () => {
  const transport = resendInvitationTransport(environment, async () => { throw new Error(`${code} ${environment.RESEND_API_KEY}`); });
  assert.deepEqual(await transport.send(mail, options()), { status: "unconfirmed" });
  let calls = 0; const attempt = options(); attempt.signal = AbortSignal.abort();
  assert.deepEqual(await resendInvitationTransport(environment, async () => { calls++; return accepted(randomUUID()); }).send(mail, attempt), { status: "unconfirmed" }); assert.equal(calls, 0);
});

test("the independent eight-second deadline aborts an outstanding provider request", async t => {
  const deadline = new AbortController();
  t.mock.method(AbortSignal, "timeout", ms => { assert.equal(ms, 8000); return deadline.signal; });
  let started;
  const ready = new Promise(resolve => { started = resolve; });
  const transport = resendInvitationTransport(environment, async (_url, init) => new Promise((_resolve, reject) => {
    init.signal.addEventListener("abort", () => reject(init.signal.reason), { once: true }); started();
  }));
  const pending = transport.send(mail, options()); await ready; deadline.abort();
  assert.deepEqual(await pending, { status: "unconfirmed" });
});

test("caller cancellation propagates to an already-running request", async () => {
  const controller = new AbortController(); let started;
  const ready = new Promise(resolve => { started = resolve; });
  const transport = resendInvitationTransport(environment, async (_url, init) => new Promise((_resolve, reject) => { init.signal.addEventListener("abort", () => reject(init.signal.reason), { once: true }); started(); }));
  const pending = transport.send(mail, { ...options(), signal: controller.signal }); await ready; controller.abort();
  assert.deepEqual(await pending, { status: "unconfirmed" });
});

test("cancellation during response decoding cannot claim acceptance", async () => {
  const controller = new AbortController();
  const transport = resendInvitationTransport(environment, async () => ({ status: 200, json: async () => { controller.abort(); return { id: randomUUID() }; } }));
  assert.deepEqual(await transport.send(mail, { ...options(), signal: controller.signal }), { status: "unconfirmed" });
});

test("malformed or secret-bearing idempotency input fails before a network request", async () => {
  let calls = 0; const transport = resendInvitationTransport(environment, async () => { calls++; return accepted(randomUUID()); });
  for (const key of ["", code, environment.RESEND_API_KEY, "bad\r\nheader"]) assert.deepEqual(await transport.send(mail, { ...options(), idempotencyKey: key }), { status: "failed" });
  assert.equal(calls, 0);
});
