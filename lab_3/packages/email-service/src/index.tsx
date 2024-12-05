import { EmailService } from "./email-service";

async function main() {
  const emailService = new EmailService();

  try {
    await emailService.verifyConnection();
    await emailService.sendEmail(
      "daniela.vornic@gmail.com",
      "Test Email",
      "This is a test email from email service."
    );
  } catch (error) {
    console.error("Error sending email:", error);
  }
}

main();
