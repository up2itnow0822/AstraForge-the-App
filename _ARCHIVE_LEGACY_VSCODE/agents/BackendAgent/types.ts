/**
* BackendAgent - Backend Implementation Agent
* Generates backend services, APIs, and database schemas
*/

import { z } from 'zod';

/**
* Implementation plan structure
*/
export interface ImplementationPlan {
/** Plan ID */
planId: string;

/** Architecture reference */
architectureRef: string;

/** Services to implement */
services: ServiceDefinition[];

/** APIs to implement */
apis: APIEndpoint[];

/** Database schemas to implement */
databases: DatabaseSchema[];

/** Security requirements */
security: SecurityRequirement[];

/** Testing strategy */
testing: TestingStrategy;

/** Deployment configuration */
deployment: DeploymentConfig;

/** Estimated effort */
estimatedEffort: 'low' | 'medium' | 'high' | 'critical';
}

/**
* Service definition
*/
export interface ServiceDefinition {
/** Service ID */
serviceId: string;

/** Service name */
name: string;

/** Component reference */
componentRef: string;

/** Technology stack */
technology: string;

/** Responsibilities and features */
responsibilities: string[];

/** Dependencies on other services */
dependencies: string[];

/** API interfaces */
interfaces: InterfaceDefinition[];
}

/**
* Interface definition
*/
export interface InterfaceDefinition {
/** Interface ID */
interfaceId: string;

/** Interface type */
type: 'REST' | 'GraphQL' | 'gRPC' | 'websocket' | 'message-queue';

/** Endpoints or operations */
operations: OperationDefinition[];
}

/**
* Operation definition
*/
export interface OperationDefinition {
/** Operation ID */
operationId: string;

/** HTTP method or operation type */
method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/** Endpoint path or operation name */
path: string;

/** Description */
description: string;

/** Input parameters */
parameters: ParameterDefinition[];

/** Response format */
response: ResponseDefinition;

/** Security requirements */
security: string[];
}

/**
* Parameter definition
*/
export interface ParameterDefinition {
/** Parameter name */
name: string;

/** Parameter type */
type: 'string' | 'number' | 'boolean' | 'object' | 'array';

/** Is parameter required */
required: boolean;

/** Parameter description */
description: string;

/** Validation rules */
validation?: ValidationRule;
}

/**
* Validation rule
*/
export interface ValidationRule {
/** Minimum length for strings */
minLength?: number;

/** Maximum length for strings */
maxLength?: number;

/** Minimum value for numbers */
minValue?: number;

/** Maximum value for numbers */
maxValue?: number;

/** Regular expression pattern */
pattern?: string;

/** Required fields for objects */
requiredFields?: string[];
}

/**
* Response definition
*/
export interface ResponseDefinition {
/** Response status code */
statusCode: number;

/** Response body schema */
bodySchema?: Record<string, any>;

/** Error codes */
errorCodes?: ErrorCodeDefinition[];
}

/**
* Error code definition
*/
export interface ErrorCodeDefinition {
/** Error code */
code: string;

/** HTTP status code for this error */
statusCode: number;

/** Error description */
description: string;
}

/**
* API endpoint specification
*/
export interface APIEndpoint {
/** Endpoint ID */
endpointId: string;

/** Service reference */
serviceRef: string;

/** Endpoint type */
type: 'REST' | 'GraphQL' | 'gRPC';

/** Base path */
basePath: string;

/** Operations */
operations: OperationDefinition[];

/** Authentication method */
authentication: 'JWT' | 'OAuth2' | 'APIKey' | 'Basic' | 'None';

/** Rate limiting */
rateLimiting: {
requestsPerMinute: number;
burstLimit: number;
};
}

/**
* Database schema definition
*/
export interface DatabaseSchema {
/** Schema ID */
schemaId: string;

/** Database type */
databaseType: 'PostgreSQL' | 'MySQL' | 'MongoDB' | 'Redis' | 'Cassandra';

/** Schema name */
name: string;

/** Tables or collections */
tables: TableDefinition[];

/** Indexes */
indexes: IndexDefinition[];

/** Relationships */
relationships: RelationshipDefinition[];
}

