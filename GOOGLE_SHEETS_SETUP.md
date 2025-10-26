# Google Sheets Integration Setup Guide

This guide will help you set up Google Sheets to receive waitlist submissions from your CrawlReady website.

## Step 1: Create a Google Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new spreadsheet
3. Name it "CrawlReady Waitlist"
4. Add the following headers in row 1:
   - Column A: `Timestamp`
   - Column B: `Email`
   - Column C: `Website`
   - Column D: `Source`

## Step 2: Create Google Apps Script

1. In your Google Sheet, go to **Extensions** → **Apps Script**
2. Delete any existing code
3. Paste the following code:

```javascript
// Configuration - UPDATE THESE
const YOUR_EMAIL = 'your-email@example.com'; // Your email for notifications
const CONFIRMATION_ENABLED = true; // Set to false to disable confirmation emails

/**
 * Handle POST requests (form submissions)
 */
function doPost(e) {
  try {
    // Parse the incoming data
    const data = JSON.parse(e.postData.contents);
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    // Check for duplicates (email deduplication)
    const emailColumn = sheet.getRange('B2:B').getValues(); // Skip header row
    const isDuplicate = emailColumn.some(row => row[0] && row[0].toString().toLowerCase() === data.email.toLowerCase());

    if (isDuplicate) {
      return ContentService
        .createTextOutput(JSON.stringify({
          success: false,
          error: 'This email is already registered on our waitlist!',
          duplicate: true
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // Append the new entry
    sheet.appendRow([
      data.timestamp || new Date().toISOString(),
      data.email || '',
      data.website || '',
      data.source || 'unknown'
    ]);

    // Send confirmation email to the user
    if (CONFIRMATION_ENABLED && data.email) {
      try {
        sendConfirmationEmail(data.email, data.website);
      } catch (emailError) {
        Logger.log(`Failed to send confirmation email: ${emailError.toString()}`);
        // Don't fail the request if email fails
      }
    }

    // Get updated count
    const totalCount = sheet.getLastRow() - 1; // Subtract header row

    // Return success response with count
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        count: totalCount,
        message: 'Successfully joined the waitlist!'
      }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    Logger.log(`Error in doPost: ${error.toString()}`);
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Handle GET requests (get count)
 */
function doGet(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const totalCount = sheet.getLastRow() - 1; // Subtract header row
    const spotsLeft = Math.max(0, 100 - totalCount); // Calculate spots remaining out of 100

    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        count: totalCount,
        spotsLeft
      }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    Logger.log(`Error in doGet: ${error.toString()}`);
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Fetch tool results from CrawlReady API
 */
function fetchToolResults(website) {
  try {
    const crawlerCheckUrl = 'https://crawlready.app/api/check-crawler';
    const schemaCheckUrl = 'https://crawlready.app/api/check-schema';

    let crawlerScore = null;
    let schemaScore = null;

    // Fetch Crawler Check results
    try {
      const crawlerResponse = UrlFetchApp.fetch(crawlerCheckUrl, {
        method: 'post',
        contentType: 'application/json',
        payload: JSON.stringify({ url: website }),
        muteHttpExceptions: true
      });

      if (crawlerResponse.getResponseCode() === 200) {
        const crawlerData = JSON.parse(crawlerResponse.getContentText());
        crawlerScore = crawlerData.report?.score || null;
      }
    } catch (e) {
      Logger.log(`Failed to fetch crawler check: ${e.toString()}`);
    }

    // Fetch Schema Check results
    try {
      const schemaResponse = UrlFetchApp.fetch(schemaCheckUrl, {
        method: 'post',
        contentType: 'application/json',
        payload: JSON.stringify({ url: website }),
        muteHttpExceptions: true
      });

      if (schemaResponse.getResponseCode() === 200) {
        const schemaData = JSON.parse(schemaResponse.getContentText());
        schemaScore = schemaData.analysis?.overallScore || null;
      }
    } catch (e) {
      Logger.log(`Failed to fetch schema check: ${e.toString()}`);
    }

    return { crawlerScore, schemaScore };
  } catch (error) {
    Logger.log(`Error fetching tool results: ${error.toString()}`);
    return { crawlerScore: null, schemaScore: null };
  }
}

/**
 * Send confirmation email to the user
 */
function sendConfirmationEmail(email, website) {
  // Fetch tool results if website is provided
  const toolResults = website ? fetchToolResults(website) : { crawlerScore: null, schemaScore: null };
  const encodedWebsite = encodeURIComponent(website || '');
  const subject = '🎉 Welcome to CrawlReady Early Access!';

  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to CrawlReady! 🚀</h1>
      </div>

      <div style="padding: 40px 20px; background-color: #f9fafb;">
        <p style="font-size: 16px; color: #374151; line-height: 1.6;">
          Hi there! 👋
        </p>

        <p style="font-size: 16px; color: #374151; line-height: 1.6;">
          Thank you for joining the <strong>CrawlReady Early Access</strong> waitlist! You're now part of an exclusive group of forward-thinking developers and businesses preparing for the AI search revolution.
        </p>

        <div style="background-color: white; border-left: 4px solid #667eea; padding: 20px; margin: 30px 0; border-radius: 4px;">
          <h3 style="margin-top: 0; color: #667eea;">What's Next?</h3>
          <ul style="color: #374151; line-height: 1.8;">
            <li>✅ You're on the list! We'll notify you as soon as we launch</li>
            <li>🎁 Early access members get <strong>50% off for life</strong></li>
            <li>💬 You'll have direct access to our founding team</li>
            <li>🔧 Help shape the product with your feedback</li>
          </ul>
        </div>

        ${website
          ? `
          <div style="background-color: white; border-radius: 12px; padding: 24px; margin: 30px 0; border: 2px solid #e5e7eb;">
            <h3 style="margin-top: 0; color: #1f2937; font-size: 18px; margin-bottom: 16px;">📊 Your Website Analysis</h3>
            <p style="font-size: 14px; color: #6b7280; margin-bottom: 20px;">We analyzed <strong>${website}</strong> with our free tools:</p>

            <div style="display: table; width: 100%; margin-bottom: 16px;">
              <div style="display: table-row;">
                <div style="display: table-cell; padding: 12px; background-color: #f9fafb; border-radius: 8px; width: 50%;">
                  <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">🤖 AI Crawler Compatibility</div>
                  <div style="font-size: 24px; font-weight: bold; color: ${toolResults.crawlerScore !== null ? (toolResults.crawlerScore >= 70 ? '#10b981' : toolResults.crawlerScore >= 40 ? '#f59e0b' : '#ef4444') : '#6b7280'}; margin-bottom: 8px;">
                    ${toolResults.crawlerScore !== null ? `${toolResults.crawlerScore}/100` : 'Analyzing...'}
                  </div>
                  <a href="https://crawlready.app/crawler-checker/results?url=${encodedWebsite}" style="display: inline-block; padding: 8px 16px; background-color: #667eea; color: white; text-decoration: none; border-radius: 6px; font-size: 13px; font-weight: 600;">View Full Report →</a>
                </div>
                <div style="display: table-cell; padding-left: 16px;"></div>
                <div style="display: table-cell; padding: 12px; background-color: #f9fafb; border-radius: 8px; width: 50%;">
                  <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">📋 Schema Markup</div>
                  <div style="font-size: 24px; font-weight: bold; color: ${toolResults.schemaScore !== null ? (toolResults.schemaScore >= 70 ? '#10b981' : toolResults.schemaScore >= 40 ? '#f59e0b' : '#ef4444') : '#6b7280'}; margin-bottom: 8px;">
                    ${toolResults.schemaScore !== null ? `${toolResults.schemaScore}/100` : 'Analyzing...'}
                  </div>
                  <a href="https://crawlready.app/schema-checker/results?url=${encodedWebsite}" style="display: inline-block; padding: 8px 16px; background-color: #667eea; color: white; text-decoration: none; border-radius: 6px; font-size: 13px; font-weight: 600;">View Full Report →</a>
                </div>
              </div>
            </div>

            ${toolResults.crawlerScore !== null && toolResults.crawlerScore < 70 ? '<p style="font-size: 13px; color: #dc2626; margin-top: 16px; margin-bottom: 0;">⚠️ Your site may be invisible to AI search engines! CrawlReady can fix this.</p>' : ''}
          </div>
        `
          : ''}

        <p style="font-size: 16px; color: #374151; line-height: 1.6;">
          In the meantime, feel free to reply to this email with any questions or check out our <a href="https://crawlready.com" style="color: #667eea; text-decoration: none;">website</a> for more information.
        </p>

        <p style="font-size: 16px; color: #374151; line-height: 1.6;">
          Excited to have you on board! 🎉
        </p>

        <p style="font-size: 16px; color: #374151; line-height: 1.6;">
          Best regards,<br>
          <strong>The CrawlReady Team</strong>
        </p>
      </div>

      <div style="padding: 20px; text-align: center; background-color: #1f2937; color: #9ca3af; font-size: 12px;">
        <p style="margin: 0;">CrawlReady - Make your JavaScript site visible to AI search engines</p>
        <p style="margin: 10px 0 0 0;">Follow us on <a href="https://twitter.com/medartus" style="color: #667eea; text-decoration: none;">Twitter @medartus</a></p>
      </div>
    </div>
  `;

  const plainBody = `
Welcome to CrawlReady Early Access!

Hi there!

Thank you for joining the CrawlReady Early Access waitlist! You're now part of an exclusive group of forward-thinking developers and businesses preparing for the AI search revolution.

What's Next?
- You're on the list! We'll notify you as soon as we launch
- Early access members get 50% off for life
- You'll have direct access to our founding team
- Help shape the product with your feedback

${website
  ? `
