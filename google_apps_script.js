// ════════════════════════════════════════════════════════════════
//   AURA BEAUTY STUDIO — Google Apps Script
//   Handles form submissions → saves to Google Sheet + sends email
// ════════════════════════════════════════════════════════════════
//
//  ── HOW TO SET UP (step-by-step, ~10 minutes) ──────────────────
//
//  STEP 1 ▸ Create a Google Sheet
//    • Go to https://sheets.google.com → New spreadsheet
//    • Name it: "Aura Beauty Studio – Queries"
//    • Copy the Sheet ID from the URL:
//        https://docs.google.com/spreadsheets/d/  <<<THIS_PART>>>  /edit
//    • Paste it into SHEET_ID below
//
//  STEP 2 ▸ Open Apps Script
//    • In the Sheet, click Extensions → Apps Script
//    • Delete all existing code and paste THIS entire file
//
//  STEP 3 ▸ Fill in your config values below
//
//  STEP 4 ▸ Deploy as Web App
//    • Click Deploy → New deployment
//    • Type: Web app
//    • Execute as: Me
//    • Who has access: Anyone
//    • Click Deploy → Copy the Web App URL
//
//  STEP 5 ▸ Paste the URL in your website
//    • Open beauty_studio.html
//    • Find: const APPS_SCRIPT_URL = 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE';
//    • Replace with your copied URL
//
//  STEP 6 ▸ Authorise the script
//    • Run the function setupSheet() once from the editor
//    • Click "Review permissions" → Allow
//
// ────────────────────────────────────────────────────────────────

// ── YOUR CONFIG ─────────────────────────────────────────────────

const CONFIG = {
  // Google Sheet ID (from the URL of your spreadsheet)
  SHEET_ID: 'YOUR_GOOGLE_SHEET_ID_HERE',

  // Sheet tab name (leave as-is or rename your tab)
  SHEET_NAME: 'Queries',

  // Your email address — you'll receive notifications here
  NOTIFY_EMAIL: 'your@email.com',

  // Studio name shown in emails
  STUDIO_NAME: 'Aura Beauty Studio',

  // Optional: also send a confirmation email to the customer?
  SEND_CUSTOMER_REPLY: true,
};

// ────────────────────────────────────────────────────────────────


/**
 * Handles POST requests from the website form.
 * Called automatically when a form is submitted.
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    saveToSheet(data);
    sendOwnerNotification(data);
    if (CONFIG.SEND_CUSTOMER_REPLY && data.email) {
      sendCustomerConfirmation(data);
    }
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Handles GET requests (useful for testing the endpoint is live).
 */
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'Aura Beauty Studio API is live ✦' }))
    .setMimeType(ContentService.MimeType.JSON);
}


// ── SAVE TO GOOGLE SHEET ─────────────────────────────────────────

function saveToSheet(data) {
  const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
  let sheet = ss.getSheetByName(CONFIG.SHEET_NAME);

  // Create the sheet tab if it doesn't exist yet
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.SHEET_NAME);
    // Add header row
    sheet.appendRow([
      '📅 Timestamp',
      '👤 Name',
      '📞 Phone',
      '✉ Email',
      '💄 Service',
      '📆 Appt. Date',
      '💬 Message',
      '🔖 Status'
    ]);
    // Style the header row
    const headerRange = sheet.getRange(1, 1, 1, 8);
    headerRange.setBackground('#1a0f0a');
    headerRange.setFontColor('#C9A96E');
    headerRange.setFontWeight('bold');
    headerRange.setFontSize(11);
    sheet.setFrozenRows(1);
    sheet.setColumnWidths(1, 8, 160);
    sheet.setColumnWidth(7, 280); // wider message column
  }

  // Append the new query row
  sheet.appendRow([
    data.timestamp || new Date().toLocaleString('en-IN'),
    data.name    || '',
    data.phone   || '',
    data.email   || '',
    data.service || '',
    data.date    || '',
    data.message || '',
    'New ★'       // default status — you can change to Contacted / Booked etc.
  ]);

  // Highlight new row in light gold
  const lastRow = sheet.getLastRow();
  sheet.getRange(lastRow, 1, 1, 8).setBackground('#fdf6e8');
}


// ── OWNER EMAIL NOTIFICATION ─────────────────────────────────────

