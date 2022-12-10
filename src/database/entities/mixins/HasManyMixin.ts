import type {
  HasManyAddAssociationMixin,
  HasManyAddAssociationsMixin,
  HasManyCountAssociationsMixin,
  HasManyCreateAssociationMixin,
  HasManyGetAssociationsMixin,
  HasManyHasAssociationMixin,
  HasManyHasAssociationsMixin,
  HasManyRemoveAssociationMixin,
  HasManyRemoveAssociationsMixin,
  HasManySetAssociationsMixin,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from 'sequelize';

export const useHasManyMixin = <
  SourceEntityInstance extends Model<
    InferAttributes<SourceEntityInstance>,
    InferCreationAttributes<SourceEntityInstance>
  >,
  TargetEntity extends Model<
    InferAttributes<TargetEntity>,
    InferCreationAttributes<TargetEntity>
  >,
>(
  sourceEntityInstance: SourceEntityInstance,
  targetEntityName: string,
): HasManyMixin<TargetEntity> => {
  return {
    getEntities: (
      sourceEntityInstance as unknown as Record<
        string,
        HasManyGetAssociationsMixin<TargetEntity>
      >
    )[`get${targetEntityName}s`].bind(sourceEntityInstance),
    addEntity: (
      sourceEntityInstance as unknown as Record<
        string,
        HasManyAddAssociationMixin<TargetEntity, string | number>
      >
    )[`add${targetEntityName}`].bind(sourceEntityInstance),
    addEntities: (
      sourceEntityInstance as unknown as Record<
        string,
        HasManyAddAssociationsMixin<TargetEntity, string | number>
      >
    )[`add${targetEntityName}s`].bind(sourceEntityInstance),
    setEntities: (
      sourceEntityInstance as unknown as Record<
        string,
        HasManySetAssociationsMixin<TargetEntity, string | number>
      >
    )[`set${targetEntityName}s`].bind(sourceEntityInstance),
    removeEntity: (
      sourceEntityInstance as unknown as Record<
        string,
        HasManyRemoveAssociationMixin<TargetEntity, string | number>
      >
    )[`remove${targetEntityName}`].bind(sourceEntityInstance),
    removeEntities: (
      sourceEntityInstance as unknown as Record<
        string,
        HasManyRemoveAssociationsMixin<TargetEntity, string | number>
      >
    )[`remove${targetEntityName}s`].bind(sourceEntityInstance),
    hasEntity: (
      sourceEntityInstance as unknown as Record<
        string,
        HasManyHasAssociationMixin<TargetEntity, string | number>
      >
    )[`has${targetEntityName}`].bind(sourceEntityInstance),
    hasEntities: (
      sourceEntityInstance as unknown as Record<
        string,
        HasManyHasAssociationsMixin<TargetEntity, string | number>
      >
    )[`has${targetEntityName}s`].bind(sourceEntityInstance),
    countEntities: (
      sourceEntityInstance as unknown as Record<
        string,
        HasManyCountAssociationsMixin
      >
    )[`count${targetEntityName}s`].bind(sourceEntityInstance),
    createEntity: (
      sourceEntityInstance as unknown as Record<
        string,
        HasManyCreateAssociationMixin<TargetEntity>
      >
    )[`create${targetEntityName}`].bind(sourceEntityInstance),
  };
};

export type HasManyMixin<
  TargetEntity extends Model<
    InferAttributes<TargetEntity>,
    InferCreationAttributes<TargetEntity>
  >,
> = {
  getEntities: HasManyGetAssociationsMixin<TargetEntity>;
  addEntity: HasManyAddAssociationMixin<TargetEntity, string | number>;
  addEntities: HasManyAddAssociationsMixin<TargetEntity, string | number>;
  setEntities: HasManySetAssociationsMixin<TargetEntity, string | number>;
  removeEntity: HasManyRemoveAssociationMixin<TargetEntity, string | number>;
  removeEntities: HasManyRemoveAssociationsMixin<TargetEntity, string | number>;
  hasEntity: HasManyHasAssociationMixin<TargetEntity, string | number>;
  hasEntities: HasManyHasAssociationsMixin<TargetEntity, string | number>;
  countEntities: HasManyCountAssociationsMixin;
  createEntity: HasManyCreateAssociationMixin<TargetEntity>;
};
