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
 * [34ac856d2bcadebf6d807015f11911c7026f4947323217f643c3e3f1fe7532e72ac01bb0748c97be]: processing rule 3
 * 
 * [34ac856d2bcadebf6d807015f11911c7026f4947323217f643c3e3f1fe7532e72ac01bb0748c97be]: before dependences of rule 3
 * 
 * [34ac856d2bcadebf6d807015f11911c7026f4947323217f643c3e3f1fe7532e72ac01bb0748c97be]: before dependency rule 3 - 1
 *
 * <-- note: below 3 block will run sequentially->>
 * 
 * [34ac856d2bcadebf6d807015f11911c7026f4947323217f643c3e3f1fe7532e72ac01bb0748c97be][0]: before path object
 * [401bd4c18235469532e932d355ff4dc49fdb1e897b343448ed87b254b79eba27bc18c21b2f985f0c]: preprocessing rule 1
 * [401bd4c18235469532e932d355ff4dc49fdb1e897b343448ed87b254b79eba27bc18c21b2f985f0c]: processing rule 1
 * [401bd4c18235469532e932d355ff4dc49fdb1e897b343448ed87b254b79eba27bc18c21b2f985f0c]: error!! rule 1
 * [34ac856d2bcadebf6d807015f11911c7026f4947323217f643c3e3f1fe7532e72ac01bb0748c97be][0]: after path object
 * 
 * [34ac856d2bcadebf6d807015f11911c7026f4947323217f643c3e3f1fe7532e72ac01bb0748c97be][1]: before path object
 * [401bd4c18235469532e932d355ff4dc49fdb1e896a73fc1103b6de6051e21f9276653811f2afb83a]: preprocessing rule 1
 * [401bd4c18235469532e932d355ff4dc49fdb1e896a73fc1103b6de6051e21f9276653811f2afb83a]: processing rule 1
 * [401bd4c18235469532e932d355ff4dc49fdb1e896a73fc1103b6de6051e21f9276653811f2afb83a]: error!! rule 1
 * [34ac856d2bcadebf6d807015f11911c7026f4947323217f643c3e3f1fe7532e72ac01bb0748c97be][1]: after path object
 * 
 * [34ac856d2bcadebf6d807015f11911c7026f4947323217f643c3e3f1fe7532e72ac01bb0748c97be][2]: before path object
 * [401bd4c18235469532e932d355ff4dc49fdb1e897f5eaff22e058532f3e0675189bf61721f3a9fd6]: preprocessing rule 1
 * [401bd4c18235469532e932d355ff4dc49fdb1e897f5eaff22e058532f3e0675189bf61721f3a9fd6]: processing rule 1
 * [401bd4c18235469532e932d355ff4dc49fdb1e897f5eaff22e058532f3e0675189bf61721f3a9fd6]: error!! rule 1
 * [34ac856d2bcadebf6d807015f11911c7026f4947323217f643c3e3f1fe7532e72ac01bb0748c97be][2]: after path object
 * 
 * [34ac856d2bcadebf6d807015f11911c7026f4947323217f643c3e3f1fe7532e72ac01bb0748c97be]: after dependency rule 3 - 1
 * 
 *  <-- note: rule 2 and rule 4 will run in parallel -->
 * 
 * [239ddf9baa0095c3fda0731f5fff1ade4b511c87323217f643c3e3f1fe7532e72ac01bb0748c97be]: preprocessing rule 2
 * [f4d16ca51366479b8c4da92f363a17062145252f323217f643c3e3f1fe7532e72ac01bb0748c97be]: preprocessing rule 4
 * [f4d16ca51366479b8c4da92f363a17062145252f323217f643c3e3f1fe7532e72ac01bb0748c97be]: processing rule 4
 * [f4d16ca51366479b8c4da92f363a17062145252f323217f643c3e3f1fe7532e72ac01bb0748c97be]: postprocessing rule 4
 * [239ddf9baa0095c3fda0731f5fff1ade4b511c87323217f643c3e3f1fe7532e72ac01bb0748c97be]: processing rule 2
 * [239ddf9baa0095c3fda0731f5fff1ade4b511c87323217f643c3e3f1fe7532e72ac01bb0748c97be]: postprocessing rule 2
 * 
 * [34ac856d2bcadebf6d807015f11911c7026f4947323217f643c3e3f1fe7532e72ac01bb0748c97be]: after dependences of rule 3
 * [34ac856d2bcadebf6d807015f11911c7026f4947323217f643c3e3f1fe7532e72ac01bb0748c97be]: postprocessing rule 3
 */