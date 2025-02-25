import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { MongoClient } from 'mongodb';
import { ShowModel, ShowType } from 'src/data-models/show.model';
import { CsvService } from 'src/utils/csv.service';
import { MongoService } from 'src/utils/mongo.service';
import { ErrorDetail, GetShowsResDto, ImportShowsResDto, RowsInfo } from './dto/shows.dto';
import { CategoryModel } from 'src/data-models/category.model';

@Injectable()
export class ShowsService {
  private mongoClient: MongoClient;

  constructor(
    private readonly mongoService: MongoService,
    private readonly csvService: CsvService,
  ) {
    this.mongoClient = this.mongoService.mongoClient;
  }

  async importShows(file: Express.Multer.File): Promise<ImportShowsResDto> {
    try {
      const showData = await this.csvService.readAndValidateCsv(file);
      const rowDetails = {
        success: 0,
        failed: 0,
        errors: [],
      };

      const categories = await this.mongoClient.db().collection<CategoryModel>('categories').find().toArray();
      const categoryMapper = {};
      for (const rawCategory of categories) {
        categoryMapper[rawCategory.name] = rawCategory._id;
      }
      for (let i = 0; i < showData.length; i++) {
        try {
          showData[i].date_added = !!showData[i].date_added ? new Date(showData[i].date_added) : undefined;
          showData[i].type = showData[i].type === 'Movie' ? ShowType.MOVIE : ShowType.TV_SHOW;
          showData[i].categories = [];
          showData[i].cast = !showData[i].cast ? undefined : showData[i].cast.split(', ');
          for (const categoryName of showData[i].listed_in.split(', ')) {
            if (!categoryMapper[categoryName]) {
              const category = await CategoryModel.build({ name: categoryName });
              await category.save(this.mongoClient);
              categoryMapper[category.name] = category._id;
            }
            showData[i].categories.push({ _id: categoryMapper[categoryName], name: categoryName });
          }
          const show = await ShowModel.build(showData[i]);
          await show.save(this.mongoClient);
          rowDetails.success++;
        } catch (err) {
          rowDetails.errors.push(new ErrorDetail(i + 1, err.message ?? 'Invalid row data'));
          rowDetails.failed++;
        }
      }
      return new ImportShowsResDto(
        'Imported successfully',
        new RowsInfo(rowDetails.success, rowDetails.failed, rowDetails.errors),
      );
    } catch (err) {
      console.log('ssis1', err);
      throw err instanceof BadRequestException ? err : new InternalServerErrorException('Something went wrong.');
    }
  }

  async getShows(
    user: any,
    page: number,
    limit: number,
    search: string,
    type?: ShowType,
    sortBy?: string,
    sortDir?: string,
  ): Promise<GetShowsResDto> {
    try {
      let query: any = {};
      if (type) {
        query.type = type;
      }

      if (user.age < 18) {
        query = { ...query, $not: { rating: 'R' } };
      }

      if (search) {
        query = {
          ...query,
          $or: [{ title: { $regex: search, $options: 'i' } }, { cast: { $regex: search, $options: 'i' } }],
        };
      }

      let sortQuery: any = { title: sortDir === 'desc' ? -1 : 1 };
      console.log('sortDir', sortDir);
      if (sortBy) {
        sortQuery = { [sortBy]: sortDir === 'desc' ? -1 : 1 };
      }
      const [showData, total] = await Promise.all([
        this.mongoClient
          .db()
          .collection('shows')
          .find(query)
          .sort(sortQuery)
          .skip((page - 1) * limit)
          .limit(limit)
          .toArray(),
        this.mongoClient.db().collection('shows').countDocuments(query),
      ]);

      const response = new GetShowsResDto([], total, page, limit);
      for (const data of showData) {
        response.items.push(await ShowModel.build(data));
      }
      response.total = total;
      return response;
    } catch (err) {
      console.log('ssgs1', err);
      throw err instanceof BadRequestException ? err : new InternalServerErrorException('Something went wrong.');
    }
  }

  async getShow(id: string): Promise<ShowModel> {
    try {
      return ShowModel.getById(this.mongoClient, id);
    } catch (err) {
      console.log('ssgs1', err);
      throw err instanceof BadRequestException ? err : new InternalServerErrorException('Something went wrong.');
    }
  }
}
