/**
 * The Specification Integration Facility (SpecIF) integrates partial system models from
 * different methods and tools in a semantic net. Collaborators shall browse, search and
 * audit engineering results in a common context. Also, the exchange of model information
 * between organizations and tools is facilitated. SpecIF represents the visible, i.e. the
 * diagrams and the text, as well as the semantics of system specifications.
 *
 * This file has been generated from the specif.de/v1.0/schema.json
 * with https://app.quicktype.io/
 */
export interface SpecIF {
    /**
     * An absolute URL pointing to this SpecIF schema.
     */
    $schema:    string;
    createdAt?: string;
    /**
     * The creator of the SpecIF data-set (file). If specified, at least an e-mail address must
     * be given.
     */
    createdBy?: CreatedBy;
    /**
     * The base data types for use by property class definitions.
     */
    dataTypes?:   DataType[];
    description?: ValueElement[] | string;
    /**
     * A list of files being referenced by a resource's or statement's property of dataType
     * XHTML using an <object> tag. A file should have a media type as defined by IANA (see
     * below).
     */
    files?:            File[];
    generator?:        string;
    generatorVersion?: string;
    /**
     * A list of hierarchies with pointers to resources; may be nested to build a tree, i.e. a
     * hierarchy of pointers.
     */
    hierarchies: Hierarchy[];
    id:          string;
    /**
     * Indicates that the project is not schema-compliant on its own; by default the value is
     * 'false'. Of course, it is expected that once extended the project is schema-compliant.
     */
    isExtension?: boolean;
    /**
     * An IETF language tag such as 'en', 'en-US, 'fr' or 'de' showing the used language of
     * simple property values. Is superseded by a resource's, statement's or property's language
     * value.
     */
    language?: string;
    /**
     * Class definition of a property for resources or statements. Is a sub-element of the
     * respective resourceClass or statementClass. If no revision or change information is
     * specified, the respective values of the parent element apply.
     */
    propertyClasses?: PropertyClass[];
    /**
     * The class definitions for resources.
     */
    resourceClasses: ResourceClass[];
    /**
     * The resources such as diagrams, model elements or requirements.
     */
    resources: Resource[];
    rights?:   Rights;
    /**
     * The class definitions for statements in subject-predicate-object statements, where
     * subject and object are resources.
     */
    statementClasses: StatementClass[];
    /**
     * Subject-predicate-Object statements, where subject and object are resources. In other
     * terms, statements are directed relations between two resources building a semantic net.
     */
    statements: Statement[];
    title:      ValueElement[] | string;
}

/**
 * The creator of the SpecIF data-set (file). If specified, at least an e-mail address must
 * be given.
 */
export interface CreatedBy {
    email:       Email;
    familyName?: string;
    givenName?:  string;
    org?:        Org;
}

export interface Email {
    type?: string;
    value: string;
}

export interface Org {
    organizationName: string;
}

export interface DataType {
    changedAt:    string;
    changedBy?:   string;
    description?: ValueElement[] | string;
    id:           string;
    replaces?:    string[];
    revision?:    string;
    title:        ValueElement[] | string;
    /**
     * The corresponding definition in https://www.w3.org/TR/xmlschema-2/ applies.
     *
     * The corresponding definition in https://www.w3.org/TR/xmlschema-2/ resp.
     * https://www.w3.org/TR/xhtml1/ applies.
     */
    type: TypeEnum;
    /**
     * Optional use by dataTypes 'xs:integer' and 'xs:double'.
     */
    maxInclusive?: number;
    /**
     * Optional use by dataTypes 'xs:integer' and 'xs:double'.
     */
    minInclusive?: number;
    /**
     * Optional use by dataType 'xs:double', indicates the number of decimals.
     */
    fractionDigits?: number;
    /**
     * Optional use by dataTypes 'xs:string' and 'xhtml'.
     */
    maxLength?: number;
    /**
     * Optional use by dataType 'xs:enumeration'. Indicates whether multiple values can be
     * chosen; by default the value is 'false'.
     */
    multiple?: boolean;
    /**
     * Mandatory use by dataType 'xs:enumeration'. If 'multiple' is true 0..n options may be
     * selected, otherwise exactly one must be selected.
     */
    values?: EnumeratedValue[];
}

