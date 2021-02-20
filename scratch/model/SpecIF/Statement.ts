import { SpecIfObject } from "../Interfaces/SpecIfObject";

export class Statement implements SpecIfObject{
    id: string;
    title: string;
    description: string;
    statementClass: string;
    subject: string;
    object: string;
    changedAt: string;

    constructor(
        id: string,
        title: string,
        description: string,
        statementClass: string,
        subject: string,
        object: string,
        changedAt: string
    ) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.statementClass = statementClass;
        this.subject = subject;
        this.object = object;
        this.changedAt = changedAt;
    }
    extractSpecIfFromArray(specIfObjectArray: SpecIfObject[]): string {
        return `[${specIfObjectArray.map( specIfObject => specIfObject.toSpecIF()).toString()}]`;
    }
    toSpecIF(): string {
        return `{
            "id": "${this.id}",
            "title": "${this.title}",
            "description": "${this.description}",
            "class": "${this.statementClass}",
            "subject": "${this.subject}",
            "object": "${this.object}",
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
