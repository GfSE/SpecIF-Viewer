export interface SpecIfObject {
    extractSpecIfFromArray(specIfObjectArray: SpecIfObject[]):string;
    toSpecIF():string;
    extractRDFFromArray(specIfObjectArray: SpecIfObject[]):string;
    toRDF():string;
}