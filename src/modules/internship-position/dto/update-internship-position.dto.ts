import { PartialType } from '@nestjs/swagger';
import { CreateInternshipPositionDto } from './create-internship-position.dto';

export class UpdateInternshipPositionDto extends PartialType(CreateInternshipPositionDto) {} 