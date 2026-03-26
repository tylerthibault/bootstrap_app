import test from "node:test";
import assert from "node:assert/strict";

function canAttemptAuth(email, password) {
  return Boolean(String(email || "").trim() && String(password || "").trim());
}

function canLoadDashboard(apiBaseUrl, accessToken) {
  return Boolean(
    String(apiBaseUrl || "").trim() && String(accessToken || "").trim(),
  );
}

function canLogoutCurrent(apiBaseUrl, accessToken, refreshToken) {
  return Boolean(
    String(apiBaseUrl || "").trim() &&
    String(accessToken || "").trim() &&
    String(refreshToken || "").trim(),
  );
}

test("auth flow requires email and password", () => {
  assert.equal(canAttemptAuth("", "Passw0rd!"), false);
  assert.equal(canAttemptAuth("user@example.com", ""), false);
  assert.equal(canAttemptAuth("user@example.com", "Passw0rd!"), true);
});

test("dashboard flow requires API URL and access token", () => {
  assert.equal(canLoadDashboard("", "token"), false);
  assert.equal(canLoadDashboard("http://127.0.0.1:5299", ""), false);
  assert.equal(canLoadDashboard("http://127.0.0.1:5299", "token"), true);
});

test("logout-current action requires refresh token in addition to auth", () => {
  assert.equal(canLogoutCurrent("http://127.0.0.1:5299", "access", ""), false);
  assert.equal(
    canLogoutCurrent("http://127.0.0.1:5299", "access", "refresh"),
    true,
  );
});
