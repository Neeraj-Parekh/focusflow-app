import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import List, Optional
import asyncio

from ..core.config import settings

class EmailService:
    def __init__(self):
        self.smtp_host = settings.SMTP_HOST
        self.smtp_port = settings.SMTP_PORT
        self.smtp_user = settings.SMTP_USER
        self.smtp_password = settings.SMTP_PASSWORD
    
    async def send_email(
        self, 
        to_email: str, 
        subject: str, 
        body: str, 
        html_body: Optional[str] = None
    ) -> bool:
        """Send email asynchronously"""
        
        if not self.smtp_host or not self.smtp_user:
            print(f"Email not sent (SMTP not configured): {subject} to {to_email}")
            return False
        
        try:
            # Run in thread pool to avoid blocking
            await asyncio.get_event_loop().run_in_executor(
                None, 
                self._send_email_sync, 
                to_email, 
                subject, 
                body, 
                html_body
            )
            return True
        except Exception as e:
            print(f"Failed to send email: {e}")
            return False
    
    def _send_email_sync(
        self, 
        to_email: str, 
        subject: str, 
        body: str, 
        html_body: Optional[str] = None
    ):
        """Synchronous email sending"""
        
        msg = MIMEMultipart('alternative')
        msg['From'] = self.smtp_user
        msg['To'] = to_email
        msg['Subject'] = subject
        
        # Add text part
        text_part = MIMEText(body, 'plain')
        msg.attach(text_part)
        
        # Add HTML part if provided
        if html_body:
            html_part = MIMEText(html_body, 'html')
            msg.attach(html_part)
        
        # Send email
        with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
            server.starttls()
            server.login(self.smtp_user, self.smtp_password)
            server.send_message(msg)

# Global email service instance
email_service = EmailService()

# Convenience functions
async def send_welcome_email(email: str, full_name: str) -> bool:
    """Send welcome email to new user"""
    
    subject = "Welcome to FocusFlow!"
    body = f"""
    Hi {full_name},
    
    Welcome to FocusFlow - your AI-powered productivity companion!
    
    You're now part of a community focused on maximizing productivity through 
    the proven Pomodoro Technique enhanced with intelligent insights.
    
    Get started:
    1. Set up your first project
    2. Create some tasks
    3. Start your first focused work session
    4. Let our AI learn your patterns and provide personalized recommendations
    
    Need help? Check out our getting started guide or contact support.
    
    Happy focusing!
    The FocusFlow Team
    """
    
    html_body = f"""
    <html>
    <body>
        <h2>Welcome to FocusFlow!</h2>
        <p>Hi {full_name},</p>
        <p>Welcome to FocusFlow - your AI-powered productivity companion!</p>
        
        <p>You're now part of a community focused on maximizing productivity through 
        the proven Pomodoro Technique enhanced with intelligent insights.</p>
        
        <h3>Get started:</h3>
        <ol>
            <li>Set up your first project</li>
            <li>Create some tasks</li>
            <li>Start your first focused work session</li>
            <li>Let our AI learn your patterns and provide personalized recommendations</li>
        </ol>
        
        <p>Need help? Check out our <a href="#">getting started guide</a> or contact support.</p>
        
        <p>Happy focusing!<br>
        The FocusFlow Team</p>
    </body>
    </html>
    """
    
    return await email_service.send_email(email, subject, body, html_body)

async def send_password_reset_email(email: str, reset_token: str) -> bool:
    """Send password reset email"""
    
    subject = "Reset your FocusFlow password"
    reset_url = f"https://app.focusflow.com/reset-password?token={reset_token}"
    
    body = f"""
    Hi,
    
    You requested a password reset for your FocusFlow account.
    
    Click the link below to reset your password:
    {reset_url}
    
    This link will expire in 15 minutes.
    
    If you didn't request this reset, please ignore this email.
    
    Best regards,
    The FocusFlow Team
    """
    
    html_body = f"""
    <html>
    <body>
        <h2>Reset your FocusFlow password</h2>
        <p>Hi,</p>
        <p>You requested a password reset for your FocusFlow account.</p>
        
        <p><a href="{reset_url}" style="background-color: #e85d75; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a></p>
        
        <p>This link will expire in 15 minutes.</p>
        
        <p>If you didn't request this reset, please ignore this email.</p>
        
        <p>Best regards,<br>
        The FocusFlow Team</p>
    </body>
    </html>
    """
    
    return await email_service.send_email(email, subject, body, html_body)

async def send_productivity_report_email(email: str, report_data: dict) -> bool:
    """Send weekly productivity report"""
    
    subject = "Your FocusFlow Weekly Report"
    
    body = f"""
    Hi,
    
    Here's your productivity summary for this week:
    
    📊 Focus Time: {report_data.get('focus_time_hours', 0)} hours
    🍅 Pomodoros Completed: {report_data.get('completed_pomodoros', 0)}
    ✅ Tasks Completed: {report_data.get('completed_tasks', 0)}
    📈 Productivity Score: {report_data.get('productivity_score', 0)}%
    
    Keep up the great work!
    
    Best regards,
    The FocusFlow Team
    """
    
    return await email_service.send_email(email, subject, body)