Your Website Analysis for ${website}:

🤖 AI Crawler Compatibility: ${toolResults.crawlerScore !== null ? `${toolResults.crawlerScore}/100` : 'Analyzing...'}
View Report: https://crawlready.app/crawler-checker/results?url=${encodedWebsite}

📋 Schema Markup Score: ${toolResults.schemaScore !== null ? `${toolResults.schemaScore}/100` : 'Analyzing...'}
View Report: https://crawlready.app/schema-checker/results?url=${encodedWebsite}

${toolResults.crawlerScore !== null && toolResults.crawlerScore < 70 ? '⚠️ Your site may be invisible to AI search engines! CrawlReady can fix this.\n\n' : ''}
`
  : ''}
In the meantime, feel free to reply to this email with any questions or check out our website for more information.

Excited to have you on board!

Best regards,
The CrawlReady Team

---
CrawlReady - Make your JavaScript site visible to AI search engines
Follow us on Twitter @medartus
  `;

  MailApp.sendEmail({
    to: email,
    subject,
    body: plainBody,
    htmlBody,
    name: 'CrawlReady'
  });

  Logger.log(`Confirmation email sent to: ${email}`);
}

// Test function for POST (optional)
function testPost() {
  const testData = {
    postData: {
      contents: JSON.stringify({
        email: 'test@example.com',
        website: 'https://example.com',
        timestamp: new Date().toISOString(),
        source: 'test'
      })
    }
  };

  const result = doPost(testData);
  Logger.log(result.getContent());
}

