/** Only pure, pre-mutation argument validation may mint this error. Never use for authority checks. */
export class CorrectableToolInputError extends Error {
 readonly code='invalid_identifier_list';
 constructor(readonly field:string,readonly maximum:number){super(`${field} must contain at most ${maximum} unique identifier strings, each 1–100 characters. Use IDs only; put answer text in body.`);}
}
export function validateIdentifierList(value:unknown,field:string,maximum:number){
 if(!Array.isArray(value)||value.length>maximum||value.some(v=>typeof v!=='string'||v.length<1||v.length>100)||new Set(value).size!==value.length)throw new CorrectableToolInputError(field,maximum);
}
