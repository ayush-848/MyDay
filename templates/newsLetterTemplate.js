// templates/newsletterTemplate.js
module.exports = (content, unsubscribeToken) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Newsletter</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background-color: #f4f4f4;
            padding: 20px;
            text-align: center;
        }
        .content {
            padding: 20px;
        }
        .footer {
            background-color: #f4f4f4;
            padding: 10px;
            text-align: center;
            font-size: 0.8em;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Your Newsletter</h1>
        </div>
        <div class="content">
            ${content}
        </div>
        <div class="footer">
            <p>© 2024 MyDay. All rights reserved.</p>
            <p>You're receiving this email because you subscribed to our newsletter.</p>
            <p><a href="${process.env.BASE_URL}/unsubscribe?token=${unsubscribeToken}" style="color: #f00;">Unsubscribe from this newsletter</a></p>
        </div>
    </div>
</body>
</html>
`;
