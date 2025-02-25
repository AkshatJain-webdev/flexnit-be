import { ShowModel } from 'src/data-models/show.model';

export class ErrorDetail {
  row: number;
  message: string;

  constructor(row: number, message: string) {
    this.row = row;
    this.message = message;
  }
}

export class RowsInfo {
  success: number;
  failed: number;
  errors: ErrorDetail[];

  constructor(success: number, failed: number, errors: any[]) {
    this.success = success;
    this.failed = failed;
    this.errors = errors.map((error) => new ErrorDetail(error.row, error.message));
  }
}

export class ImportShowsResDto {
  message: string;
  rows: RowsInfo;

  constructor(message: string, rows: RowsInfo) {
    this.message = message;
    this.rows = new RowsInfo(rows.success, rows.failed, rows.errors);
  }
}

export class GetShowsResDto {
  items: ShowModel[];
  total: number;
  page: number;
  totalPages: number;

  constructor(items: ShowModel[], total: number, page: number, limit: number) {
    this.items = items;
    this.total = total;
    this.page = page;
    this.totalPages = Math.ceil(total / limit);
  }
}
