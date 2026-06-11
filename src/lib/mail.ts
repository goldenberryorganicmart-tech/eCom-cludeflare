export const sendResetEmail = async (email: string, token: string) => {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const encodedToken = encodeURIComponent(token);
  const resetUrl = `${baseUrl}/reset-password?token=${encodedToken}`;

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
      <h2 style="color: #0d9488; text-align: center;">GO Mart</h2>
      <p>Hello,</p>
      <p>We received a request to reset your password. Click the button below to set a new password. This link will expire in 1 hour.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" style="background-color: #0d9488; color: white; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 5px;">Reset Password</a>
      </div>
      <p>If you didn't request this, you can safely ignore this email.</p>
      <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
      <p style="font-size: 12px; color: #888;">GO Mart - Your Trusted Online Store</p>
    </div>
  `;

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || 'GO Mart <onboarding@resend.dev>';

  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not defined in environment variables');
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from,
      to: [email],
      subject: 'Password Reset Request - GO Mart',
      html,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to send email via Resend: ${response.statusText} - ${errorText}`);
  }
};
