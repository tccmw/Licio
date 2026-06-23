import { Module } from '@nestjs/common';
import { AcademyController } from './academy.controller';
import { AcademyService } from './academy.service';
import { PlacesProvider } from './places.provider';

@Module({ controllers: [AcademyController], providers: [AcademyService, PlacesProvider] })
export class AcademyModule {}
