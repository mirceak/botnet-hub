import type {
  HasOneCreateAssociationMixin,
  HasOneGetAssociationMixin,
  HasOneSetAssociationMixin,
  InferAttributes,
  InferCreationAttributes,
  Model
} from 'sequelize';

export const useHasOneMixin = <
  SourceEntityInstance extends Model<
    InferAttributes<SourceEntityInstance>,
    InferCreationAttributes<SourceEntityInstance>
  >,
  TargetEntity extends Model<
    InferAttributes<TargetEntity>,
    InferCreationAttributes<TargetEntity>
  >
>(
  sourceEntityInstance: SourceEntityInstance,
  targetEntityName: string
): HasOneMixin<TargetEntity> => {
  return {
    getEntity: (
      sourceEntityInstance as unknown as Record<
        string,
        HasOneGetAssociationMixin<TargetEntity>
      >
    )[`get${targetEntityName}`].bind(sourceEntityInstance),
    setEntity: (
      sourceEntityInstance as unknown as Record<
        string,
        HasOneSetAssociationMixin<TargetEntity, string | number>
      >
    )[`set${targetEntityName}`].bind(sourceEntityInstance),
    createEntity: (
      sourceEntityInstance as unknown as Record<
        string,
        HasOneCreateAssociationMixin<TargetEntity>
      >
    )[`create${targetEntityName}`].bind(sourceEntityInstance)
  };
};

export type HasOneMixin<
  TargetEntity extends Model<
    InferAttributes<TargetEntity>,
    InferCreationAttributes<TargetEntity>
  >
> = {
  getEntity: HasOneGetAssociationMixin<TargetEntity>;
  setEntity: HasOneSetAssociationMixin<TargetEntity, string | number>;
  createEntity: HasOneCreateAssociationMixin<TargetEntity>;
};
