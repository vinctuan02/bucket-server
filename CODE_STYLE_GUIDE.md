# Code Style Guide - Backend (NestJS)

Hướng dẫn này mô tả các quy tắc, cách đặt tên, cách viết API và cách chia hàm trong backend dựa trên module `file-node`.

---

## 1. Cấu Trúc Thư Mục Module

Mỗi module nên có cấu trúc như sau:

```
src/[module-name]/
├── [module-name].controller.ts      # Controller - xử lý HTTP requests
├── [module-name].module.ts          # Module - khai báo dependencies
├── const/                           # Hằng số, error messages
│   └── [module-name].const.ts
├── dto/                             # Data Transfer Objects (request/response)
│   └── [module-name].dto.ts
├── entities/                        # Database entities
│   └── [module-name].entity.ts
├── enum/                            # Enums
│   └── [module-name].enum.ts
├── fm/                              # Field mapping (cho Swagger)
│   └── [module-name].fm.ts
└── services/                        # Business logic
    ├── [module-name].service.ts
    └── [module-name]-[feature].service.ts
```

---

## 2. Cách Đặt Tên

### 2.1 File Names

- **Controller**: `[module-name].controller.ts` (vd: `file-node.controller.ts`)
- **Service**: `[module-name].service.ts` (vd: `file-node.service.ts`)
- **Entity**: `[module-name].entity.ts` (vd: `file-node.entity.ts`)
- **DTO**: `[module-name].dto.ts` (vd: `file-node.dto.ts`)
- **Module**: `[module-name].module.ts` (vd: `file-node.module.ts`)
- **Enum**: `[module-name].enum.ts` (vd: `file-node.enum.ts`)
- **Const**: `[module-name].const.ts` (vd: `file-node.const.ts`)

### 2.2 Class Names

- **Controller**: `[ModuleName]Controller` (vd: `FileManagerController`)
- **Service**: `[ModuleName]Service` (vd: `FileManagerService`)
- **Entity**: `[ModuleName]` (vd: `FileNode`)
- **DTO**: `[Action][ModuleName]Dto` (vd: `CreateFileDto`, `GetListFileNodeDto`)
- **Module**: `[ModuleName]Module` (vd: `FileNodeModule`)

### 2.3 Variable Names

- **Biến thường**: `camelCase` (vd: `fileNodeId`, `userId`, `currentUser`)
- **Hằng số**: `UPPER_SNAKE_CASE` (vd: `TYPE_FILE_NODE`, `DEFAULT_PAGE_SIZE`)
- **Private properties**: `private readonly [name]` (vd: `private readonly fileNodeRepo`)
- **Injected services**: `private readonly [serviceName]` (vd: `private readonly bucketSv`)

### 2.4 Function Names

- **Async functions**: `async [action][Entity]()` (vd: `async createFolder()`, `async getList()`)
- **Private helpers**: `private [action][Entity]()` (vd: `private validateAndGetParent()`)
- **Getters**: `get[Property]()` (vd: `getChildren()`)
- **Setters**: `set[Property]()` (vd: `setPermissions()`)

---

## 3. Khai Báo DTO (Request/Response)

### 3.1 Cấu Trúc DTO

```typescript
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
	IsArray,
	IsNotEmpty,
	IsNumber,
	IsOptional,
	IsString,
	IsUUID,
	MaxLength,
	Min,
	ValidateNested,
} from 'class-validator';

// DTO cho Create
export class CreateFolderDto {
	@ApiProperty({ example: 'My Folder', description: 'Folder name' })
	@IsString()
	@IsNotEmpty()
	name: string;

	@ApiPropertyOptional({
		example: 'uuid',
		description: 'Parent folder ID (UUID)',
	})
	@IsOptional()
	@IsUUID()
	fileNodeParentId?: string;
}

// DTO cho Update (extends Create)
export class UpdateFolderDto extends PartialType(CreateFolderDto) {}

// DTO cho Get List (extends BaseQueryDto)
export class GetListFileNodeDto extends BaseQueryDto {
	@ApiPropertyOptional({
		example: 'uuid',
		description: 'Filter by parent folder ID',
	})
	@IsOptional()
	@IsUUID()
	fileNodeParentId?: string;

	@ApiPropertyOptional({ example: 'name', description: 'Sort field' })
	@IsOptional()
	fieldOrder: FileNodeFM = FileNodeFM.name;

	@ApiPropertyOptional({
		example: 'ASC',
		description: 'Sort direction (ASC/DESC)',
	})
	@IsOptional()
	orderBy: OrderDirection = OrderDirection.ASC;
}

// DTO cho Bulk Update
export class BulkUpdateFileNodePermissionDto {
	@ApiPropertyOptional({
		type: [UpsertFileNodePermissionDto],
		description: 'Permissions to add/update',
	})
	@IsOptional()
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => UpsertFileNodePermissionDto)
	upsert?: UpsertFileNodePermissionDto[];

	@ApiPropertyOptional({
		type: [String],
		description: 'Permission IDs to remove',
	})
	@IsArray()
	@IsUUID('all', { each: true })
	@IsOptional()
	remove?: string[];
}
```

