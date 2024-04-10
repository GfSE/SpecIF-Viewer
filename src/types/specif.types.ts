/**
 * SpecIF Web API
 * Web API for the Specification Integration Facility (SpecIF).
 *
 * OpenAPI spec version: v1.1
 * 
 * NOTE: This file is originally auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 *
 * OD 2021-11-22:
 * This is a manual excerpt of the generated file containing just the SpecIF interfaces and types.
 * Some corrections and optimizations have been made.
 * 
 * OD 2023-05-03:
 * Roles and permissions added, which will be part of SpecIF v1.2
 */

/**
 * 
 * @export
 * @interface HttpStatusDetails
 * 
interface HttpStatusDetails extends null<String, ModelObject> {
    [key: string]: ModelObject;
} */

/**
 * 
 * @export
 * @interface SpecifProject
 */
interface SpecifProject {
    /**
     * 
     * @type {SpecifMetaSchema}
     * @memberof SpecifProject
     */
    $schema: SpecifMetaSchema;
    /**
     * 
     * @type {SpecifId}
     * @memberof SpecifProject
     */
    id: SpecifId;
    /**
     * 
     * @type {SpecifRevision}
     * @memberof SpecifProject
     */
    revision?: SpecifRevision;
    /**
     * 
     * @type {SpecifMultiLanguageText}
     * @memberof SpecifProject
     */
    title?: SpecifMultiLanguageText;
    /**
     * 
     * @type {SpecifMultiLanguageText}
     * @memberof SpecifProject
     */
    description?: SpecifMultiLanguageText;
    /**
     * 
     * @type {boolean}
     * @memberof SpecifProject
     */
    isExtension?: boolean;
    /**
     * 
     * @type {string}
     * @memberof SpecifProject
     */
    generator?: string;
    /**
     * 
     * @type {string}
     * @memberof SpecifProject
     */
    generatorVersion?: string;
    /**
     * 
     * @type {SpecifRights}
     * @memberof SpecifProject
     */
    rights?: SpecifRights;
    /**
     * 
     * @type {SpecifDateTime}
     * @memberof SpecifProject
     */
    createdAt?: SpecifDateTime;
    /**
     * 
     * @type {SpecifCreatedBy}
     * @memberof SpecifProject
     */
    createdBy?: SpecifCreatedBy;
    /**
     * 
     * @type {Array<SpecifProjectRole>}
     * @memberof SpecifProject
     */
    roles?: Array<SpecifProjectRole>;
    /**
     * 
     * @type {string}
     * @memberof SpecifProject
     */
    language?: string;
    /**
     * Memorize the type-set of the project
     * @type {Array<SpecifDataType>}
     * @memberof SpecIF
     */
    dataTypes: SpecifKeys;
    /**
     * Memorize the type-set of the project
     * @type {SpecifKeys}
     * @memberof SpecIF
     */
    propertyClasses: SpecifKeys;
    /**
     * Memorize the type-set of the project
     * @type {SpecifKeys}
     * @memberof SpecIF
     */
    resourceClasses: SpecifKeys;
    /**
     * Memorize the type-set of the project
     * @type {SpecifKeys}
     * @memberof SpecIF
     */
    statementClasses: SpecifKeys;
    /**
     * Memorize the hierarchies of the project
     * @type {SpecifKeys}
     * @memberof SpecifProject
     */
    hierarchies: SpecifKeys;
}

/**
 * 
 * @export
 * @interface SpecIF
 */
