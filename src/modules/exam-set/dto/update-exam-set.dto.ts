import { PartialType } from '@nestjs/swagger';
import { CreateExamSetDto } from './create-exam-set.dto';

export class UpdateExamSetDto extends PartialType(CreateExamSetDto) {} 