### 3.2 Decorators Thường Dùng

- `@ApiProperty()` - Bắt buộc, hiển thị trong Swagger
- `@ApiPropertyOptional()` - Tùy chọn, hiển thị trong Swagger
- `@IsNotEmpty()` - Không được để trống
- `@IsOptional()` - Tùy chọn
- `@IsString()`, `@IsNumber()`, `@IsUUID()` - Kiểm tra kiểu dữ liệu
- `@MaxLength()`, `@Min()` - Kiểm tra độ dài/giá trị
- `@ValidateNested()` - Kiểm tra nested objects
- `@Type()` - Transform dữ liệu (từ class-transformer)

---

## 4. Khai Báo Response

### 4.1 Success Response

```typescript
// Cách 1: Với data
return new ResponseSuccess({ data });

// Cách 2: Với custom message
return new ResponseSuccess({
	statusCode: 201,
	message: 'Folder created successfully',
	messageCode: 'file.folder.created',
	data,
});

// Cách 3: Với warning
return new ResponseSuccess({
	data,
	messageWarning: 'Some files were skipped',
});
```

### 4.2 Error Response

```typescript
// Throw error
throw FileNodeResponseError.FILE_NODE_NOT_FOUND();

// Hoặc custom error
throw new ResponseError({
	statusCode: 400,
	message: 'Invalid file node ID',
	messageCode: 'file.invalid_id',
});
```

### 4.3 Pagination Response

```typescript
// Trả về PageDto cho list APIs
const [items, totalItems] = await qb.getManyAndCount();
return new PageDto({
	items,
	metadata: { ...filter, totalItems },
});
```

---

## 5. Cách Viết API GET List

### 5.1 Controller

```typescript
@Get()
@ApiOperation({ summary: 'Get list of files/folders' })
@ApiQuery({ type: GetListFileNodeDto })
@ApiResponse({ status: 200, description: 'List of files/folders' })
async getList(
  @User() currentUser: CurrentUser,
  @Query() filter: GetListFileNodeDto,
) {
  const data = await this.service.getList({ currentUser, filter });
  return new ResponseSuccess({ data });
}
```

### 5.2 Service

```typescript
async getList({
  currentUser,
  filter,
}: {
  currentUser?: CurrentUser;
  filter: GetListFileNodeDto;
}) {
  const { fileNodeParentId, keywords, isDelete } = filter;

  // 1. Tạo query builder
  const qb = this.createQbUtils.createFileNodeQb();

  // 2. Join các relations cần thiết
  this.ormUtilsJoin.leftJoinFileNodeWithFileBucket(qb);

  // 3. Apply filters
  this.whereUtils.applyFilter({
    qb,
    filter: new OrmFilterDto({
      fileNodeParentId,
      keywordsFileNode: keywords,
      fileNodeIsDelete: isDelete,
      ...filter,
    }),
  });

  // 4. Kiểm tra permissions (nếu cần)
  if (currentUser) {
    const { userId, roles } = currentUser;

    if (roles && !roles.includes('Admin')) {
      qb.leftJoin(
        'fileNode.fileNodePermissions',
        'fileNodePermission',
      );
      qb.andWhere(
        new Brackets((qb1) => {
          qb1.where(
            'fileNodePermission.canView = true AND fileNodePermission.userId = :userId',
            { userId },
          ).orWhere('fileNode.ownerId = :userId', { userId });
        }),
      );
    }
  }

  // 5. Select các fields cần thiết
  qb.addSelect([
    'fileBucket.id',
    'fileBucket.fileName',
    'fileBucket.fileSize',
    'fileBucket.contentType',
  ]);

  // 6. Execute query và trả về PageDto
  const [items, totalItems] = await qb.getManyAndCount();
  return new PageDto({ items, metadata: { ...filter, totalItems } });
}
```

