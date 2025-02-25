import { Controller, Get, Post, Query, Param, Req, UseInterceptors, UploadedFile, ParseIntPipe } from '@nestjs/common';
import { ShowsService } from './shows.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { GetShowsResDto, ImportShowsResDto } from './dto/shows.dto';
import { ShowModel, ShowType } from 'src/data-models/show.model';

@Controller('shows')
export class ShowsController {
  constructor(private readonly showsService: ShowsService) {}

  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  async importShows(@UploadedFile() file: Express.Multer.File): Promise<ImportShowsResDto> {
    return await this.showsService.importShows(file);
  }

  @Get()
  async getShows(
    @Req() req: any,
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit') limit = 15,
    @Query('search') search = '',
    @Query('type') type?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortDir') sortDir?: string,
  ): Promise<GetShowsResDto> {
    return await this.showsService.getShows(
      req.user,
      page,
      limit,
      search,
      !type ? undefined : type === '1' ? ShowType.MOVIE : ShowType.TV_SHOW,
      sortBy,
      sortDir,
    );
  }

  @Get(':id')
  async getShow(@Param('id') id: string): Promise<ShowModel> {
    return await this.showsService.getShow(id);
  }
}
