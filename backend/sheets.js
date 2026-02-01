const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

const CREDENTIALS_PATH = path.join(__dirname, 'credentials.json');
const SPREADSHEET_ID = '1I4KbSSDhos5cagKTId6XpOsWhhs23sseHFLf1U6vgRU'; // User provided ID

// Authenticate with Google
async function authGoogle() {
    if (!fs.existsSync(CREDENTIALS_PATH)) {
        console.warn('⚠️ Google Sheets: credentials.json not found in backend directory. Skipping Sheets save.');
        return null;
    }

    try {
        const auth = new google.auth.GoogleAuth({
            keyFile: CREDENTIALS_PATH,
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });
        return await auth.getClient();
    } catch (error) {
        console.error('❌ Google Sheets Auth Error:', error.message);
        return null;
    }
}

/**
 * Appends a new student registration to the Google Sheet.
 * @param {Object} student - The student data object.
 */
async function appendStudentToSheet(student) {
    try {
        const authClient = await authGoogle();
        if (!authClient) return false;

        const sheets = google.sheets({ version: 'v4', auth: authClient });

        // Map student data to a row array
        // Order: Timestamp, Name, Email, Phone, Dept, Year, RollNo, Accommodation, TeamName, TeamSize, Domain, Problem, Event
        const rowData = [
            student.registeredAt || new Date().toISOString(),
            student.name,
            student.email,
            student.phone,
            student.department,
            student.year,
            student.rollNumber,
            student.accommodation,
            student.teamName,
            student.teamSize,
            student.domain || 'N/A',
            student.problemStatement || 'N/A',
            student.event || 'General'
        ];

        // Add info for team members if any
        if (student.teamMembers && student.teamMembers.length > 0) {
            const membersInfo = student.teamMembers.map(m => `${m.name} (${m.email})`).join(', ');
            rowData.push(membersInfo);
        } else {
            rowData.push('');
        }

        await sheets.spreadsheets.values.append({
            spreadsheetId: SPREADSHEET_ID,
            range: 'Sheet1!A:N', // Appending to columns A to N
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: [rowData],
            },
        });

        console.log(`✅ Registration for ${student.name} appended to Google Sheet.`);
        return true;

    } catch (error) {
        console.error('❌ Failed to append to Google Sheet:', error.message);
        // We do NOT want to crash the server if Sheets API fails
        return false;
    }
}

module.exports = { appendStudentToSheet };