interface SpecIF {
    /**
     * 
     * @type {SpecifMetaSchema}
     * @memberof SpecIF
     */
    $schema: SpecifMetaSchema;
    /**
     * 
     * @type {SpecifId}
     * @memberof SpecIF
     */
    id: SpecifId;
    /**
     * 
     * @type {SpecifRevision}
     * @memberof SpecIF
     */
    revision?: SpecifRevision;
    /**
     * 
     * @type {SpecifMultiLanguageText}
     * @memberof SpecIF
     */
    title?: SpecifMultiLanguageText;
    /**
     * 
     * @type {SpecifMultiLanguageText}
     * @memberof SpecIF
     */
    description?: SpecifMultiLanguageText;
    /**
     * 
     * @type {boolean}
     * @memberof SpecIF
     */
    isExtension?: boolean;
    /**
     * 
     * @type {string}
     * @memberof SpecIF
     */
    generator?: string;
    /**
     * 
     * @type {string}
     * @memberof SpecIF
     */
    generatorVersion?: string;
    /**
     * 
     * @type {SpecifRights}
     * @memberof SpecIF
     */
    rights?: SpecifRights;
    /**
     * 
     * @type {SpecifDateTime}
     * @memberof SpecIF
     */
    createdAt?: SpecifDateTime;
    /**
     * 
     * @type {SpecifCreatedBy}
     * @memberof SpecIF
     */
    createdBy?: SpecifCreatedBy;
    /**
     * 
     * @type {Array<SpecifProjectRole>}
     * @memberof SpecifProject
     */
    roles?: Array<SpecifProjectRole>;
    /**
     * 
     * @type {string}
     * @memberof Specif
     */
    language?: string;
    /**
     * 
     * @type {Array<SpecifDataType>}
     * @memberof SpecIF
     */
    dataTypes: Array<SpecifDataType>;
    /**
     * 
     * @type {Array<SpecifPropertyClass>}
     * @memberof SpecIF
     */
    propertyClasses: Array<SpecifPropertyClass>;
    /**
     * 
     * @type {Array<SpecifResourceClass>}
     * @memberof SpecIF
     */
    resourceClasses: Array<SpecifResourceClass>;
    /**
     * 
     * @type {Array<SpecifStatementClass>}
     * @memberof SpecIF
     */
    statementClasses: Array<SpecifStatementClass>;
    /**
     * 
     * @type {Array<SpecifResource>}
     * @memberof SpecIF
     */
    resources: Array<SpecifResource>;
    /**
     * 
     * @type {Array<SpecifStatement>}
     * @memberof SpecIF
     */
    statements: Array<SpecifStatement>;
    /**
     * 
     * @type {SpecifNodes}
     * @memberof SpecIF
     */
    hierarchies: SpecifNodes;
    /**
     * 
     * @type {Array<SpecifFile>}
     * @memberof SpecIF
     */
    files?: Array<SpecifFile>;
}

/**
 * Some interface for user roles and permissions.
 * New with SpecIF v1.2
 */

/**
 * A permissionvector defines the basic create, read, update and delete permission for an item.
 * The auhority to change a *PermissionVector* or a *Permission* is reserved to an 
 * administrator role in the context of the application code.
 */
interface SpecifPermissionVector {
    C: boolean; // create item
    E: boolean; // execute item
    R: boolean; // read item
    U: boolean; // update item
    D: boolean; // delete item
//    A: boolean; // administer item's permissions, so modify the other attributes of this 
}

/**
 * An item permission defines a permission vector for an item, being either a project, a class or a node.
 */
interface SpecifPermission {
    item: SpecifId;  // a reference to any project, propertyClass, resourceClass, statementClass or node
    permissionVector: SpecifPermissionVector;
}

/**
 * A role defined for a project has a collection of item permissions.
 */
interface SpecifProjectRole {
    id: SpecifId;
    title: SpecifText;
    description?: SpecifMultiLanguageText;
    permissions: Array<SpecifPermission>;
}

/**
 * A project role is given to a user based on group membership or other role information 
 * provided by an identity and access management (IAM) system.
 */
interface SpecifRoleAssignment {
    project: SpecifId;  // the project reference, use 'any' as default value to cover all remaining projects
    role: SpecifText;  // the title of the role, ideally an ontology term
}
interface Person {
    /**
     * 
     * @type {string}
     * @memberof Person
     */
    familyName?: string;
    /**
     * 
     * @type {string}
     * @memberof Person
     */
    givenName?: string;
    /**
     * 
     * @type {SpecifOrg}
     * @memberof Person
     */
    org?: SpecifOrg;
    /**
     * 
     * @type {string}
     * @memberof Person
     */
    email: string;
}
/**
 * A user is a person with a collection of project roles
 */