---

## 6. Cách Chia Hàm (Function Decomposition)

### 6.1 Nguyên Tắc

- **Single Responsibility**: Mỗi hàm chỉ làm một việc
- **Reusability**: Tách các logic chung thành hàm riêng
- **Readability**: Tên hàm phải rõ ràng, dễ hiểu
- **Testability**: Hàm nhỏ dễ test hơn

### 6.2 Ví Dụ: Tách Hàm Validate

```typescript
// ❌ Không tốt: Logic validate lẫn lộn trong create
async createFolder({ req, dto }: { req: Request; dto: CreateFolderDto }) {
  const { fileNodeParentId, name } = dto;
  const { userId } = parseReq(req);

  // Validate parent
  if (fileNodeParentId) {
    const parent = await this.fileNodeRepo.findOne({
      where: { id: fileNodeParentId },
    });
    if (!parent) throw new Error('Parent not found');
  }

  // Validate unique
  const existing = await this.fileNodeRepo.findOne({
    where: { fileNodeParentId, name, type: TYPE_FILE_NODE.FOLDER, ownerId: userId },
  });
  if (existing) throw new Error('Folder already exists');

  // Create
  const folder = this.createFileNode({...});
  return this.fileNodeRepo.save(folder);
}

// ✅ Tốt: Tách validate thành hàm riêng
async createFolder({ req, dto }: { req: Request; dto: CreateFolderDto }) {
  const { fileNodeParentId, name } = dto;
  const { userId } = parseReq(req);

  const parent = await this.validateAndGetParent(fileNodeParentId);
  await this.validateUniqueConstraint({
    fileNodeParentId,
    name,
    type: TYPE_FILE_NODE.FOLDER,
    ownerId: userId,
  });

  const folder = this.createFileNode({
    name,
    type: TYPE_FILE_NODE.FOLDER,
    ownerId: userId,
    parent,
  });

  return this.fileNodeRepo.save(folder);
}

// Helper functions
private async validateAndGetParent(fileNodeParentId?: string) {
  if (!fileNodeParentId) return null;

  const parent = await this.fileNodeRepo.findOne({
    where: { id: fileNodeParentId },
  });

  if (!parent) {
    throw FileNodeResponseError.PARENT_NOT_FOUND();
  }

  return parent;
}

private async validateUniqueConstraint({
  fileNodeParentId,
  name,
  type,
  ownerId,
}: {
  fileNodeParentId?: string;
  name: string;
  type: TYPE_FILE_NODE;
  ownerId: string;
}) {
  if (!fileNodeParentId) return;

  const existing = await this.fileNodeRepo.findOne({
    where: { fileNodeParentId, name, type, ownerId, isDelete: false },
  });

  if (existing) {
    throw FileNodeResponseError.DUPLICATE_NAME();
  }
}

private createFileNode({
  id,
  name,
  type,
  ownerId,
  parent,
  fileBucketId,
}: {
  id?: string;
  name: string;
  type: TYPE_FILE_NODE;
  ownerId: string;
  parent?: FileNode | null;
  fileBucketId?: string;
}): FileNode {
  const fileNode = new FileNode();
  if (id) fileNode.id = id;
  fileNode.name = name;
  fileNode.type = type;
  fileNode.ownerId = ownerId;
  fileNode.fileNodeParent = parent || null;
  fileNode.fileBucketId = fileBucketId || null;
  return fileNode;
}
```

### 6.3 Ví Dụ: Tách Hàm Permission Check

