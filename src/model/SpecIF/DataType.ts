import { SpecIfObject } from "../../Interfaces/SpecIfObject";

export class DataType implements SpecIfObject{
    id: string;
    title: string;
    description: string;
    type: string;
    maxLength: number;
    changedAt: Date;

    constructor(
        id: string,
        title: string,
        description: string,
        type: string,
        maxLength: number,
        changedAt: Date
    ) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.type = type;
        this.maxLength = maxLength;
        this.changedAt = changedAt;
    }
    extractRDFFromArray(specIfObjectArray: SpecIfObject[]): string {
        throw new Error("Method not implemented.");
    }
    toRDF(): string {
        throw new Error("Method not implemented.");
    }
    extractSpecIfFromArray(specIfObjectArray: SpecIfObject[]): string {
        return `[${specIfObjectArray.map( specIfObject => specIfObject.toSpecIF()).toString()}]`;
    }
    toSpecIF(): string {
        return `{
            "id":"${this.id}",
            "title":"${this.title}",
            "description":"${this.description}",
            "type":"${this.type}",
            "maxLength":"${this.maxLength}",
            "changedAt":"${this.changedAt}"
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