interface SpecifUser extends Person {
    roleAssignments: Array<SpecifRoleAssignment>
}

/**
 * A list of pointers to resources resp. statements which have been merged to this one.
 * @export
 * @interface SpecifAlternativeId
 */
interface SpecifAlternativeId {
    /**
     * 
     * @type {SpecifId}
     * @memberof SpecifAlternativeId
     */
    id: SpecifId;
    /**
     * 
     * @type {SpecifRevision}
     * @memberof SpecifAlternativeId
     */
    revision?: SpecifRevision;
    /**
     * 
     * @type {SpecifId}
     * @memberof SpecifAlternativeId
     */
    project?: SpecifId;
}

/**
 * The list of consolidated items to be used in case a consolidated item shall be updated.
 * @export
 */
type SpecifAlternativeIds = Array<SpecifAlternativeId>

/**
 * The creator of the SpecIF data-set (file). If specified, at least an e-mail address must be given.
 * @export
 * @interface SpecifCreatedBy
 */
type SpecifCreatedBy = Person;

/**
 * 
 * @export
 * @interface SpecifDataType
 */
interface SpecifDataType {
    /**
     * 
     * @type {SpecifId}
     * @memberof SpecifDataType
     */
    id: SpecifId;
    /**
     * 
     * @type {SpecifText}
     * @memberof SpecifDataType
     */
    title: SpecifText;
    /**
     * 
     * @type {SpecifMultiLanguageText}
     * @memberof SpecifDataType
     */
    description?: SpecifMultiLanguageText;
    /**
     * 
     * @type {SpecifRevision}
     * @memberof SpecifDataType
     */
    revision?: SpecifRevision;
    /**
     * 
     * @type {SpecifReplaces}
     * @memberof SpecifDataType
     */
    replaces?: SpecifReplaces;
    /**
     * 
     * @type {SpecifPermissionVector}
     * @memberof SpecifDataType
     */
    permissionVector?: SpecifPermissionVector;
    /**
     * 
     * @type {string}
     * @memberof SpecifDataType
     */
    type: XsDataType;
    /**
     * 
     * @type {number}
     * @memberof SpecifDataType
     */
    maxLength?: number;
    /**
     * 
     * @type {number}
     * @memberof SpecifDataType
     */
    fractionDigits?: number;
    /**
     * 
     * @type {number}
     * @memberof SpecifDataType
     */
    minInclusive?: number;
    /**
     * 
     * @type {number}
     * @memberof SpecifDataType
     */
    maxInclusive?: number;
    /**
     * 
     * @type {SpecifEnumeratedValues}
     * @memberof SpecifDataType
     */
    enumeration?: SpecifEnumeratedValues;
    /**
     * 
     * @type {boolean}
     * @memberof SpecifDataType
     */
    multiple?: boolean;
    /**
     * 
     * @type {SpecifDateTime}
     * @memberof SpecifDataType
     */
    changedAt: SpecifDateTime;
    /**
     * 
     * @type {string}
     * @memberof SpecifDataType
     */
    changedBy?: string;
}

/**
* @export
* @enum {string}
*/
enum XsDataType {
    Boolean = <any> 'xs:boolean',
    Integer = <any> 'xs:integer',
    Double = <any> 'xs:double',
    AnyURI = <any> 'xs:anyURI',
    DateTime = <any> 'xs:dateTime',
    Duration = <any> 'xs:duration',
    String = <any> 'xs:string'
}

/**
 * An ISO-8601 dateTime string. For reduced accuracy, any number of values may be dropped, but only from right to left.
 * @export
 */
type SpecifDateTime = string

/**
 * 
 * @export
 * @interface SpecifEnumeratedValue
 */
interface SpecifEnumeratedValue {
    /**
     * 
     * @type {SpecifId}
     * @memberof SpecifEnumeratedValue
     */
    id: SpecifId;
    /**
     * 
     * @type {SpecifValue}
     * @memberof SpecifEnumeratedValue
     */
    value: SpecifValue;
}

/**
 * Enumerated values for the given dataType. If 'multiple' is true 0..n options may be selected, otherwise exactly one must be selected.
 * @export
 */
