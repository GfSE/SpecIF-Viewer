import { SpecIfObject } from "../../Interfaces/SpecIfObject";

export class Property implements SpecIfObject{
    propertyClass:string;
    propertyValue:string;

    constructor(
        propertyClass:string,
        propertyValue:string
    ) {
        this.propertyClass = propertyClass;
        this.propertyValue = propertyValue;
    }
    extractSpecIfFromArray(specIfObjectArray: SpecIfObject[]): string {
        return `[${specIfObjectArray.map( specIfObject => specIfObject.toSpecIF()).toString()}]`;
    }
    toSpecIF(): string {
        return `{
            "class":"${this.propertyClass}",
            "value":"${this.propertyValue}"
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