/**
 * A list of items with text and language properties. Thus, the information can be given in
 * multiple languages.
 */
export interface ValueElement {
    /**
     * An IETF language tag such as 'en', 'en-US, 'fr' or 'de'.
     */
    language: string;
    /**
     * A string containing some text.
     */
    text: string;
}

/**
 * The corresponding definition in https://www.w3.org/TR/xmlschema-2/ applies.
 *
 * The corresponding definition in https://www.w3.org/TR/xmlschema-2/ resp.
 * https://www.w3.org/TR/xhtml1/ applies.
 */
export enum TypeEnum {
    XHTML = "xhtml",
    XsBoolean = "xs:boolean",
    XsDateTime = "xs:dateTime",
    XsDouble = "xs:double",
    XsEnumeration = "xs:enumeration",
    XsInteger = "xs:integer",
    XsString = "xs:string",
}

export interface EnumeratedValue {
    id:    string;
    value: ValueElement[] | string;
}

export interface File {
    changedAt:    string;
    changedBy?:   string;
    description?: ValueElement[] | string;
    id:           string;
    replaces?:    string[];
    revision?:    string;
    /**
     * In case of a file, the title is the absolute or relative URL.
     */
    title: ValueElement[] | string;
    /**
     * The file's media type (formerly MIME-type) according to
     * https://www.iana.org/assignments/media-types/media-types.xhtml.
     */
    type: string;
}

export interface Hierarchy {
    changedAt:    string;
    changedBy?:   string;
    description?: ValueElement[] | string;
    id:           string;
    /**
     * The next hierarchy level.
     */
    nodes?:    Node[];
    replaces?: string[];
    /**
     * The pointer to the resource to be displayed at this position.
     */
    resource:  KeyObject | string;
    revision?: string;
    /**
     * The node's label; if missing, the title of the referenced resource is applied.
     */
    title?: ValueElement[] | string;
}

/**
 * The next hierarchy level.
 *
 * A list of pointers to resources; may be nested to build a tree, i.e. a hierarchy of
 * pointers.
 */
export interface Node {
    changedAt:    string;
    changedBy?:   string;
    description?: ValueElement[] | string;
    id:           string;
    /**
     * The next hierarchy level.
     */
    nodes?:    Node[];
    replaces?: string[];
    /**
     * The pointer to the resource to be displayed at this position.
     */
    resource:  KeyObject | string;
    revision?: string;
    /**
     * The node's label; if missing, the title of the referenced resource is applied.
     */
    title?: ValueElement[] | string;
}

/**
 * A key consisting of a globally unique identifier and a revision. No or an undefined
 * revision means the latest revision of the identified item.
 */
export interface KeyObject {
    id:        string;
    revision?: string;
}

export interface PropertyClass {
    changedAt:  string;
    changedBy?: string;
    /**
     * Must be a member of dataTypes.
     */
    dataType:     KeyObject | string;
    description?: ValueElement[] | string;
    id:           string;
    /**
     * Optional use by a propertyClass with dataType 'xs:enumeration'. Indicates whether
     * multiple values can be chosen. If omitted, the 'multiple' property of the dataType
     * applies; by default the value is 'false'.
     */
    multiple?: boolean;
    replaces?: string[];
    revision?: string;
    title:     ValueElement[] | string;
    /**
     * An optional default value in case the corresponding resource's or statement's property is
     * missing.
     */
    value?: ValueElement[] | string;
}