type SpecifEnumeratedValues = Array<SpecifEnumeratedValue>

/**
 * 
 * @export
 * @interface SpecifFile
 */
interface SpecifFile {
    /**
     * 
     * @type {SpecifId}
     * @memberof SpecifFile
     */
    id: SpecifId;
    /**
     * 
     * @type {string}
     * @memberof SpecifFile
     */
    title: string;
    /**
     * 
     * @type {SpecifMultiLanguageText}
     * @memberof SpecifFile
     */
    description?: SpecifMultiLanguageText;
    /**
     * An absolute or relative URL to the file; will be of format 'uri-reference' in future. If missing, the title applies.
     * @type {string}
     * @memberof SpecifFile
     */
    url?: string;
    /**
     * The file (image or object) as dataURL
     * @type {string}
     * @memberof SpecifFile
     */
    dataURL?: string;
    /**
     * The file as blob
     * @type {Blob}
     * @memberof SpecifFile
     */
    blob?: Blob;
    /**
     * The file's media type (formerly MIME-type) according to https://www.iana.org/assignments/media-types/media-types.xhtml.
     * @type {string}
     * @memberof SpecifFile
     */
    type: string;
    /**
     *
     * @type {SpecifRevision}
     * @memberof SpecifFile
     */
    revision?: SpecifRevision;
    /**
     * 
     * @type {SpecifReplaces}
     * @memberof SpecifFile
     */
    replaces?: SpecifReplaces;
    /**
     * 
     * @type {SpecifDateTime}
     * @memberof SpecifFile
     */
    changedAt: SpecifDateTime;
    /**
     * 
     * @type {string}
     * @memberof SpecifFile
     */
    changedBy?: string;
}

/**
 * The number of hierarchy levels.
 * @export
 *
type SpecifHierarchyDepth = number */

/**
 * A symbol for display as a prefix to titles; applicable to all instances of the class. Is usually a XML-encoded UTF-8 symbol, can be an URL or dataURL.
 * @export
 */
type SpecifIcon = string

/**
 * A globally unique identifier.
 * @export
 */
type SpecifId = string

/**
 * Indicates whether an instance of the class is created automatically, manually or both. Manual *and* automatic instantiation is allowed, if the property is omitted. The class is abstract and cannot be instantiated, if the property list is present, but empty. 
 * @export
 */
enum SpecifInstantiation {
    Auto = <any> 'auto',
    User = <any> 'user'
}

/**
 * A key for a particular revision of an identifiable item, e.g. of a resource. A key consists of a globally unique identifier and a revision. No or an undefined revision means the latest revision of the identified item.
 * @export
 * @interface SpecifKey
 */

interface SpecifKey {
    /**
     * 
     * @type {SpecifId}
     * @memberof SpecifKey
     */
    id: SpecifId;
    /**
     * 
     * @type {SpecifRevision}
     * @memberof SpecifKey
     */
    revision?: SpecifRevision;
}

/**
 * A list of keys referencing items such as propertyClasses, resourceClasses or statementClasses; any list must have >0 entries including those of any parent element.
 * @export
 */
type SpecifKeys = Array<SpecifKey>

/**
 * 
 * @export
 */
type SpecifMetaSchema = string

/**
 * 
 * @export
 * @interface SpecifLanguageText
 */
interface SpecifLanguageText {
    /**
     * 
     * @type {SpecifText}
     * @memberof SpecifMultiLanguageText
     */
    text: SpecifText;
    /**
     * 
     * @type {SpecifTextFormat}
     * @memberof SpecifMultiLanguageText
     */
    format?: SpecifTextFormat;
    /**
     * 
     * @type {string}
     * @memberof SpecifMultiLanguageText
     */
    language?: string;
}

/**
 * 
 * @export
 */
type SpecifMultiLanguageText = Array<SpecifLanguageText>

/**
 * 
 * @export
 * @interface SpecifNode
 */
