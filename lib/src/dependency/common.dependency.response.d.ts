import { DebugContext } from '../execution.context';
export interface CommonDependencyResponse {
    name: string;
    isSkipped: boolean;
    beforeDependencyResponse?: any;
    afterDependencyResponse?: any;
    hasError: boolean;
    errors: any[];
    isSuccessful: boolean;
    startTime?: Date;
    completeTime?: Date;
    debugContext?: DebugContext | undefined;
}