/**
* Table/collection definition
*/
export interface TableDefinition {
/** Table ID */
tableId: string;

/** Table name */
name: string;

/** Columns/fields */
columns: ColumnDefinition[];

/** Primary key */
primaryKey: string[];

/** Foreign keys */
foreignKeys: ForeignKeyDefinition[];

/** Constraints */
constraints: ConstraintDefinition[];
}

/**
* Column/field definition
*/
export interface ColumnDefinition {
/** Column name */
name: string;

/** Column type */
type: string;

/** Is column nullable */
nullable: boolean;

/** Default value */
defaultValue?: any;

/** Column description */
description: string;

/** Validation rules */
validation?: ValidationRule;
}

/**
* Foreign key definition
*/
export interface ForeignKeyDefinition {
/** Foreign key name */
name: string;

/** Referenced table */
referencedTable: string;

/** Referenced columns */
referencedColumns: string[];
}

/**
* Constraint definition
*/
export interface ConstraintDefinition {
/** Constraint type */
type: 'UNIQUE' | 'CHECK' | 'NOT_NULL';

/** Constraint name */
name: string;

/** Constraint condition */
condition?: string;
}

/**
* Index definition
*/
export interface IndexDefinition {
/** Index name */
name: string;

/** Table/collection */
tableName: string;

/** Indexed columns */
columns: string[];

/** Index type */
type: 'PRIMARY' | 'UNIQUE' | 'INDEX' | 'FULLTEXT';

/** Performance characteristics */
performance: string;
}

/**
* Relationship definition
*/
export interface RelationshipDefinition {
/** Relationship ID */
relationshipId: string;

/** From table */
fromTable: string;

/** To table */
toTable: string;

/** Relationship type */
type: 'ONE_TO_ONE' | 'ONE_TO_MANY' | 'MANY_TO_MANY';

/** Relationship description */
description: string;
}

/**
* Security requirement
*/
export interface SecurityRequirement {
/** Category */
category: 'authentication' | 'authorization' | 'data-protection' | 'input-validation' | 'rate-limiting';

/** Requirement */
requirement: string;

/** Implementation approach */
implementation: string;

/** Priority */
priority: 'low' | 'medium' | 'high' | 'critical';
}

/**
* Testing strategy
*/
export interface TestingStrategy {
/** Unit testing */
unitTesting: {
framework: string;
coverageTarget: number;
};

/** Integration testing */
integrationTesting: {
framework: string;
scope: string;
};

/** E2E testing */
e2eTesting: {
framework: string;
coverage: string;
};

/** Performance testing */
performanceTesting: {
framework: string;
benchmarks: string[];
};
}

/**
* Deployment configuration
*/
export interface DeploymentConfig {
/** Environment */
environment: 'development' | 'staging' | 'production';

/** Deployment strategy */
strategy: 'container' | 'serverless' | 'vm';

/** Infrastructure */
infrastructure: 'cloud' | 'on-premise' | 'hybrid';

/** Platform */
platform: 'AWS' | 'GCP' | 'Azure' | 'Kubernetes' | 'Docker';

/** Configuration */
configuration: Record<string, any>;
}

/**
* Generated service code
*/
export interface ServiceCode {
/** Service ID */
serviceId: string;

/** Service name */
name: string;

/** Generated code */
code: string;

/** File structure */
files: CodeFile[];

/** Dependencies */
dependencies: string[];
}

/**
* Code file definition
*/
export interface CodeFile {
/** File path */
path: string;

/** File content */
content: string;

/** File type */
type: 'source' | 'test' | 'config';

/** Language */
language: string;
}

/**
* Generated API implementation
*/
export interface APIImplementation {
/** Implementation ID */
implementationId: string;

/** Endpoint reference */
endpointRef: string;

/** Generated code */
code: CodeFile[];

/** Test cases */
tests: TestCase[];
}

