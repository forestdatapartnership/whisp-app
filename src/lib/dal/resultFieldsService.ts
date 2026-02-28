import { SystemCode } from '@/types/systemCodes';
import type { ResultField } from '@/types/models';
import { BaseCrudService } from './baseCrudService';
import { resultFieldMapping } from './mappings/resultFieldMapping';

class ResultFieldsService extends BaseCrudService<ResultField> {
  protected readonly tableName        = 'result_fields';
  protected readonly columnsMapping   = resultFieldMapping;
  protected readonly defaultOrderBy   = '"order" NULLS LAST, id';
  protected readonly onDuplicateError = SystemCode.RESULT_FIELDS_DUPLICATE_CODE;
}

const service = new ResultFieldsService();

export const getAllResultFields = ()                                              => service.getAll();
export const getResultField    = (id: string)                                    => service.getById(id);
export const createResultField = (data: ResultField)                             => service.create(data);
export const updateResultField = (id: string, data: Partial<ResultField>)        => service.update(id, data);
export const deleteResultField = (id: string)                                    => service.delete(id);