interface SpecifNode {
    /**
     * 
     * @type {SpecifId}
     * @memberof SpecifNode
     */
    id: SpecifId;
    /**
     * 
     * @type {SpecifMultiLanguageText}
     * @memberof SpecifNode
     */
    title?: SpecifMultiLanguageText;
    /**
     * 
     * @type {SpecifMultiLanguageText}
     * @memberof SpecifNode
     */
    description?: SpecifMultiLanguageText;
    /**
     * 
     * @type {SpecifKey}
     * @memberof SpecifNode
     */
    resource: SpecifKey;
    /**
     * 
     * @type {SpecifNodes}
     * @memberof SpecifNode
     */
    nodes?: SpecifNodes;
    /**
     * 
     * @type {SpecifRevision}
     * @memberof SpecifNode
     */
    revision?: SpecifRevision;
    /**
     * 
     * @type {SpecifReplaces}
     * @memberof SpecifNode
     */
    replaces?: SpecifReplaces;
    /**
     * 
     * @type {SpecifPermissionVector}
     * @memberof SpecifNode
     */
    permissionVector?: SpecifPermissionVector;
    /**
     * 
     * @type {SpecifDateTime}
     * @memberof SpecifNode
     */
    changedAt: SpecifDateTime;
    /**
     * 
     * @type {string}
     * @memberof SpecifNode
     */
    changedBy?: string;
}

/**
 * A list of pointers to resources; may be nested forming a tree, i.e. a hierarchy of pointers.
 * @export
 */
type SpecifNodes = Array<SpecifNode>

/**
 * 
 * @export
 * @interface SpecifOrg
 */
interface SpecifOrg {
    /**
     * 
     * @type {string}
     * @memberof SpecifOrg
     */
    organizationName: string;
}

/**
 * 
 * @export
 * @interface SpecifProperty
 */
interface SpecifProperty {
    /**
     * 
     * @type {SpecifKey}
     * @memberof SpecifProperty
     */
    class: SpecifKey;
    /**
     * 
     * @type {SpecifValues}
     * @memberof SpecifProperty
     */
    values: SpecifValues;
}

/**
 * 
 * @export
 * @interface SpecifPropertyClass
 */
interface SpecifPropertyClass {
    /**
     * 
     * @type {SpecifId}
     * @memberof SpecifPropertyClass
     */
    id: SpecifId;
    /**
     * 
     * @type {SpecifText}
     * @memberof SpecifPropertyClass
     */
    title: SpecifText;
    /**
     * 
     * @type {SpecifMultiLanguageText}
     * @memberof SpecifPropertyClass
     */
    description?: SpecifMultiLanguageText;
    /**
     * 
     * @type {SpecifKey}
     * @memberof SpecifPropertyClass
     */
    dataType: SpecifKey;
    /**
     * 
     * @type {boolean}
     * @memberof SpecifPropertyClass
     */
    multiple?: boolean;
    /**
     * 
     * @type {SpecifPermissionVector}
     * @memberof SpecifPropertyClass
     */
    permissionVector?: SpecifPermissionVector;
    /**
     * 
     * @type {SpecifValues}
     * @memberof SpecifPropertyClass
     */
    values?: SpecifValues;
    /**
     * 
     * @type {SpecifTextFormat}
     * @memberof SpecifPropertyClass
     */
    format?: SpecifTextFormat;
    /**
     * 
     * @type {string}
     * @memberof SpecifPropertyClass
     */
    unit?: string;
    /**
     * 
     * @type {SpecifRevision}
     * @memberof SpecifPropertyClass
     */
    revision?: SpecifRevision;
    /**
     * 
     * @type {SpecifReplaces}
     * @memberof SpecifPropertyClass
     */
    replaces?: SpecifReplaces;
    /**
     * 
     * @type {SpecifDateTime}
     * @memberof SpecifPropertyClass
     */
    changedAt: SpecifDateTime;
    /**
     * 
     * @type {string}
     * @memberof SpecifPropertyClass
     */
    changedBy?: string;
}

/**
 * For change and configuration management; the first revision has 0 entries, a simple modification has 1 entry and the result of a merge has 2 entries.
 * @export
 */
type SpecifReplaces = Array<SpecifRevision>

/**
 * 
 * @export
 * @interface SpecifResource
 */