export interface ResourceClass {
    changedAt:    string;
    changedBy?:   string;
    description?: ValueElement[] | string;
    /**
     * Must be a member of resourceClasses.
     */
    extends?:       KeyObject | string;
    icon?:          string;
    id:             string;
    instantiation?: Instantiation[];
    isHeading?:     boolean;
    /**
     * A collection of keys of eligible property classes
     */
    propertyClasses?: Array<KeyObject | string>;
    replaces?:        string[];
    revision?:        string;
    title:            ValueElement[] | string;
}

/**
 * Indicates whether an instance of the class is created automatically, manually or both.
 * All is allowed, if the property is omitted. The class is abstract and cannot be
 * instantiated, if the property list is present, but empty.
 */
export enum Instantiation {
    Auto = "auto",
    User = "user",
}

export interface Resource {
    alternativeIds?: Array<AlternativeIDObject | string>;
    changedAt:       string;
    changedBy?:      string;
    /**
     * Must be a member of resourceClasses.
     */
    class:        KeyObject | string;
    description?: ValueElement[] | string;
    id:           string;
    /**
     * An IETF language tag such as 'en', 'en-US, 'fr' or 'de' showing the used language of
     * simple property values. Is superseded by a property's language value.
     */
    language?:   string;
    properties?: Property[];
    replaces?:   string[];
    revision?:   string;
    title:       ValueElement[] | string;
}

export interface AlternativeIDObject {
    /**
     * A string with a valid identifier of a model-element
     */
    id: string;
    /**
     * A string with a valid project identifier
     */
    project?:  string;
    revision?: string;
}

/**
 * A list of properties of a resource or statement.
 */
export interface Property {
    /**
     * Without change information, the parent's change information applies.
     */
    changedAt?: string;
    changedBy?: string;
    /**
     * Must be a member of propertyClasses. In addition, it must be listed in the
     * propertyClasses of the parent's class.
     */
    class:        KeyObject | string;
    description?: ValueElement[] | string;
    id?:          string;
    replaces?:    string[];
    revision?:    string;
    /**
     * The property's label; if missing, the title of the property's class is applied.
     */
    title?: ValueElement[] | string;
    /**
     * If the value is unknown, omit the whole property. By default, the class' value applies.
     */
    value: ValueElement[] | string;
}

export interface Rights {
    title: string;
    type:  string;
    url:   string;
}

export interface StatementClass {
    changedAt:    string;
    changedBy?:   string;
    description?: ValueElement[] | string;
    /**
     * Must be a member of statementClasses.
     */
    extends?:       KeyObject | string;
    icon?:          string;
    id:             string;
    instantiation?: Instantiation[];
    /**
     * A collection of id's of eligible resource and statement classes; if 'objectClasses' is
     * missing, all resource or statement classes are eligible.
     */
    objectClasses?: Array<KeyObject | string>;
    /**
     * A collection of keys of eligible property classes
     */
    propertyClasses?: Array<KeyObject | string>;
    replaces?:        string[];
    revision?:        string;
    /**
     * A collection of id's of eligible resource and statement classes; if 'subjectClasses' is
     * missing, all resource or statement classes are eligible.
     */
    subjectClasses?: Array<KeyObject | string>;
    title:           ValueElement[] | string;
}

export interface Statement {
    alternativeIds?: Array<AlternativeIDObject | string>;
    changedAt:       string;
    changedBy?:      string;
    /**
     * Must be a member of statementClasses.
     */
    class:        KeyObject | string;
    description?: ValueElement[] | string;
    id:           string;
    /**
     * An IETF language tag such as 'en', 'en-US, 'fr' or 'de' showing the used language of
     * simple property values. Is superseded by a property's language value.
     */
    language?: string;
    /**
     * Must be a member of resources or statements.
     */
    object:      KeyObject | string;
    properties?: Property[];
    replaces?:   string[];
    revision?:   string;
    /**
     * Must be a member of resources or statements.
     */
    subject: KeyObject | string;
    /**
     * The statement's appelation; if missing, the statementClass' title applies.
     */
    title?: ValueElement[] | string;
}
