import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class UpdateStudentAvatarDto {
    @ApiProperty({ 
        type: 'string', 
        format: 'binary',
        description: 'File ảnh avatar (jpg, jpeg, png)', 
        required: true 
    })
    @IsNotEmpty()
    avatar: Express.Multer.File;
} 