/**
* Test case
*/
export interface TestCase {
/** Test ID */
testId: string;

/** Test name */
name: string;

/** Test description */
description: string;

/** Test steps */
steps: TestStep[];

/** Expected results */
expected: TestResult;
}

/**
* Test step
*/
export interface TestStep {
/** Step number */
stepNumber: number;

/** Action */
action: string;

/** Input data */
input?: any;

/** Expected result */
expected: string;
}

/**
* Test result
*/
export interface TestResult {
/** Status */
status: 'PASS' | 'FAIL' | 'BLOCKED';

/** Output */
output: any;

/** Assertions */
assertions: Assertion[];
}

/**
* Assertion
*/
export interface Assertion {
/** Assertion type */
type: 'equal' | 'not-equal' | 'contains' | 'exists' | 'match';

/** Expected value */
expected: any;

/** Actual value */
actual?: any;

/** Status */
status: 'PASS' | 'FAIL';
}

/**
* Generated database schema
*/
export interface SchemaSQL {
/** Schema ID */
schemaId: string;

/** Database type */
databaseType: string;

/** Generated SQL/code */
code: string;

/** File structure */
files: CodeFile[];

/** Migration scripts */
migrations: MigrationScript[];
}

/**
* Migration script
*/
export interface MigrationScript {
/** Script version */
version: string;

/** Script description */
description: string;

/** Script content */
script: string;

/** Rollback content */
rollback: string;
}

/**
* Secure service with security layer
*/
export interface SecureService {
/** Service reference */
serviceRef: string;

/** Security layer code */
securityLayer: CodeFile[];

/** Authentication implementation */
authentication: CodeFile[];

/** Authorization implementation */
authorization: CodeFile[];

/** Input validation */
validation: CodeFile[];

/** Security configurations */
configurations: Record<string, any>;
}

/**
* Backend agent execution result
*/
export interface BackendAgentOutput {
planId: string;
services: ServiceCode[];
apis: APIImplementation[];
schemas: SchemaSQL[];
securityLayers: SecureService[];
}

/**
* Zod schemas for runtime validation
*/
export const ValidationRuleSchema = z.object({
minLength: z.number().optional(),
maxLength: z.number().optional(),
minValue: z.number().optional(),
maxValue: z.number().optional(),
pattern: z.string().optional(),
requiredFields: z.array(z.string()).optional()
});

export const ParameterDefinitionSchema = z.object({
name: z.string().min(1, "Parameter name is required"),
type: z.enum(["string", "number", "boolean", "object", "array"]),
required: z.boolean(),
description: z.string().min(1, "Parameter description is required"),
validation: ValidationRuleSchema.optional()
});

export const ResponseDefinitionSchema = z.object({
statusCode: z.number().int().min(100),
bodySchema: z.record(z.any()).optional(),
errorCodes: z.array(z.object({
code: z.string(),
statusCode: z.number().int(),
description: z.string()
})).optional()
});

export const ErrorCodeDefinitionSchema = z.object({
code: z.string().min(1, "Error code is required"),
statusCode: z.number().int().min(400),
description: z.string().min(1, "Error description is required")
});

export const OperationDefinitionSchema = z.object({
operationId: z.string().min(1, "Operation ID is required"),
method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]),
path: z.string().min(1, "Path is required"),
description: z.string().min(1, "Description is required"),
parameters: z.array(ParameterDefinitionSchema),
response: ResponseDefinitionSchema,
security: z.array(z.string())
});

export const InterfaceDefinitionSchema = z.object({
interfaceId: z.string().min(1, "Interface ID is required"),
type: z.enum(["REST", "GraphQL", "gRPC", "websocket", "message-queue"]),
operations: z.array(OperationDefinitionSchema).min(1, "At least one operation is required")
});

