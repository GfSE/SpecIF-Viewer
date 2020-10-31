import { DataType } from "./DataType";
import { SpecIfNode } from "./SpecIfNode";
import { PropertyClass } from "./PropertyClass";
import { Resource } from "./Resource";
import { ResourceClass } from "./ResourceClass";
import { SpecIfFile } from "./SpecIfFile";
import { Statement } from "./Statement";
import { StatementClass } from "./StatementClass";
import { SpecIfObject } from "../Interfaces/SpecIfObject";

class project implements SpecIfObject {
    schema: string;
    id: string;
    title: string;
    createdAt: Date;

    dataTypes: DataType[];
    propertyClasses: PropertyClass[];
    resourceClasses: ResourceClass[];
    statementClasses: StatementClass[];
    resources: Resource[];
    statements: Statement[];
    hierarchies: SpecIfNode[];
    files: SpecIfFile[];

    constructor(
        schema: string,
        id: string,
        title: string,
        createdAt: Date,
        dataTypes: DataType[],
        propertyClasses: PropertyClass[],
        resourceClasses: ResourceClass[],
        statementClasses: StatementClass[],
        resources: Resource[],
        statements: Statement[],
        hierarchies: SpecIfNode[],
        files: SpecIfFile[]
    ) {
        this.schema = schema;
        this.id = id;
        this.title = title;
        this.createdAt = createdAt;
        this.dataTypes = dataTypes;
        this.propertyClasses = propertyClasses;
        this.resourceClasses = resourceClasses;
        this.statementClasses = statementClasses;
        this.resources = resources;
        this.statements = statements;
        this.hierarchies = hierarchies;
        this.files = files;
    }
    
    extractSpecIfFromArray(specIfObjectArray: SpecIfObject[]):string {
        return `[${specIfObjectArray.map( specIfObject => specIfObject.toSpecIF()).toString()}]`;
    }
    
    toSpecIF(): string {  
        return `{
            "$schema":"${this.schema}",
            "id":"${this.id}",
            "title":"${this.title}",
            "createdAt":"${this.createdAt}",
            "dataTypes":${this.extractSpecIfFromArray(this.dataTypes)},
            "propertyClasses":${this.extractSpecIfFromArray(this.propertyClasses)},
            "resourceClasses":${this.extractSpecIfFromArray(this.resourceClasses)},
            "statementClasses":${this.extractSpecIfFromArray(this.statementClasses)},
            "resources":${this.extractSpecIfFromArray(this.resources)},
            "statements":${this.extractSpecIfFromArray(this.statements)},
            "hierarchies":${this.extractSpecIfFromArray(this.hierarchies)},
            "files":${this.extractSpecIfFromArray(this.files)}
        }`;
    }
    
    extractRDFFromArray(specIfObjectArray: SpecIfObject[]): string {
        return `[${specIfObjectArray.map( specIfObject => specIfObject.toRDF()).toString()}]`;
    }
    
    toRDF(): string {
        return `{
            
        }`;
    }
}
