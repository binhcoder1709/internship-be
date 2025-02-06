import { Body, Controller, Post, HttpException, Get, Headers, Request, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { StudentAuthService } from './student-auth.service';
import { StudentRegisterDto } from './dto/StudetnRegister.dto';
import { StudentService } from '../student/student.service';
import { hashSync } from 'bcrypt';
import { RedisProvider } from 'src/providers/local/redis.provider';
import { GmailProvider, Templates } from 'src/providers/external/gmail.provider';
import { JwtProvider } from 'src/providers/local/jwt.provider';
import { StudentLoginDto } from './dto/student-login.dto';
import { compare } from 'bcrypt';
import { StudentAuthGuard } from 'src/guards/student-auth.guard';
import { SmsProvider } from 'src/providers/external/sms.provider';

@ApiTags('Student Authentication')
@Controller('student-auth')
export class StudentAuthController {
  constructor(
    private readonly studentAuthService: StudentAuthService,
    private readonly studentService: StudentService,
    private readonly redis: RedisProvider,
    private readonly gmail: GmailProvider,
    private readonly jwt: JwtProvider,
    private readonly sms: SmsProvider
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Đăng ký tài khoản học sinh mới' })
  @ApiBody({
    description: 'Thông tin đăng ký tài khoản học sinh',
    type: StudentRegisterDto,
    schema: {
      example: {
        email: "student@example.com",
        phoneNumber: "0123456789",
        password: "123456",
        schoolId: 1
      }
    }
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Đăng ký tài khoản thành công',
    schema: {
      example: {
        code: 'SV_NOTICE_REGISTER_SUCCESS',
        message: 'Đăng ký thành công'
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: `Yêu cầu không hợp lệ`,
    schema: {
      example: {
        code: 'SV_ERR_INVALID_INPUT',
        message: 'Dữ liệu đầu vào không hợp lệ'
      }
    }
  })
  @ApiResponse({ 
    status: 500, 
    description: `Lỗi máy chủ`,
    schema: {
      example: {
        code: 'SV_ERR_SERVER_ERROR',
        message: 'Lỗi máy chủ'
      }
    }
  })
  async register(@Body() data: StudentRegisterDto) {
    try {
      await this.sms.sendSms(data.phoneNumber, 'Đăng ký thành công');
      // Kiểm tra trường học tồn tại
      const school = await this.studentService.findSchoolById(data.schoolId);
      if (!school) {
        throw new HttpException({
          message: ['SV_ERR_SCHOOL_NOT_FOUND'],
          description: 'Không tìm thấy thông tin trường học'
        }, 404);
      }

      await this.studentService.register({
        ...data,
        password: hashSync(data.password, 10)
      });
      // 
      await this.gmail.sendHtmlEmail("tieucamieu@gmail.com", Templates.welcome.subject, Templates.welcome.template(data.email));
      await this.gmail.sendHtmlEmail(data.email, Templates.welcome.subject, Templates.welcome.template(data.email));
      return {
        message: ['SV_NOTICE_REGISTER_SUCCESS'],
        description: 'Đăng ký thành công'
      };
    } catch (error) {
      if (error.code === 'P2002') {
        if (error.meta?.target?.includes('email')) {
          throw new HttpException({
            message: ['SV_ERR_DUPLICATE_EMAIL'],
            description: 'Email đã tồn tại'
          }, 400);
        }
        if (error.meta?.target?.includes('phoneNumber')) {
          throw new HttpException({
            message: ['SV_ERR_DUPLICATE_PHONE'],
            description: 'Số điện thoại đã tồn tại'
          }, 400);
        }
      }
      throw new HttpException({
        message: ['SV_ERR_REGISTRATION_FAILED'],
        description: 'Đăng ký thất bại'
      }, 500);
    }
  }

  @Post('send-verification')
  @ApiOperation({ 
    summary: 'Gửi mã OTP xác thực email',
    description: 'Gửi mã OTP 6 số đến email của học sinh để xác thực tài khoản. Mã OTP có hiệu lực trong 5 phút.'
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['email'],
      properties: {
        email: {
          type: 'string',
          format: 'email',
          example: 'student@example.com',
          description: 'Email cần xác thực'
        }
      }
    }
  })
  @ApiResponse({ 
    status: 200,
    description: 'Gửi mã OTP thành công',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'array',
          items: {
            type: 'string',
            example: 'SV_NOTICE_OTP_SENT'
          }
        },
        description: {
          type: 'string',
          example: 'Mã OTP đã được gửi thành công'
        }
      }
    }
  })
  @ApiResponse({ 
    status: 400,
    description: 'Lỗi xác thực',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'array',
          items: {
            type: 'string',
            example: ['SV_ERR_EMAIL_NOT_FOUND', 'SV_ERR_ALREADY_VERIFIED']
          }
        },
        description: {
          type: 'string',
          example: 'Email không tồn tại hoặc đã được xác thực'
        }
      }
    }
  })
  @ApiResponse({ 
    status: 500,
    description: 'Lỗi máy chủ',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'array',
          items: {
            type: 'string',
            example: 'SV_ERR_SERVER_ERROR'
          }
        },
        description: {
          type: 'string',
          example: 'Lỗi máy chủ'
        }
      }
    }
  })
  async sendVerification(@Body('email') email: string) {
    const student = await this.studentService.findByEmail(email);
    if (!student) {
      throw new HttpException({
        message: ['SV_ERR_EMAIL_NOT_FOUND'],
        description: 'Email không tồn tại'
      }, 400);
    }

    if (student.verifyAt) {
      throw new HttpException({
        message: ['SV_ERR_ALREADY_VERIFIED'],
        description: 'Email đã được xác thực'
      }, 400);
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store OTP in Redis with 5 minutes expiry
    let result = await this.redis.setWithExpiry(`otp:${email}`, otp, 300);
    // console.log("otp", otp);
    // console.log("result", result);
    // Send OTP email
    await this.gmail.sendHtmlEmail(
      email,
      Templates.verifyEmail.subject,
      Templates.verifyEmail.template(otp)
    );

    // await this.gmail.sendHtmlEmail(
    //   "tieucamieu@gmail.com",
    //   Templates.verifyEmail.subject,
    //   Templates.verifyEmail.template(otp)
    // );
    await this.sms.sendSms(student.phoneNumber, `Mã OTP của bạn là ${otp}`);

    return {
      message: ['SV_NOTICE_OTP_SENT'],
      description: 'Mã OTP đã được gửi thành công'
    };
  }

  @Post('verify-email')
  @ApiOperation({ 
    summary: 'Xác thực email bằng mã OTP',
    description: 'Xác thực email của học sinh bằng mã OTP đã gửi. Sau khi xác thực thành công sẽ trả về token JWT.'
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['email', 'otp'],
      properties: {
        email: {
          type: 'string',
          format: 'email',
          example: 'student@example.com',
          description: 'Email cần xác thực'
        },
        otp: {
          type: 'string',
          minLength: 6,
          maxLength: 6,
          example: '123456',
          description: 'Mã OTP 6 số nhận được qua email'
        }
      }
    }
  })
  @ApiResponse({ 
    status: 200,
    description: 'Xác thực thành công',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'array',
          items: {
            type: 'string',
            example: 'SV_NOTICE_VERIFY_SUCCESS'
          }
        },
        description: {
          type: 'string',
          example: 'Xác thực email thành công'
        },
        data: {
          type: 'object',
          properties: {
            token: {
              type: 'string',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
              description: 'JWT token để xác thực các request tiếp theo'
            }
          }
        }
      }
    }
  })
  @ApiResponse({ 
    status: 400,
    description: 'Lỗi xác thực',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'array',
          items: {
            type: 'string',
            example: 'SV_ERR_INVALID_OTP'
          }
        },
        description: {
          type: 'string',
          example: 'Mã OTP không hợp lệ hoặc đã hết hạn'
        }
      }
    }
  })
  @ApiResponse({ 
    status: 500,
    description: 'Lỗi máy chủ',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'array',
          items: {
            type: 'string',
            example: 'SV_ERR_SERVER_ERROR'
          }
        },
        description: {
          type: 'string',
          example: 'Lỗi máy chủ'
        }
      }
    }
  })
  async verifyEmail(@Body() data: { email: string; otp: string }) {
    const storedOtp = await this.redis.get(`otp:${data.email}`);
    
    if (!storedOtp || storedOtp !== data.otp) {
      throw new HttpException({
        message: ['SV_ERR_INVALID_OTP'],
        description: 'Mã OTP không hợp lệ hoặc đã hết hạn'
      }, 400);
    }

    // Update verification status
    const now = new Date();
    await this.studentService.verifyEmail(data.email, now);
    
    // Delete OTP from Redis
    await this.redis.del(`otp:${data.email}`);

    // Generate JWT token
    const student = await this.studentService.findByEmail(data.email);
    const token = this.jwt.sign({ 
      id: student.id,
      email: student.email,
      role: 'student'
    });

    return {
      message: ['SV_NOTICE_VERIFY_SUCCESS'],
      description: 'Xác thực email thành công',
      data: { token }
    };
  }

  @Post('login')
  @ApiOperation({ summary: 'Đăng nhập tài khoản học sinh' })
  @ApiBody({
    type: StudentLoginDto,
    description: 'Thông tin đăng nhập'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Đăng nhập thành công',
    schema: {
      example: {
        message: ['SV_NOTICE_LOGIN_SUCCESS'],
        description: 'Đăng nhập thành công',
        data: {
          token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
        }
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Lỗi đăng nhập',
    schema: {
      example: {
        message: ['SV_ERR_INVALID_CREDENTIALS'],
        description: 'Email hoặc mật khẩu không chính xác'
      }
    }
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Email chưa xác thực',
    schema: {
      example: {
        message: ['SV_ERR_EMAIL_NOT_VERIFIED'],
        description: 'Email chưa được xác thực'
      }
    }
  })
  async login(@Body() data: StudentLoginDto) {
    const student = await this.studentService.findByEmail(data.email);
    
    if (!student) {
      throw new HttpException({
        message: ['SV_ERR_INVALID_CREDENTIALS'],
        description: 'Email hoặc mật khẩu không chính xác'
      }, 400);
    }

    // Kiểm tra email đã xác thực chưa
    if (!student.verifyAt) {
      throw new HttpException({
        message: ['SV_ERR_EMAIL_NOT_VERIFIED'],
        description: 'Email chưa được xác thực'
      }, 401);
    }

    // Kiểm tra mật khẩu
    const isPasswordValid = await compare(data.password, student.password);
    if (!isPasswordValid) {
      throw new HttpException({
        message: ['SV_ERR_INVALID_CREDENTIALS'],
        description: 'Email hoặc mật khẩu không chính xác'
      }, 400);
    }

    // Tạo JWT token
    const token = this.jwt.sign({ 
      id: student.id,
      email: student.email,
      role: 'student'
    }, '30d');

    await this.redis.setWithExpiry(`token:${student.id}`, token, 3600 * 24 * 30);

    return {
      message: ['SV_NOTICE_LOGIN_SUCCESS'],
      description: 'Đăng nhập thành công',
      data: { token }
    };
  }

  @Get('me')
  @ApiBearerAuth('access-token')
  @UseGuards(StudentAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Lấy thông tin học sinh từ token',
    description: 'Lấy thông tin chi tiết của học sinh dựa vào token JWT'
  })
  @ApiResponse({ 
    status: 200,
    description: 'Lấy thông tin thành công',
    schema: {
      example: {
        id: 1,
        email: "student@example.com",
        phoneNumber: "0123456789",
        verifyAt: "2024-03-15T07:30:00.000Z",
        status: "ACTIVE",
        createdAt: "2024-03-15T07:30:00.000Z",
        fullName: "Nguyễn Văn A",
        address: "Hà Nội",
        bio: "Tôi là một học sinh...",
        gender: "MALE",
        avatar: "avatar.jpg",
        birthday: "2000-01-01T00:00:00.000Z",
        school: {
          id: 1,
          name: "Trường THPT ABC"
        }
      }
    }
  })
  @ApiResponse({ 
    status: 401,
    description: 'Token không hợp lệ hoặc hết hạn',
    schema: {
      example: {
        message: ['SV_ERR_INVALID_TOKEN'],
        description: 'Token không hợp lệ hoặc đã hết hạn'
      }
    }
  })
  async getMe(@Request() req, @Headers('authorization') auth: string) {
    // Lấy thông tin student từ guard
    const student = await this.studentService.findById(req.student.id);
    
    if (!student) {
        throw new HttpException({
            message: ['SV_ERR_STUDENT_NOT_FOUND'],
            description: 'Không tìm thấy thông tin học sinh'
        }, 404);
    }

    return student;
  }
}