// Test function for GET (optional)
function testGet() {
  const result = doGet({});
  Logger.log(result.getContent());
}
```

4. Click **Save** (💾 icon)
5. Name your project "Waitlist Webhook"

## Step 3: Deploy the Web App

1. Click **Deploy** → **New deployment**
2. Click the gear icon ⚙️ next to "Select type"
3. Choose **Web app**
4. Configure the deployment:
   - **Description**: "Waitlist webhook handler"
   - **Execute as**: Me (your email)
   - **Who has access**: Anyone
5. Click **Deploy**
6. Review and authorize the permissions:
   - Click **Authorize access**
   - Choose your Google account
   - Click **Advanced** → **Go to [Project Name] (unsafe)**
   - Click **Allow**
7. Copy the **Web app URL** (it will look like: `https://script.google.com/macros/s/...../exec`)

## Step 4: Add the URL to Your Environment Variables

1. In your project root, create or edit `.env.local`:

```bash
GOOGLE_SHEETS_WEBHOOK_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
```

2. Replace `YOUR_SCRIPT_ID` with the actual URL you copied

3. Restart your development server:

```bash
npm run dev
```

## Step 5: Test the Integration

1. Go to your website's CTA section
2. Fill out the form with test data
3. Submit the form
4. Check your Google Sheet - you should see a new row with the data!

## Troubleshooting

### Issue: "Service configuration error"
- Make sure `GOOGLE_SHEETS_WEBHOOK_URL` is set in your `.env.local` file
- Restart your development server after adding the variable

### Issue: Data not appearing in sheet
- Check that the Google Apps Script is deployed as a web app
- Verify the "Who has access" is set to "Anyone"
- Check the Apps Script logs: **Executions** tab in the Apps Script editor

### Issue: CORS errors
- This shouldn't happen since the request is server-side
- If it does, ensure you're using the `/api/waitlist` endpoint

## Production Deployment

For production (Vercel, Netlify, etc.):

1. Add the environment variable in your hosting platform:
   - **Vercel**: Project Settings → Environment Variables
   - **Netlify**: Site Settings → Environment Variables

2. Set the variable:
   ```
   GOOGLE_SHEETS_WEBHOOK_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
   ```

3. Redeploy your application

## Data Format

Each submission will create a new row with:
- **Timestamp**: ISO 8601 format (e.g., `2024-01-15T10:30:00.000Z`)
- **Email**: User's email address
- **Website**: User's website URL
- **Source**: Always "waitlist" for CTA submissions

## Optional Enhancements

### Email Notifications
Add this to your Apps Script to get email notifications:

## Security Notes

- The webhook URL is public but only accepts POST requests
- No sensitive data should be stored in the sheet
- Consider adding rate limiting if you experience spam
- The Apps Script runs under your Google account permissions

## Support

If you encounter issues:
1. Check the Apps Script execution logs
2. Verify environment variables are set correctly
3. Test with the `testPost()` function in Apps Script
4. Check browser console for client-side errors
