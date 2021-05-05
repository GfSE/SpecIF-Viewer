import { SpecIfObject } from "../../Interfaces/SpecIfObject";

export class PropertyClass implements SpecIfObject {
    id: string; 
    title: string; 
    dataType: string; 
    changedAt: Date; 

    constructor(
        id: string,
        title: string,
        dataType: string,
        changedAt: Date
    ) {
        this.id = id;
        this.title = title;
        this.dataType = dataType;
        this.changedAt = changedAt;
    }
    extractSpecIfFromArray(specIfObjectArray: SpecIfObject[]): string {
        return `[${specIfObjectArray.map( specIfObject => specIfObject.toSpecIF()).toString()}]`;
    }
    toSpecIF(): string {
        return `{
            "id": "${this.id}",
            "title": "${this.title}",
            "dataType": "${this.dataType}",
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