```typescript
// ❌ Không tốt: Permission check lẫn lộn trong getList
async getList({ currentUser, filter }: {...}) {
  const qb = this.createQbUtils.createFileNodeQb();

  // ... apply filters ...

  // Permission check lẫn lộn
  if (currentUser) {
    const { userId, roles } = currentUser;
    if (roles && !roles.includes('Admin')) {
      qb.leftJoin('fileNode.fileNodePermissions', 'fileNodePermission');
      qb.andWhere(
        new Brackets((qb1) => {
          qb1.where(
            'fileNodePermission.canView = true AND fileNodePermission.userId = :userId',
            { userId },
          ).orWhere('fileNode.ownerId = :userId', { userId });
        }),
      );
    }
  }

  const [items, totalItems] = await qb.getManyAndCount();
  return new PageDto({ items, metadata: { ...filter, totalItems } });
}

// ✅ Tốt: Tách permission check thành hàm riêng
async getList({ currentUser, filter }: {...}) {
  const qb = this.createQbUtils.createFileNodeQb();

  // ... apply filters ...

  this.applyPermissionFilter(qb, currentUser);

  const [items, totalItems] = await qb.getManyAndCount();
  return new PageDto({ items, metadata: { ...filter, totalItems } });
}

private applyPermissionFilter(qb: SelectQueryBuilder<FileNode>, currentUser?: CurrentUser) {
  if (!currentUser) return;

  const { userId, roles } = currentUser;

  if (roles && !roles.includes('Admin')) {
    qb.leftJoin('fileNode.fileNodePermissions', 'fileNodePermission');
    qb.andWhere(
      new Brackets((qb1) => {
        qb1.where(
          'fileNodePermission.canView = true AND fileNodePermission.userId = :userId',
          { userId },
        ).orWhere('fileNode.ownerId = :userId', { userId });
      }),
    );
  }
}
```

### 6.4 Ví Dụ: Tách Hàm Query Building

```typescript
// ✅ Tốt: Tách query building thành hàm riêng
async getList({ currentUser, filter }: {...}) {
  const qb = this.buildFileNodeQuery(filter, currentUser);
  const [items, totalItems] = await qb.getManyAndCount();
  return new PageDto({ items, metadata: { ...filter, totalItems } });
}

private buildFileNodeQuery(
  filter: GetListFileNodeDto,
  currentUser?: CurrentUser,
): SelectQueryBuilder<FileNode> {
  const qb = this.createQbUtils.createFileNodeQb();

  this.ormUtilsJoin.leftJoinFileNodeWithFileBucket(qb);
  this.applyFilters(qb, filter);
  this.applyPermissionFilter(qb, currentUser);
  this.selectRequiredFields(qb);

  return qb;
}

private applyFilters(qb: SelectQueryBuilder<FileNode>, filter: GetListFileNodeDto) {
  const { fileNodeParentId, keywords, isDelete } = filter;

  this.whereUtils.applyFilter({
    qb,
    filter: new OrmFilterDto({
      fileNodeParentId,
      keywordsFileNode: keywords,
      fileNodeIsDelete: isDelete,
      ...filter,
    }),
  });
}

private selectRequiredFields(qb: SelectQueryBuilder<FileNode>) {
  qb.addSelect([
    'fileBucket.id',
    'fileBucket.fileName',
    'fileBucket.fileSize',
    'fileBucket.contentType',
  ]);
}
```

---

## 7. Cách Viết Controller

### 7.1 Cấu Trúc Controller

```typescript
@ApiTags('File Manager')
@ApiBearerAuth()
@Controller('file-manager')
export class FileManagerController {
	constructor(
		private readonly service: FileManagerService,
		private readonly downloadService: FileNodeDownloadService,
	) {}

	// POST endpoints
	@Post('folder')
	@ApiOperation({ summary: 'Create a new folder' })
	@ApiBody({ type: CreateFolderDto })
	@ApiResponse({ status: 201, description: 'Folder created successfully' })
	async createFolder(@Req() req: Request, @Body() dto: CreateFolderDto) {
		const data = await this.service.createFolder({ req, dto });
		return new ResponseSuccess({ data });
	}

	// GET endpoints
	@Get()
	@ApiOperation({ summary: 'Get list of files/folders' })
	@ApiQuery({ type: GetListFileNodeDto })
	@ApiResponse({ status: 200, description: 'List of files/folders' })
	async getList(
		@User() currentUser: CurrentUser,
		@Query() filter: GetListFileNodeDto,
	) {
		const data = await this.service.getList({ currentUser, filter });
		return new ResponseSuccess({ data });
	}

	// PUT endpoints
	@Put(':id/restore')
	@ApiOperation({ summary: 'Restore file/folder from trash' })
	@ApiParam({
		name: 'id',
		type: 'string',
		description: 'File/Folder ID (UUID)',
	})
	@ApiResponse({
		status: 200,
		description: 'File/folder restored successfully',
	})
	async restore(@Param('id') id: string) {
		const data = await this.service.restore(id);
		return new ResponseSuccess({ data });
	}

	// DELETE endpoints
	@Delete(':id')
	@ApiOperation({ summary: 'Soft delete file/folder (move to trash)' })
	@ApiParam({
		name: 'id',
		type: 'string',
		description: 'File/Folder ID (UUID)',
	})
	@ApiResponse({
		status: 200,
		description: 'File/folder deleted successfully',
	})
	async delete(@Req() req: Request, @Param('id') id: string) {
		await this.service.delete(id);
	}
}
```

