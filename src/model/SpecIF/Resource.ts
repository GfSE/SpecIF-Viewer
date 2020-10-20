import { SpecIfObject } from "../../Interfaces/SpecIfObject";
import { Property } from "./Property";

export class Resource implements SpecIfObject{
    id: string;
    title: string;
    ResourceClass: string;
    properties: Property[];

    constructor(
        id: string,
        title: string,
        ResourceClass: string,
        properties: Property[]
    ) {
        this.id = id;
        this.title = title;
        this.ResourceClass = ResourceClass;
        this.properties = properties;
    }
    extractSpecIfFromArray(specIfObjectArray: SpecIfObject[]): string {
        return `[${specIfObjectArray.map( specIfObject => specIfObject.toSpecIF()).toString()}]`;
    }
    toSpecIF(): string {
        return `{
            "id": "${this.id}",
            title": "${this.title}",
            class": "${this.ResourceClass}",
            properties": ${this.extractSpecIfFromArray(this.properties)}
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
