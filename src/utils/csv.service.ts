import { BadRequestException, Injectable } from '@nestjs/common';
import * as fastCsv from 'fast-csv';

@Injectable()
export class CsvService {
  constructor() {}

  async readAndValidateCsv(
    file: Express.Multer.File,
    requiredColumns?: string[],
    uniqueKeys?: string[],
  ): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const results: any[] = [];
      let missingColumns: string[] = [];
      const uniqueKeyMapper: Record<string, Record<string, number>> = {};
      if (uniqueKeys?.length > 0) {
        uniqueKeys.forEach((key) => {
          uniqueKeyMapper[key] = {};
        });
      }

      const stream = fastCsv
        .parse({ headers: true })
        .on('error', (error) => {
          reject(new BadRequestException(`CSV parsing error: ${error.message}`));
        })
        .on('headers', (headers) => {
          if (requiredColumns?.length > 0) {
            missingColumns = requiredColumns.filter((col) => !headers.includes(col));
            if (missingColumns.length > 0) {
              reject(new BadRequestException(`Missing required columns: ${missingColumns.join(', ')}`));
            }
          }
        })
        .on('data', async (row) => {
          if (uniqueKeys?.length > 0) {
            uniqueKeys.forEach((key) => {
              if (uniqueKeyMapper[key][row[key]] === undefined) {
                uniqueKeyMapper[key][row[key]] = 1;
              } else {
                reject(
                  new BadRequestException(
                    `Duplicate value found for unique column: ${key} in row: ${JSON.stringify(row)}`,
                  ),
                );
              }
            });
          }
          results.push(row);
        })
        .on('end', () => {
          resolve(results);
        });

      stream.write(file.buffer);
      stream.end();
    });
  }
}
