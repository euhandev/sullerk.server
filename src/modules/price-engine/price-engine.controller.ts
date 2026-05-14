import { Controller, Get, Patch, Put, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PriceEngineService } from './price-engine.service';
import { UpdateGlobalConfigDto } from './dto/global-config.dto';
import { UpdateBaseValuesDto } from './dto/base-values.dto';
import { UpdateMultipliersDto } from './dto/multipliers.dto';
import { UpdateCardRulesDto } from './dto/card-rules.dto';
import { UpdateHonoursDto } from './dto/honours.dto';
import { UpdateApiRulesDto } from './dto/api-rules.dto';
import { Public } from '../auth/auth.decorator';

@ApiTags('Price Engine')
@Controller('price-engine')
export class PriceEngineController {
  constructor(private readonly priceEngineService: PriceEngineService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all sports' })
  getSports() {
    return this.priceEngineService.getAll();
  }

  @Get(':sport')
  @Public()
  @ApiOperation({ summary: 'Get full price engine configuration for a sport' })
  getConfig(@Param('sport') sport: string) {
    return this.priceEngineService.getConfig(sport);
  }

  @Patch(':sport/global')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update global controls for a sport' })
  updateGlobal(@Param('sport') sport: string, @Body() dto: UpdateGlobalConfigDto) {
    return this.priceEngineService.updateGlobalConfig(sport, dto);
  }

  @Put(':sport/base-values')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Bulk update base values for a sport' })
  updateBaseValues(@Param('sport') sport: string, @Body() dto: UpdateBaseValuesDto) {
    return this.priceEngineService.updateBaseValues(sport, dto);
  }

  @Put(':sport/multipliers')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update proof, signature, and auth multipliers' })
  updateMultipliers(@Param('sport') sport: string, @Body() dto: UpdateMultipliersDto) {
    return this.priceEngineService.updateMultipliers(sport, dto);
  }

  @Put(':sport/cards')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update card numbering, feature, and grade rules' })
  updateCardRules(@Param('sport') sport: string, @Body() dto: UpdateCardRulesDto) {
    return this.priceEngineService.updateCardRules(sport, dto);
  }

  @Put(':sport/honours')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update honour multipliers for a sport' })
  updateHonours(@Param('sport') sport: string, @Body() dto: UpdateHonoursDto) {
    return this.priceEngineService.updateHonours(sport, dto);
  }

  @Put(':sport/api-rules')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update API performance rules for a sport' })
  updateApiRules(@Param('sport') sport: string, @Body() dto: UpdateApiRulesDto) {
    return this.priceEngineService.updateApiRules(sport, dto);
  }
}
