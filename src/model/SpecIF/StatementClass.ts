import { SpecIfObject } from "../../Interfaces/SpecIfObject";

export class StatementClass implements SpecIfObject{
    id: string;
    title: string;
    description: string;
    instantiation: string[];
    subjectClasses: string[];
    objectClasses: string[];
    changedAt: Date;

    constructor(
        id: string,
        title: string,
        description: string,
        instantiation: string[],
        subjectClasses: string[],
        objectClasses: string[],
        changedAt: Date
    ) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.instantiation = instantiation;
        this.subjectClasses = subjectClasses;
        this.objectClasses = objectClasses;
        this.changedAt = changedAt;
    }
    extractSpecIfFromArray(specIfObjectArray: SpecIfObject[]): string {
        return `[${specIfObjectArray.map( specIfObject => specIfObject.toSpecIF()).toString()}]`;
    }
    
    extractStringArrayForSpecIF(array: string[]):string {
        return `[${array.map( stringObject => {
            `"${stringObject}"`
        }).toString()}]`;
    }

    toSpecIF(): string {
        return `{
            "id": "${this.id}",
            "title": "${this.title}",
            "description": "${this.description}",
            "instantiation": ${this.extractStringArrayForSpecIF(this.instantiation)},
            "subjectClasses": ${this.extractStringArrayForSpecIF(this.subjectClasses)},
            "objectClasses": ${this.extractStringArrayForSpecIF(this.objectClasses)},
            "changedAt": "${this.changedAt}"
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
