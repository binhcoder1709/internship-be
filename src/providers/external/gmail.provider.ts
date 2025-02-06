import { Injectable } from "@nestjs/common";

let nodemailer = require('nodemailer');

@Injectable()
export class GmailProvider {
    private transporter: any;
    private readonly user = process.env.GMAIL_USER;
    private readonly password = process.env.GMAIL_PASSWORD;

    constructor() {
        this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: this.user,
                pass: this.password
            }
        });
    }

    /**
     * Send email with plain text content
     */
    async sendTextEmail(to: string, subject: string, text: string) {
        try {
            await this.transporter.sendMail({
                from: this.user,
                to,
                subject,
                text
            });
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Send email with HTML content
     */
    async sendHtmlEmail(to: string, subject: string, html: string) {
        try {
            await this.transporter.sendMail({
                from: this.user,
                to,
                subject,
                html
            });
            return true;
        } catch (error) {
            return false;
        }
    }
}

export const Templates = {
    welcome: {
        subject: 'Welcome to Rikkei Internship Program',
        template: (name: string) => `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <script src="https://cdn.tailwindcss.com"></script>
                <title>Welcome to Rikkei Internship</title>
            </head>
            <body class="bg-gray-100">
                <div class="max-w-2xl mx-auto p-8">
                    <div class="bg-white rounded-lg shadow-lg p-8">
                        <!-- Header with Logo -->
                        <div class="text-center mb-8">
                            <img src="https://rikkei.edu.vn/wp-content/uploads/2022/04/Logo-Rikkei.png" 
                                 alt="Rikkei Academy" 
                                 class="h-12 mx-auto mb-4">
                            <h1 class="text-3xl font-bold text-blue-700">Welcome to Rikkei Internship Program!</h1>
                        </div>

                        <!-- Main Content -->
                        <div class="space-y-6 text-gray-600">
                            <p class="text-lg">
                                Dear <span class="font-semibold text-blue-700">${name}</span>,
                            </p>

                            <p>
                                We're absolutely thrilled to welcome you to the Rikkei Internship Program! 🎉
                            </p>

                            <p>
                                You're about to embark on an exciting journey of learning and growth. 
                                Our program is designed to provide you with hands-on experience and 
                                valuable insights into the world of technology.
                            </p>

                            <!-- Important Information Box -->
                            <div class="bg-blue-50 border-l-4 border-blue-600 p-4 my-6">
                                <h3 class="font-bold text-blue-700 mb-2">Program Highlights:</h3>
                                <ul class="list-disc ml-6 space-y-2">
                                    <li>Hands-on practical experience</li>
                                    <li>Mentorship from industry experts</li>
                                    <li>Real-world project exposure</li>
                                    <li>Career development workshops</li>
                                </ul>
                            </div>

                            <!-- Next Steps -->
                            <div class="bg-gray-50 rounded-lg p-6">
                                <h3 class="font-bold text-gray-700 mb-3">Your Next Steps:</h3>
                                <div class="space-y-4">
                                    <div class="flex items-center">
                                        <div class="flex-shrink-0 h-6 w-6 flex items-center justify-center rounded-full bg-blue-100 text-blue-700">1</div>
                                        <p class="ml-4">Complete your onboarding documentation</p>
                                    </div>
                                    <div class="flex items-center">
                                        <div class="flex-shrink-0 h-6 w-6 flex items-center justify-center rounded-full bg-blue-100 text-blue-700">2</div>
                                        <p class="ml-4">Join our orientation session</p>
                                    </div>
                                    <div class="flex items-center">
                                        <div class="flex-shrink-0 h-6 w-6 flex items-center justify-center rounded-full bg-blue-100 text-blue-700">3</div>
                                        <p class="ml-4">Meet your assigned mentor</p>
                                    </div>
                                </div>
                            </div>

                            <p>
                                If you have any questions or need assistance, please don't hesitate to reach out to our team.
                            </p>

                            <!-- Signature -->
                            <div class="mt-8">
                                <p class="mb-2">Best regards,</p>
                                <p class="font-semibold text-blue-700">Rikkei Academy Team</p>
                            </div>
                        </div>

                        <!-- Footer -->
                        <div class="mt-8 pt-6 border-t border-gray-200">
                            <div class="text-center text-sm text-gray-500">
                                <p>© 2024 Rikkei Academy. All rights reserved.</p>
                                <div class="mt-2 space-x-4">
                                    <a href="#" class="text-blue-600 hover:underline">Website</a>
                                    <a href="#" class="text-blue-600 hover:underline">Contact Us</a>
                                    <a href="#" class="text-blue-600 hover:underline">Privacy Policy</a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `
    },
    verifyEmail: {
        subject: 'Xác thực tài khoản Rikkei Academy',
        template: (otp: string) => `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <script src="https://cdn.tailwindcss.com"></script>
                <title>Xác thực tài khoản Rikkei Academy</title>
            </head>
            <body class="bg-gray-100">
                <div class="max-w-2xl mx-auto p-8">
                    <div class="bg-white rounded-lg shadow-lg p-8">
                        <!-- Header with Logo -->
                        <div class="text-center mb-8">
                            <img src="https://rikkei.edu.vn/wp-content/uploads/2022/04/Logo-Rikkei.png" 
                                 alt="Rikkei Academy" 
                                 class="h-12 mx-auto mb-4">
                            <h1 class="text-3xl font-bold text-blue-700">Xác thực tài khoản</h1>
                        </div>

                        <!-- Main Content -->
                        <div class="space-y-6 text-gray-600">
                            <p>
                                Cảm ơn bạn đã đăng ký tài khoản tại Rikkei Academy!
                            </p>

                            <div class="bg-blue-50 border-l-4 border-blue-600 p-6 my-6">
                                <p class="text-lg mb-2">Mã xác thực OTP của bạn là:</p>
                                <p class="text-3xl font-bold text-blue-700 text-center py-4">${otp}</p>
                                <p class="text-sm text-gray-500">Mã này sẽ hết hạn sau 5 phút.</p>
                            </div>

                            <p>
                                Vui lòng không chia sẻ mã này với bất kỳ ai để bảo vệ tài khoản của bạn.
                            </p>

                            <!-- Security Notice -->
                            <div class="bg-gray-50 rounded-lg p-4 text-sm">
                                <p class="text-gray-600">
                                    <span class="font-semibold">Lưu ý:</span> 
                                    Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này.
                                </p>
                            </div>

                            <!-- Signature -->
                            <div class="mt-8">
                                <p class="mb-2">Trân trọng,</p>
                                <p class="font-semibold text-blue-700">Đội ngũ Rikkei Academy</p>
                            </div>
                        </div>

                        <!-- Footer -->
                        <div class="mt-8 pt-6 border-t border-gray-200">
                            <div class="text-center text-sm text-gray-500">
                                <p>© 2024 Rikkei Academy. All rights reserved.</p>
                                <div class="mt-2 space-x-4">
                                    <a href="#" class="text-blue-600 hover:underline">Website</a>
                                    <a href="#" class="text-blue-600 hover:underline">Liên hệ</a>
                                    <a href="#" class="text-blue-600 hover:underline">Chính sách</a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `
    },
    interviewSchedule: {
        subject: 'Thông báo lịch phỏng vấn thực tập Rikkei Academy',
        template: (studentName: string, position: string, time: string, link: string, note?: string) => `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <script src="https://cdn.tailwindcss.com"></script>
                <title>Thông báo lịch phỏng vấn</title>
            </head>
            <body class="bg-gray-100">
                <div class="max-w-2xl mx-auto p-8">
                    <div class="bg-white rounded-lg shadow-lg p-8">
                        <div class="text-center mb-8">
                            <img src="https://rikkei.edu.vn/wp-content/uploads/2022/04/Logo-Rikkei.png" 
                                 alt="Rikkei Academy" class="h-12 mx-auto mb-4">
                            <h1 class="text-3xl font-bold text-blue-700">Thông báo lịch phỏng vấn</h1>
                        </div>
                        <div class="space-y-6 text-gray-600">
                            <p>Xin chào <span class="font-semibold text-blue-700">${studentName}</span>,</p>
                            <p>Chúng tôi xin thông báo lịch phỏng vấn vị trí <span class="font-semibold">${position}</span>:</p>
                            <div class="bg-blue-50 border-l-4 border-blue-600 p-6 my-6">
                                <p><span class="font-semibold">Thời gian:</span> ${time}</p>
                                <p><span class="font-semibold">Link phỏng vấn:</span> <a href="${link}" class="text-blue-600 hover:underline">${link}</a></p>
                                ${note ? `<p class="mt-4"><span class="font-semibold">Ghi chú:</span> ${note}</p>` : ''}
                            </div>
                            <p>Vui lòng tham gia đúng giờ và chuẩn bị đầy đủ.</p>
                            <div class="mt-8">
                                <p class="mb-2">Trân trọng,</p>
                                <p class="font-semibold text-blue-700">Đội ngũ Rikkei Academy</p>
                            </div>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `
    }
};