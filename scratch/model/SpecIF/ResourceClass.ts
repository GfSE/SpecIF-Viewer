import { SpecIfObject } from "../Interfaces/SpecIfObject";

export class ResourceClass implements SpecIfObject{
    id: string;
    title: string;
    description: string;
    instantiation: string[];
    icon: string;
    propertyClasses: string[];
    changedAt: Date;

    constructor(
        id: string,
        title: string,
        description: string,
        instantiation: string[],
        icon: string,
        propertyClasses: string[],
        changedAt: Date
    ) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.instantiation = instantiation;
        this.icon = icon;
        this.propertyClasses = propertyClasses;
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
            "icon": "${this.icon}",
            "propertyClasses": ${this.extractStringArrayForSpecIF(this.propertyClasses)},
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