function sendOwnerNotification(data) {
  const subject = `✦ New Query — ${data.service || 'Beauty Service'} | ${data.name}`;

  const htmlBody = `
  <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; border: 1px solid #e8d5b0; border-radius: 4px; overflow: hidden;">
    <!-- Header -->
    <div style="background: #1a0f0a; padding: 28px 32px; text-align: center;">
      <h1 style="color: #C9A96E; font-size: 22px; font-weight: 300; margin: 0; letter-spacing: 2px;">
        ✦ AURA BEAUTY STUDIO
      </h1>
      <p style="color: rgba(255,255,255,0.5); font-size: 11px; letter-spacing: 4px; margin: 6px 0 0; text-transform: uppercase;">
        New Query Received
      </p>
    </div>

    <!-- Alert badge -->
    <div style="background: #C9A96E; padding: 12px 32px; text-align: center;">
      <p style="color: #fff; font-size: 13px; margin: 0; letter-spacing: 1px;">
        📋 A new client has submitted a query on your website
      </p>
    </div>

    <!-- Details -->
    <div style="padding: 32px; background: #fdf8f4;">
      <table style="width:100%; border-collapse: collapse; font-size: 14px;">
        <tr>
          <td style="padding: 10px 0; color: #8a6e62; width: 130px; vertical-align: top;">👤 Name</td>
          <td style="padding: 10px 0; color: #1a0f0a; font-weight: bold;">${data.name || '—'}</td>
        </tr>
        <tr style="border-top: 1px solid #f0e6dc;">
          <td style="padding: 10px 0; color: #8a6e62; vertical-align: top;">📞 Phone</td>
          <td style="padding: 10px 0; color: #1a0f0a;">
            <a href="tel:${data.phone}" style="color: #C9A96E; text-decoration: none;">${data.phone || '—'}</a>
          </td>
        </tr>
        <tr style="border-top: 1px solid #f0e6dc;">
          <td style="padding: 10px 0; color: #8a6e62; vertical-align: top;">✉ Email</td>
          <td style="padding: 10px 0; color: #1a0f0a;">
            ${data.email ? `<a href="mailto:${data.email}" style="color: #C9A96E; text-decoration: none;">${data.email}</a>` : '—'}
          </td>
        </tr>
        <tr style="border-top: 1px solid #f0e6dc;">
          <td style="padding: 10px 0; color: #8a6e62; vertical-align: top;">💄 Service</td>
          <td style="padding: 10px 0; color: #1a0f0a; font-weight: bold;">${data.service || '—'}</td>
        </tr>
        <tr style="border-top: 1px solid #f0e6dc;">
          <td style="padding: 10px 0; color: #8a6e62; vertical-align: top;">📆 Preferred Date</td>
          <td style="padding: 10px 0; color: #1a0f0a;">${data.date || 'Not specified'}</td>
        </tr>
        <tr style="border-top: 1px solid #f0e6dc;">
          <td style="padding: 10px 0; color: #8a6e62; vertical-align: top;">💬 Message</td>
          <td style="padding: 10px 0; color: #3d2b1f; line-height: 1.6;">${data.message || 'No message provided'}</td>
        </tr>
        <tr style="border-top: 1px solid #f0e6dc;">
          <td style="padding: 10px 0; color: #8a6e62; vertical-align: top;">🕐 Received At</td>
          <td style="padding: 10px 0; color: #8a6e62; font-size: 12px;">${data.timestamp || new Date().toLocaleString()}</td>
        </tr>
      </table>
    </div>

    <!-- Quick Actions -->
    <div style="padding: 20px 32px; background: #fff; border-top: 1px solid #f0e6dc; text-align: center;">
      <p style="color: #8a6e62; font-size: 12px; margin: 0 0 14px; letter-spacing: 1px; text-transform: uppercase;">Quick Actions</p>
      <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
        ${data.phone ? `
        <a href="https://wa.me/${data.phone.replace(/[^0-9]/g, '')}?text=Hi%20${encodeURIComponent(data.name)}%2C%20thank%20you%20for%20reaching%20out%20to%20Aura%20Beauty%20Studio!%20We'd%20love%20to%20help%20you%20with%20${encodeURIComponent(data.service || 'your query')}."
           style="background:#25D366; color:#fff; padding: 10px 20px; text-decoration:none; font-size:13px; border-radius:2px; display:inline-block; margin:4px;">
          💬 Reply on WhatsApp
        </a>
        <a href="tel:${data.phone}"
           style="background:#1a0f0a; color:#C9A96E; padding: 10px 20px; text-decoration:none; font-size:13px; border-radius:2px; display:inline-block; margin:4px;">
          📞 Call Client
        </a>` : ''}
        ${data.email ? `
        <a href="mailto:${data.email}?subject=Re: Your query at Aura Beauty Studio&body=Hi ${data.name},%0D%0A%0D%0AThank you for reaching out to us!%0D%0A"
           style="background:#C9A96E; color:#fff; padding: 10px 20px; text-decoration:none; font-size:13px; border-radius:2px; display:inline-block; margin:4px;">
          ✉ Reply by Email
        </a>` : ''}
      </div>
    </div>

    <!-- Footer -->
    <div style="background: #1a0f0a; padding: 18px 32px; text-align: center;">
      <p style="color: rgba(255,255,255,0.3); font-size: 11px; margin: 0; letter-spacing: 1px;">
        This notification was sent automatically from your website · Aura Beauty Studio, Latur
      </p>
    </div>
  </div>
  `;

  GmailApp.sendEmail(CONFIG.NOTIFY_EMAIL, subject, '', { htmlBody });
}