### 7.2 Decorators Thường Dùng

- `@ApiTags()` - Nhóm endpoints trong Swagger
- `@ApiBearerAuth()` - Yêu cầu Bearer token
- `@ApiOperation()` - Mô tả endpoint
- `@ApiBody()` - Mô tả request body
- `@ApiQuery()` - Mô tả query parameters
- `@ApiParam()` - Mô tả path parameters
- `@ApiResponse()` - Mô tả response

---

## 8. Cách Viết Service

### 8.1 Cấu Trúc Service

```typescript
@Injectable()
export class FileManagerService {
  private readonly logger = new Logger(FileManagerService.name);

  constructor(
    @InjectRepository(FileNode)
    private readonly fileNodeRepo: TreeRepository<FileNode>,

    private readonly configService: ConfigService,
    private readonly bucketSv: BucketService,
    private readonly createQbUtils: OrmUtilsCreateQb,
    private readonly whereUtils: OrmUtilsWhere,
    private readonly selectUtils: OrmUtilsSelect,
    private readonly userStorageService: UserStorageService,
    private readonly fileNodePermissionSv: FileNodePermissionService,
    private readonly ormUtilsJoin: OrmUtilsJoin,
  ) {}

  // CREATE operations
  async createFolder({ req, dto }: { req: Request; dto: CreateFolderDto }) {
    // Implementation
  }

  // READ operations
  async findOne(id: string) {
    // Implementation
  }

  async getList({ currentUser, filter }: {...}) {
    // Implementation
  }

  // UPDATE operations
  async upsertPermissions({...}) {
    // Implementation
  }

  // DELETE operations
  async delete(id: string) {
    // Implementation
  }

  // PRIVATE HELPERS
  private async validateAndGetParent(fileNodeParentId?: string) {
    // Implementation
  }

  private createFileNode({...}): FileNode {
    // Implementation
  }
}
```

### 8.2 Thứ Tự Hàm Trong Service

1. Constructor
2. Public CREATE methods
3. Public READ methods
4. Public UPDATE methods
5. Public DELETE methods
6. Private helper methods

---

## 9. Cách Viết Entity

### 9.1 Cấu Trúc Entity

```typescript
@Entity('file_node')
@Tree('closure-table')
@Unique(['fileNodeParentId', 'type', 'name', 'isDelete', 'ownerId'])
export class FileNode extends BaseUUIDEntity {
	// Columns
	@Column({ type: 'varchar', length: 255 })
	name: string;

	@Column({ type: 'enum', enum: TYPE_FILE_NODE })
	type: TYPE_FILE_NODE;

	@Column({ type: 'uuid', nullable: true })
	fileBucketId: string | null;

	@Column({ type: 'uuid' })
	ownerId: string;

	@Column({ type: 'boolean', default: false })
	isDelete: boolean;

	// Relations
	@OneToOne(() => FileBucket, { nullable: true })
	@JoinColumn({ name: 'file_bucket_id' })
	fileBucket?: FileBucket | null;

	@ManyToOne(() => User)
	@JoinColumn({ name: 'owner_id' })
	owner: User;

	@TreeParent()
	@JoinColumn({ name: 'file_node_parent_id' })
	fileNodeParent: FileNode | null;

	@TreeChildren()
	fileNodeChildren: FileNode[];

	@OneToMany(() => FileNodePermission, (fnp) => fnp.fileNode)
	fileNodePermissions: FileNodePermission[];
}
```

### 9.2 Decorators Thường Dùng

- `@Entity()` - Khai báo entity
- `@Column()` - Khai báo column
- `@OneToOne()` - Quan hệ 1-1
- `@OneToMany()` - Quan hệ 1-n
- `@ManyToOne()` - Quan hệ n-1
- `@JoinColumn()` - Khai báo foreign key
- `@Unique()` - Unique constraint
- `@Tree()` - Khai báo tree structure