interface SpecifResource {
    /**
     * 
     * @type {SpecifId}
     * @memberof SpecifResource
     */
    id: SpecifId;
    /**
     * 
     * @type {SpecifAlternativeIds}
     * @memberof SpecifResource
     */
    alternativeIds?: SpecifAlternativeIds;
    /**
     * 
     * @type {SpecifKey}
     * @memberof SpecifResource
     */
    class: SpecifKey;
    /**
     * 
     * @type {string}
     * @memberof SpecifResource
     */
    language?: string;
    /**
     * 
     * @type {Array<SpecifProperty>}
     * @memberof SpecifResource
     */
    properties: Array<SpecifProperty>;
    /**
     * 
     * @type {SpecifRevision}
     * @memberof SpecifResource
     */
    revision?: SpecifRevision;
    /**
     * 
     * @type {SpecifReplaces}
     * @memberof SpecifResource
     */
    replaces?: SpecifReplaces;
    /**
     * 
     * @type {SpecifDateTime}
     * @memberof SpecifResource
     */
    changedAt: SpecifDateTime;
    /**
     * 
     * @type {string}
     * @memberof SpecifResource
     */
    changedBy?: string;
}

/**
 * 
 * @export
 * @interface SpecifResourceClass
 */
interface SpecifResourceClass {
    /**
     * 
     * @type {SpecifId}
     * @memberof SpecifResourceClass
     */
    id: SpecifId;
    /**
     * 
     * @type {SpecifText}
     * @memberof SpecifResourceClass
     */
    title: SpecifText;
    /**
     * 
     * @type {SpecifMultiLanguageText}
     * @memberof SpecifResourceClass
     */
    description?: SpecifMultiLanguageText;
    /**
     * 
     * @type {SpecifKey}
     * @memberof SpecifResourceClass
     */
    extends?: SpecifKey;
    /**
     * 
     * @type {SpecifIcon}
     * @memberof SpecifResourceClass
     */
    icon?: SpecifIcon;
    /**
     * 
     * @type {boolean}
     * @memberof SpecifResourceClass
     */
    isHeading?: boolean;
    /**
     * 
     * @type {Array<SpecifInstantiation>}
     * @memberof SpecifResourceClass
     */
    instantiation?: Array<SpecifInstantiation>;
    /**
     * 
     * @type {SpecifPermissionVector}
     * @memberof SpecifResourceClass
     */
    permissionVector?: SpecifPermissionVector;
    /**
     * 
     * @type {SpecifKeys}
     * @memberof SpecifResourceClass
     */
    propertyClasses: SpecifKeys;
    /**
     * 
     * @type {SpecifRevision}
     * @memberof SpecifResourceClass
     */
    revision?: SpecifRevision;
    /**
     * 
     * @type {SpecifReplaces}
     * @memberof SpecifResourceClass
     */
    replaces?: SpecifReplaces;
    /**
     * 
     * @type {SpecifDateTime}
     * @memberof SpecifResourceClass
     */
    changedAt: SpecifDateTime;
    /**
     * 
     * @type {string}
     * @memberof SpecifResourceClass
     */
    changedBy?: string;
}

/**
 * A globally unique revision tag with one or multiple blocks with alphanumeric characters separated by a special character [.:,;/-]. Sequential as well as branching/merging notations are possible.
 * @export
 */
type SpecifRevision = string

/**
 * 
 * @export
 * @interface SpecifRights
 */
interface SpecifRights {
    /**
     * 
     * @type {string}
     * @memberof SpecifRights
     */
    title: string;
    /**
     * 
     * @type {string}
     * @memberof SpecifRights
     */
    url: string;
}

/**
 * 
 * @export
 * @interface SpecifStatement
 */
