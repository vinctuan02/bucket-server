import { RoleFieldMapping } from 'src/orm-utils/field-mapping/orm.role.fm';

export enum RoleFieldOrder {
	NAME = RoleFieldMapping.NAME,
	DESCRIPTION = RoleFieldMapping.DESCRIPTION,
	CREATE_AT = RoleFieldMapping.CREATED_AT,
	UPDATE_AT = RoleFieldMapping.UPDATED_AT,
}