---

## 10. Cách Viết Module

### 10.1 Cấu Trúc Module

```typescript
@Module({
	imports: [
		TypeOrmModule.forFeature([FileNode]),
		OrmUtilsModule,
		BucketModule,
		UserStorageModule,
		FileNodePermissionModule,
	],
	controllers: [FileManagerController],
	providers: [FileManagerService, FileNodeDownloadService],
	exports: [FileManagerService, FileNodeDownloadService],
})
export class FileNodeModule {}
```

### 10.2 Quy Tắc

- Import các modules cần thiết
- Khai báo controllers
- Khai báo providers (services)
- Export services nếu module khác cần dùng

---

## 11. Cách Xử Lý Errors

### 11.1 Tạo Error Constants

```typescript
// const/file-node.const.ts
export const FileNodeResponseError = {
	FILE_NODE_NOT_FOUND: () =>
		new ResponseError({
			statusCode: 404,
			message: 'File node not found',
			messageCode: 'file.not_found',
		}),

	DUPLICATE_NAME: () =>
		new ResponseError({
			statusCode: 400,
			message: 'File/folder with this name already exists',
			messageCode: 'file.duplicate_name',
		}),

	PARENT_NOT_FOUND: () =>
		new ResponseError({
			statusCode: 404,
			message: 'Parent folder not found',
			messageCode: 'file.parent_not_found',
		}),
};
```

### 11.2 Sử Dụng Error

```typescript
// Trong service
if (!entity) {
	throw FileNodeResponseError.FILE_NODE_NOT_FOUND();
}
```

---

## 12. Best Practices

### 12.1 Naming Conventions

✅ **Tốt**

```typescript
async createFolder({ req, dto }: { req: Request; dto: CreateFolderDto }) {}
async getList({ currentUser, filter }: {...}) {}
async findOneWithChildren(id: string) {}
private validateAndGetParent(fileNodeParentId?: string) {}
```

❌ **Không tốt**

```typescript
async create(r, d) {}
async list(u, f) {}
async find1(id) {}
private validate(id) {}
```

### 12.2 Function Parameters

✅ **Tốt**: Dùng object destructuring

```typescript
async createFolder({ req, dto }: { req: Request; dto: CreateFolderDto }) {}
```

❌ **Không tốt**: Nhiều parameters

```typescript
async createFolder(req: Request, dto: CreateFolderDto) {}
```

### 12.3 Return Types

✅ **Tốt**: Luôn khai báo return type

```typescript
async getList({...}): Promise<PageDto<FileNode>> {}
private validateAndGetParent(id?: string): Promise<FileNode | null> {}
```

❌ **Không tốt**: Không khai báo return type

```typescript
async getList({...}) {}
private validateAndGetParent(id?: string) {}
```

### 12.4 Comments

✅ **Tốt**: Comment cho logic phức tạp

```typescript
// Kiểm tra permissions cho non-admin users
if (roles && !roles.includes('Admin')) {
	qb.leftJoin('fileNode.fileNodePermissions', 'fileNodePermission');
	// ...
}
```

❌ **Không tốt**: Comment rõ ràng

```typescript
// Lấy danh sách
const items = await qb.getMany();
```

---

## 13. Tóm Tắt Quy Tắc Chính

| Yếu Tố              | Quy Tắc                                      |
| ------------------- | -------------------------------------------- |
| **File Names**      | `kebab-case` (vd: `file-node.controller.ts`) |
| **Class Names**     | `PascalCase` (vd: `FileManagerService`)      |
| **Variables**       | `camelCase` (vd: `fileNodeId`)               |
| **Constants**       | `UPPER_SNAKE_CASE` (vd: `TYPE_FILE_NODE`)    |
| **Functions**       | `camelCase` (vd: `createFolder()`)           |
| **DTO Naming**      | `[Action][Entity]Dto` (vd: `CreateFileDto`)  |
| **Service Methods** | `async [action][Entity]()`                   |
| **Private Methods** | `private [action][Entity]()`                 |
| **Response**        | `new ResponseSuccess({ data })`              |
| **Error**           | `throw ErrorConstant.ERROR_NAME()`           |
| **Pagination**      | `new PageDto({ items, metadata })`           |

---

Hãy tuân theo hướng dẫn này để đảm bảo code consistency và dễ bảo trì!