interface SpecifStatement {
    /**
     * 
     * @type {SpecifId}
     * @memberof SpecifStatement
     */
    id: SpecifId;
    /**
     * 
     * @type {SpecifAlternativeIds}
     * @memberof SpecifStatement
     */
    alternativeIds?: SpecifAlternativeIds;
    /**
     * 
     * @type {SpecifKey}
     * @memberof SpecifStatement
     */
    class: SpecifKey;
    /**
     * 
     * @type {string}
     * @memberof SpecifStatement
     */
    language?: string;
    /**
     * If there is no title property, the statementClass' title applies.
     * @type {Array<SpecifProperty>}
     * @memberof SpecifStatement
     */
    properties?: Array<SpecifProperty>;
    /**
     * 
     * @type {SpecifKey}
     * @memberof SpecifStatement
     */
    subject: SpecifKey;
    /**
     * 
     * @type {SpecifKey}
     * @memberof SpecifStatement
     */
    object: SpecifKey;
    /**
     * 
     * @type {SpecifRevision}
     * @memberof SpecifStatement
     */
    revision?: SpecifRevision;
    /**
     * 
     * @type {SpecifReplaces}
     * @memberof SpecifStatement
     */
    replaces?: SpecifReplaces;
    /**
     * 
     * @type {SpecifDateTime}
     * @memberof SpecifStatement
     */
    changedAt: SpecifDateTime;
    /**
     * 
     * @type {string}
     * @memberof SpecifStatement
     */
    changedBy?: string;
}

/**
 * 
 * @export
 * @interface SpecifStatementClass
 */
interface SpecifStatementClass {
    /**
     * 
     * @type {SpecifId}
     * @memberof SpecifStatementClass
     */
    id: SpecifId;
    /**
     * 
     * @type {SpecifText}
     * @memberof SpecifStatementClass
     */
    title: SpecifText;
    /**
     * 
     * @type {SpecifMultiLanguageText}
     * @memberof SpecifStatementClass
     */
    description?: SpecifMultiLanguageText;
    /**
     * 
     * @type {SpecifKey}
     * @memberof SpecifStatementClass
     */
    extends?: SpecifKey;
    /**
     * 
     * @type {SpecifIcon}
     * @memberof SpecifStatementClass
     */
    icon?: SpecifIcon;
    /**
     * 
     * @type {Array<SpecifInstantiation>}
     * @memberof SpecifStatementClass
     */
    instantiation?: Array<SpecifInstantiation>;
    /**
     * 
     * @type {boolean}
     * @memberof SpecifStatementClass
     */
    isUndirected?: boolean;
    /**
     * 
     * @type {SpecifPermissionVector}
     * @memberof SpecifStatementClass
     */
    permissionVector?: SpecifPermissionVector;
    /**
     * 
     * @type {SpecifKeys}
     * @memberof SpecifStatementClass
     */
    propertyClasses?: SpecifKeys;
    /**
     * 
     * @type {SpecifKeys}
     * @memberof SpecifStatementClass
     */
    subjectClasses?: SpecifKeys;
    /**
     * 
     * @type {SpecifKeys}
     * @memberof SpecifStatementClass
     */
    objectClasses?: SpecifKeys;
    /**
     * 
     * @type {SpecifRevision}
     * @memberof SpecifStatementClass
     */
    revision?: SpecifRevision;
    /**
     * 
     * @type {SpecifReplaces}
     * @memberof SpecifStatementClass
     */
    replaces?: SpecifReplaces;
    /**
     * 
     * @type {SpecifDateTime}
     * @memberof SpecifStatementClass
     */
    changedAt: SpecifDateTime;
    /**
     * 
     * @type {string}
     * @memberof SpecifStatementClass
     */
    changedBy?: string;
}

/**
 * 
 * @export
 */
type SpecifText = string

/**
 * 
 * @export
 * @enum {string}
 */
enum SpecifTextFormat {
    Plain = <any> 'plain',
    Xhtml = <any> 'xhtml'
}

/**
 * First option for properties with dataType 'xs:string', second option for all others. Note that SpecIF represents *all* values including number and boolean as string.
 * @export
 */
type SpecifValue = SpecifMultiLanguageText | string

/**
 * If 'multiple' of the propertyClass is undefined or false, the array must contain one item. If the value is unknown, omit the whole property. By default, the class' value applies.
 * @export
 */
type SpecifValues = Array<SpecifValue>

/**
 * 
 * @export
 * @interface V11FilesBody
 *
interface V11FilesBody {
    /**
     * 
     * @type {Blob}
     * @memberof V11FilesBody
     *
    file?: Blob;
} */

