import { Controller, Get, Query } from '@nestjs/common';
import { AcademyService } from './academy.service';
import { NearbyAcademiesDto } from './dto/nearby-academies.dto';

@Controller('academies')
export class AcademyController {
  constructor(private readonly academies: AcademyService) {}

  @Get('nearby')
  nearby(@Query() query: NearbyAcademiesDto) {
    return this.academies.findNearby(query);
  }
}