export const ServiceDefinitionSchema = z.object({
serviceId: z.string().min(1, "Service ID is required"),
name: z.string().min(1, "Service name is required"),
componentRef: z.string(),
technology: z.string().min(1, "Technology stack is required"),
responsibilities: z.array(z.string()).min(1, "At least one responsibility is required"),
dependencies: z.array(z.string()),
interfaces: z.array(InterfaceDefinitionSchema).min(1, "At least one interface is required")
});

export const APIEndpointSchema = z.object({
endpointId: z.string().min(1, "Endpoint ID is required"),
serviceRef: z.string().min(1, "Service reference is required"),
type: z.enum(["REST", "GraphQL", "gRPC"]),
basePath: z.string().min(1, "Base path is required"),
operations: z.array(OperationDefinitionSchema).min(1, "At least one operation is required"),
authentication: z.enum(["JWT", "OAuth2", "APIKey", "Basic", "None"]),
rateLimiting: z.object({
requestsPerMinute: z.number().int().positive(),
burstLimit: z.number().int().positive()
})
});

export const ForeignKeyDefinitionSchema = z.object({
name: z.string().min(1, "Foreign key name is required"),
referencedTable: z.string().min(1, "Referenced table is required"),
referencedColumns: z.array(z.string()).min(1, "Referenced columns are required")
});

export const ConstraintDefinitionSchema = z.object({
type: z.enum(["UNIQUE", "CHECK", "NOT_NULL"]),
name: z.string().min(1, "Constraint name is required"),
condition: z.string().optional()
});

export const ColumnDefinitionSchema = z.object({
name: z.string().min(1, "Column name is required"),
type: z.string().min(1, "Column type is required"),
nullable: z.boolean(),
defaultValue: z.any().optional(),
description: z.string().min(1, "Column description is required"),
validation: ValidationRuleSchema.optional()
});

export const TableDefinitionSchema = z.object({
tableId: z.string().min(1, "Table ID is required"),
name: z.string().min(1, "Table name is required"),
columns: z.array(ColumnDefinitionSchema).min(1, "At least one column is required"),
primaryKey: z.array(z.string()).min(1, "Primary key is required"),
foreignKeys: z.array(ForeignKeyDefinitionSchema),
constraints: z.array(ConstraintDefinitionSchema)
});

export const IndexDefinitionSchema = z.object({
name: z.string().min(1, "Index name is required"),
tableName: z.string().min(1, "Table name is required"),
columns: z.array(z.string()).min(1, "At least one column is required"),
type: z.enum(["PRIMARY", "UNIQUE", "INDEX", "FULLTEXT"]),
performance: z.string()
});

export const RelationshipDefinitionSchema = z.object({
relationshipId: z.string().min(1, "Relationship ID is required"),
fromTable: z.string().min(1, "From table is required"),
toTable: z.string().min(1, "To table is required"),
type: z.enum(["ONE_TO_ONE", "ONE_TO_MANY", "MANY_TO_MANY"]),
description: z.string()
});

export const DatabaseSchemaSchema = z.object({
schemaId: z.string().min(1, "Schema ID is required"),
databaseType: z.enum(["PostgreSQL", "MySQL", "MongoDB", "Redis", "Cassandra"]),
name: z.string().min(1, "Schema name is required"),
tables: z.array(TableDefinitionSchema).min(1, "At least one table is required"),
indexes: z.array(IndexDefinitionSchema),
relationships: z.array(RelationshipDefinitionSchema)
});

export const SecurityRequirementSchema = z.object({
category: z.enum(["authentication", "authorization", "data-protection", "input-validation", "rate-limiting"]),
requirement: z.string().min(1, "Security requirement is required"),
implementation: z.string().min(1, "Implementation approach is required"),
priority: z.enum(["low", "medium", "high", "critical"])
});

export const TestingStrategySchema = z.object({
unitTesting: z.object({
framework: z.string().min(1, "Unit testing framework is required"),
coverageTarget: z.number().min(0).max(100)
}),
integrationTesting: z.object({
framework: z.string().min(1, "Integration testing framework is required"),
scope: z.string()
}),
e2eTesting: z.object({
framework: z.string().min(1, "E2E testing framework is required"),
coverage: z.string()
}),
performanceTesting: z.object({
framework: z.string().min(1, "Performance testing framework is required"),
benchmarks: z.array(z.string())
})
});

