import { SystemCode } from '@/types/systemCodes';
import type { Commodity } from '@/types/models';
import { BaseCrudService } from './baseCrudService';
import { commodityMapping } from './mappings/commodityMapping';

class CommoditiesService extends BaseCrudService<Commodity> {
  protected readonly tableName        = 'commodities';
  protected readonly columnsMapping   = commodityMapping;
  protected readonly defaultOrderBy   = 'id';
  protected readonly onDuplicateError = SystemCode.COMMODITIES_DUPLICATE_CODE;
}

const service = new CommoditiesService();

export const getAllCommodities = ()                                           => service.getAll();
export const getCommodity      = (id: string)                                => service.getById(id);
export const createCommodity   = (data: Commodity)                           => service.create(data);
export const updateCommodity   = (id: string, data: Partial<Commodity>)      => service.update(id, data);
export const deleteCommodity   = (id: string)                                => service.delete(id);
