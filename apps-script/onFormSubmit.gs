/**
 * Roscommon House Met Gala 2026 — Google Form → Apps Script → Ticketing backend.
 *
 * SETUP
 * 1. Open the Google Sheet linked to the Form → Extensions → Apps Script.
 * 2. Paste this file, then fill in CONFIG below.
 * 3. Triggers (clock icon) → Add Trigger:
 *      Function: onFormSubmit   Event source: From spreadsheet   Type: On form submit
 * 4. Run `testPing` once to authorise the script and confirm the endpoint answers.
 *
 * This script does NO business logic: it only forwards the submission.
 * Never put Supabase credentials here.
 */
const CONFIG = {
  // Published backend URL + webhook path.
  API_URL: "YOUR_BACKEND_WEBHOOK_URL", // e.g. https://your-app.lovable.app/api/public/integrations/google-form
  WEBHOOK_SECRET: "YOUR_WEBHOOK_SECRET", // value of GOOGLE_FORM_WEBHOOK_SECRET
};

/**
 * Map your Google Form question titles (exactly as they appear) to API fields.
 * Matching is case-insensitive and ignores punctuation.
 */
const FIELD_MAP = {
  firstName: ["first name", "name", "first names"],
  surname: ["surname", "last name", "family name"],
  studentNumber: ["student number", "student no", "uct student number"],
  dietaryRequirement: ["dietary requirement", "dietary requirements", "dietary info", "dietary"],
  email: ["email address", "email"],
};

function normaliseKey(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function pick(answers, candidates) {
  for (var i = 0; i < candidates.length; i++) {
    var key = normaliseKey(candidates[i]);
    if (answers[key] !== undefined && String(answers[key]).trim() !== "") return String(answers[key]).trim();
  }
  return "";
}

function onFormSubmit(e) {
  var answers = {};
  var submissionId = "";

  if (e && e.namedValues) {
    // Spreadsheet "On form submit" trigger.
    Object.keys(e.namedValues).forEach(function (title) {
      answers[normaliseKey(title)] = (e.namedValues[title] || [])[0] || "";
    });
    submissionId = e.range ? "row-" + e.range.getRow() : "";
  } else if (e && e.response) {
    // Form "On form submit" trigger.
    var items = e.response.getItemResponses();
    for (var i = 0; i < items.length; i++) {
      answers[normaliseKey(items[i].getItem().getTitle())] = items[i].getResponse();
    }
    submissionId = e.response.getId();
  } else {
    Logger.log("No submission payload — aborting.");
    return;
  }

  var payload = {
    firstName: pick(answers, FIELD_MAP.firstName),
    surname: pick(answers, FIELD_MAP.surname),
    studentNumber: pick(answers, FIELD_MAP.studentNumber),
    dietaryRequirement: pick(answers, FIELD_MAP.dietaryRequirement) || null,
    formSubmissionId: submissionId || null,
    source: "google_forms",
  };

  // Email is derived server-side from the student number; only send it if the form collected one.
  var email = pick(answers, FIELD_MAP.email);
  if (email) payload.email = email;

  if (!payload.firstName || !payload.surname || !payload.studentNumber) {
    Logger.log("Missing required fields, not sending: " + JSON.stringify(payload));
    return;
  }

  postToBackend(payload);
}

function postToBackend(payload) {
  var attempts = 0;
  var lastError = "";

  while (attempts < 3) {
    attempts++;
    try {
      var response = UrlFetchApp.fetch(CONFIG.API_URL, {
        method: "post",
        contentType: "application/json",
        headers: { "X-Webhook-Secret": CONFIG.WEBHOOK_SECRET },
        payload: JSON.stringify(payload),
        muteHttpExceptions: true,
      });
      var code = response.getResponseCode();
      Logger.log("Backend responded " + code + ": " + response.getContentText());
      if (code >= 200 && code < 300) return;
      if (code === 400 || code === 401) return; // permanent failure, retrying will not help
      lastError = code + " " + response.getContentText();
    } catch (err) {
      lastError = String(err);
    }
    Utilities.sleep(1000 * attempts);
  }

  Logger.log("Failed after retries: " + lastError);
}

/** Manual smoke test — sends a fake attendee. Delete the row afterwards if it succeeds. */
function testPing() {
  postToBackend({
    firstName: "Test",
    surname: "Attendee",
    studentNumber: "TSTATT001",
    dietaryRequirement: "None",
    formSubmissionId: "apps-script-test-1",
    source: "google_forms",
  });
}
