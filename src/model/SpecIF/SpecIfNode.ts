import { SpecIfObject } from "../Interfaces/SpecIfObject";

export class SpecIfNode implements SpecIfObject{
    id: string;
    resource: string;
    nodes: SpecIfNode[] | undefined;
    changedAt: Date;

    constructor(
        id: string,
        resource: string,
        changedAt: Date,
        nodes?: SpecIfNode[]
    ) {
        this.id = id;
        this.resource = resource;
        this.nodes = nodes;
        this.changedAt = changedAt;
    }
    extractSpecIfFromArray(specIfObjectArray: SpecIfObject[]): string {
        return `[${specIfObjectArray.map( specIfObject => specIfObject.toSpecIF()).toString()}]`;
    }

    gotSubNodes(): boolean{
        return (this.nodes != undefined)
    }

    toSpecIF(): string {
        if(this.gotSubNodes()){  
            return `{
                "id": "${this.id}",
                "resource": "${this.resource}",
                "nodes": ${this.extractSpecIfFromArray(this.nodes)},
                "changedAt": "${this.changedAt}"
            }`
        } else {
            return `{
                "id": "${this.id}",
                "resource": "${this.resource}",
                "changedAt": "${this.changedAt}"
            }`
        };
    }
    
    extractRDFFromArray(specIfObjectArray: SpecIfObject[]): string {
        return `[${specIfObjectArray.map( specIfObject => specIfObject.toRDF()).toString()}]`;
    }
    
    toRDF(): string {
        return `{
            
        }`;
    }
}
