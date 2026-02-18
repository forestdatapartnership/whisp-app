export interface BaseModel {
  code: string;
}

export interface AuditedModel extends BaseModel {
  createdAt?: Date;
  createdBy?: string;
  updatedAt?: Date;
  updatedBy?: string;
}
