import { IsEmail, IsNotEmpty, IsString, MinLength, IsNumber } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class StudentRegisterDto {
    @ApiProperty({
        example: "student@example.com",
        description: "Email của học sinh"
    })
    @IsEmail({}, { message: 'SV_ERR_EMAIL_INVALID' })
    @IsNotEmpty({ message: 'SV_ERR_EMAIL_REQUIRED' })
    email: string;

    @ApiProperty({
        example: "0123456789",
        description: "Số điện thoại của học sinh"
    })
    @IsString({ message: 'SV_ERR_PHONE_INVALID' })
    @IsNotEmpty({ message: 'SV_ERR_PHONE_REQUIRED' })
    phoneNumber: string;

    @ApiProperty({
        example: "123456",
        description: "Mật khẩu của học sinh",
        minLength: 3
    })
    @IsString({ message: 'SV_ERR_PASSWORD_INVALID' })
    @MinLength(3, { message: 'SV_ERR_PASSWORD_MIN_LENGTH' })
    @IsNotEmpty({ message: 'SV_ERR_PASSWORD_REQUIRED' })
    password: string;

    @ApiProperty({
        example: 1,
        description: "ID của trường học"
    })
    @IsNumber({}, { message: 'SV_ERR_SCHOOL_ID_INVALID' })
    @IsNotEmpty({ message: 'SV_ERR_SCHOOL_ID_REQUIRED' })
    schoolId: number;
}