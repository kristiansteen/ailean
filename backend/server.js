require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Resend } = require('resend');
// Removed sqlite requirement
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3001;

// Initialize Resend with your API key
const resend = new Resend(process.env.RESEND_API_KEY);

// Middleware
app.use(cors());
app.use(express.json());

// Serve the frontend as static files
const frontendDir = path.join(__dirname, '..', 'frontend');
app.use(express.static(frontendDir));

// Initialize JSON database
const dbDir = path.join(__dirname, 'data');
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir);
}
const dbPath = path.join(dbDir, 'leads.json');
if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify([]));
    console.log('Leads JSON database initialized.');
} else {
    console.log('Connected to Leads JSON database.');
}

// Endpoint to handle new leads
app.post('/api/v1/leads', async (req, res) => {
    const { name, email, phone, selectedDocuments } = req.body;

    // Basic validation
    if (!name || !email || !selectedDocuments || !Array.isArray(selectedDocuments) || selectedDocuments.length === 0) {
        return res.status(400).json({ error: 'Missing required fields or documents' });
    }

    try {
        // 1. Save lead to database
        const newLead = {
            id: Date.now().toString(),
            name,
            email,
            phone: phone || null,
            selected_documents: selectedDocuments,
            created_at: new Date().toISOString()
        };

        const leads = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
        leads.push(newLead);
        fs.writeFileSync(dbPath, JSON.stringify(leads, null, 2));
        console.log(`Lead saved to database with ID: ${newLead.id}`);

        // 2. Prepare attachments from the frontend assets folder
        const attachments = [];
        const documentsDir = path.join(__dirname, '..', 'frontend', 'assets', 'documents');

        for (const filename of selectedDocuments) {
            const filePath = path.join(documentsDir, filename);
            if (fs.existsSync(filePath)) {
                // Read file as base64 or buffer for Resend
                const fileContent = fs.readFileSync(filePath);
                attachments.push({
                    filename: filename,
                    content: fileContent,
                });
            } else {
                console.warn(`Requested document not found: ${filePath}`);
            }
        }

        if (attachments.length === 0) {
            console.warn('No physical attachments could be found. Proceeding with email without attachments.');
        }

        // 3. Send email via Resend
        // NOTE: 'onboarding@resend.dev' works only for testing when sending to your verified email address.
        // You should change the "from" address to your verified domain (e.g., 'hello@ailean.com') once configured in Resend.

        const templatePath = path.join(__dirname, '..', 'frontend', 'ailean-welcome-email.html');
        let htmlContent = '';
        if (fs.existsSync(templatePath)) {
            htmlContent = fs.readFileSync(templatePath, 'utf8');
            // Extract the first name from the full name
            const firstName = name.split(' ')[0] || name;
            htmlContent = htmlContent.replace('{{first_name}}', firstName);
        } else {
            // Fallback
            htmlContent = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                    <h2>Thank you for your interest, ${name}!</h2>
                    <p>We're excited to share our insights with you.</p>
                    <p>You will find your requested documents attached to this email.</p>
                    <p>Best regards,<br/>The AILEAN Team</p>
                </div>
            `;
        }

        const msg = {
            from: 'AILEAN <onboarding@resend.dev>',
            to: [email],
            subject: 'AILEAN Whitepaper: Your download is ready',
            html: htmlContent,
            attachments: attachments
        };

        const { data, error } = await resend.emails.send(msg);

        if (error) {
            console.error('Resend error:', error);
            // Including error details in the response to help debugging
            return res.status(500).json({ error: 'Failed to send email. Please try again later.', details: error });
        }

        res.status(200).json({ success: true, message: 'Email sent successfully', data });

    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`AILEAN running at http://localhost:${port}`);
    console.log(`Frontend served from: ${frontendDir}`);
    if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 'your_resend_api_key_here') {
        console.warn('⚠️  RESEND_API_KEY not set — confirmation emails will not be sent.');
    }
});