export const DeploymentConfigSchema = z.object({
environment: z.enum(["development", "staging", "production"]),
strategy: z.enum(["container", "serverless", "vm"]),
infrastructure: z.enum(["cloud", "on-premise", "hybrid"]),
platform: z.enum(["AWS", "GCP", "Azure", "Kubernetes", "Docker"]),
configuration: z.record(z.any())
});

export const ImplementationPlanSchema = z.object({
planId: z.string().min(1, "Plan ID is required"),
architectureRef: z.string(),
services: z.array(ServiceDefinitionSchema).min(1, "At least one service is required"),
apis: z.array(APIEndpointSchema),
databases: z.array(DatabaseSchemaSchema),
security: z.array(SecurityRequirementSchema),
testing: TestingStrategySchema,
deployment: DeploymentConfigSchema,
estimatedEffort: z.enum(["low", "medium", "high", "critical"])
});

export const CodeFileSchema = z.object({
path: z.string().min(1, "File path is required"),
content: z.string().min(1, "File content is required"),
type: z.enum(["source", "test", "config"]),
language: z.string().min(1, "Language is required")
});

export const ServiceCodeSchema = z.object({
serviceId: z.string().min(1, "Service ID is required"),
name: z.string().min(1, "Service name is required"),
code: z.string().min(1, "Generated code is required"),
files: z.array(CodeFileSchema).min(1, "At least one file is required"),
dependencies: z.array(z.string())
});

export const TestStepSchema = z.object({
stepNumber: z.number().int().positive(),
action: z.string().min(1, "Action is required"),
input: z.any().optional(),
expected: z.string()
});

export const TestResultSchema = z.object({
status: z.enum(["PASS", "FAIL", "BLOCKED"]),
output: z.any(),
assertions: z.array(z.object({
type: z.enum(["equal", "not-equal", "contains", "exists", "match"]),
expected: z.any(),
actual: z.any().optional(),
status: z.enum(["PASS", "FAIL"])
}))
});

export const TestCaseSchema = z.object({
testId: z.string().min(1, "Test ID is required"),
name: z.string().min(1, "Test name is required"),
description: z.string(),
steps: z.array(TestStepSchema),
expected: TestResultSchema
});

export const APIImplementationSchema = z.object({
implementationId: z.string().min(1, "Implementation ID is required"),
endpointRef: z.string().min(1, "Endpoint reference is required"),
code: z.array(CodeFileSchema).min(1, "At least one code file is required"),
tests: z.array(TestCaseSchema)
});

export const MigrationScriptSchema = z.object({
version: z.string().min(1, "Version is required"),
description: z.string(),
script: z.string().min(1, "Migration script is required"),
rollback: z.string().min(1, "Rollback script is required")
});

export const SchemaSQLSchema = z.object({
schemaId: z.string().min(1, "Schema ID is required"),
databaseType: z.string().min(1, "Database type is required"),
code: z.string().min(1, "Generated SQL is required"),
files: z.array(CodeFileSchema),
migrations: z.array(MigrationScriptSchema)
});

export const SecureServiceSchema = z.object({
serviceRef: z.string().min(1, "Service reference is required"),
securityLayer: z.array(CodeFileSchema).min(1, "At least one security layer file is required"),
authentication: z.array(CodeFileSchema).min(1, "Authentication implementation required"),
authorization: z.array(CodeFileSchema).min(1, "Authorization implementation required"),
validation: z.array(CodeFileSchema).min(1, "Input validation implementation required"),
configurations: z.record(z.any())
});

export const BackendAgentOutputSchema = z.object({
planId: z.string().min(1, "Plan ID is required"),
services: z.array(ServiceCodeSchema),
apis: z.array(APIImplementationSchema),
schemas: z.array(SchemaSQLSchema),
securityLayers: z.array(SecureServiceSchema)
});
