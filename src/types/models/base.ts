export interface BaseModel {
  id: string;
}

export interface AuditedModel extends BaseModel {
  createdAt?: Date;
  createdBy?: string;
  updatedAt?: Date;
  updatedBy?: string;
}
