import { JasperEngine } from '../../src/engine';
import { EngineOptions } from '../../src/engine.option';
import { EngineRecipe } from '../../src/enum';
import { ExecutionResponse } from '../../src/execution.response';
import { ruleStore } from './execution.direction.example.rules';
jest.setTimeout(15000);

it('should run', (done) => {
    const options: EngineOptions = {
        recipe: EngineRecipe.BusinessProcessEngine,
        suppressDuplicateTasks: true,
        debug: true,
    };
    
    const engine = new JasperEngine({ ruleStore, options });

    engine
        .run({
            root: {},
            ruleName: 'rule 3',
        })
        .subscribe({
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            next: (response: ExecutionResponse) => {
                console.log('completed');
                expect(true).toBe(true);
                done();
            },
        });
});

/**
 * example output:
 * 
 * [34ac856d2bcadebf6d807015f11911c7026f4947323217f643c3e3f1fe7532e72ac01bb0748c97be]: preprocessing rule 3
 * 
 * [34ac856d2bcadebf6d807015f11911c7026f4947323217f643c3e3f1fe7532e72ac01bb0748c97be]: before dependences of rule 3
 * [34ac856d2bcadebf6d807015f11911c7026f4947323217f643c3e3f1fe7532e72ac01bb0748c97be]: before dependency rule 3 - 1
 * [34ac856d2bcadebf6d807015f11911c7026f4947323217f643c3e3f1fe7532e72ac01bb0748c97be][0]: before path object
 * [401bd4c18235469532e932d355ff4dc49fdb1e89323217f643c3e3f1fe7532e72ac01bb0748c97be]: preprocessing rule 1
 * [239ddf9baa0095c3fda0731f5fff1ade4b511c87323217f643c3e3f1fe7532e72ac01bb0748c97be]: preprocessing rule 2
 * [239ddf9baa0095c3fda0731f5fff1ade4b511c87323217f643c3e3f1fe7532e72ac01bb0748c97be]: processing rule 2
 * [239ddf9baa0095c3fda0731f5fff1ade4b511c87323217f643c3e3f1fe7532e72ac01bb0748c97be]: postprocessing rule 2
 * [401bd4c18235469532e932d355ff4dc49fdb1e89323217f643c3e3f1fe7532e72ac01bb0748c97be]: processing rule 1
 * [34ac856d2bcadebf6d807015f11911c7026f4947323217f643c3e3f1fe7532e72ac01bb0748c97be][0]: after path object
 * [34ac856d2bcadebf6d807015f11911c7026f4947323217f643c3e3f1fe7532e72ac01bb0748c97be]: after dependency rule 3 - 1
 * [34ac856d2bcadebf6d807015f11911c7026f4947323217f643c3e3f1fe7532e72ac01bb0748c97be]: after dependences of rule 3
 * 
 * [34ac856d2bcadebf6d807015f11911c7026f4947323217f643c3e3f1fe7532e72ac01bb0748c97be]: processing rule 3
 * [34ac856d2bcadebf6d807015f11911c7026f4947323217f643c3e3f1fe7532e72ac01bb0748c97be]: postprocessing rule 3
 * 
 */