// ── CUSTOMER CONFIRMATION EMAIL ──────────────────────────────────

function sendCustomerConfirmation(data) {
  const subject = `✦ We received your query — ${CONFIG.STUDIO_NAME}`;

  const htmlBody = `
  <div style="font-family: Georgia, serif; max-width: 520px; margin: 0 auto; border: 1px solid #e8d5b0; border-radius: 4px; overflow: hidden;">
    <div style="background: #1a0f0a; padding: 28px 32px; text-align: center;">
      <h1 style="color: #C9A96E; font-size: 20px; font-weight: 300; margin: 0; letter-spacing: 2px;">✦ AURA BEAUTY STUDIO</h1>
    </div>
    <div style="padding: 36px 32px; background: #fdf8f4;">
      <h2 style="font-size: 18px; color: #1a0f0a; font-weight: 400; margin: 0 0 16px;">Hi ${data.name} 🌸</h2>
      <p style="color: #3d2b1f; line-height: 1.8; font-size: 14px;">
        Thank you for reaching out to us! We've received your query for <strong>${data.service}</strong>
        ${data.date ? ` on <strong>${data.date}</strong>` : ''} and we'll get back to you within a few hours.
      </p>
      <p style="color: #3d2b1f; line-height: 1.8; font-size: 14px; margin-top: 16px;">
        In the meantime, feel free to reach us directly:
      </p>
      <div style="margin-top: 20px; border-left: 3px solid #C9A96E; padding-left: 18px;">
        <p style="margin: 6px 0; font-size: 14px; color: #3d2b1f;">📞 <a href="tel:+919876543210" style="color: #C9A96E; text-decoration:none;">+91 98765 43210</a></p>
        <p style="margin: 6px 0; font-size: 14px; color: #3d2b1f;">💬 <a href="https://wa.me/919876543210" style="color: #C9A96E; text-decoration:none;">WhatsApp Us</a></p>
        <p style="margin: 6px 0; font-size: 14px; color: #3d2b1f;">📸 <a href="https://instagram.com/aura.beauty.studio" style="color: #C9A96E; text-decoration:none;">@aura.beauty.studio</a></p>
      </div>
      <p style="margin-top: 28px; color: #8a6e62; font-style: italic; font-size: 14px;">
        "Where every look tells a story." 💄
      </p>
    </div>
    <div style="background: #1a0f0a; padding: 16px 32px; text-align:center;">
      <p style="color: rgba(255,255,255,0.3); font-size: 11px; margin: 0;">Aura Beauty Studio · Latur, Maharashtra</p>
    </div>
  </div>`;

  GmailApp.sendEmail(data.email, subject, '', { htmlBody });
}


// ── SETUP HELPER (run this once manually from the editor) ────────

function setupSheet() {
  // This triggers the header row creation by simulating a dummy entry
  saveToSheet({
    timestamp: 'SETUP TEST — DELETE THIS ROW',
    name: 'Test', phone: '0000000000', email: 'test@test.com',
    service: 'Setup', date: '', message: 'Script is working correctly.'
  });
  Logger.log('✅ Sheet set up successfully. Delete the test row from your Google Sheet.');
}
