import { Field, ZkProgram, SelfProof, Struct } from 'o1js';

import {
  InferProvable,
} from 'o1js';


// TODO this needs to be generalized its only for ZkPrograms that have a Field publicInput

function ZkProgramWithMetrics(
  config: {
    name: string;
    publicInput: typeof Field;
    methods: { baseCase: {
                            privateInputs: [ typeof Field ],
                            method: (a: Field, b: Field) => Promise<void>
                         ,
               },
               step: {
                 privateInputs: [ typeof SelfProof<Field, void>, typeof SelfProof<Field, void> ],
                 method: (a: Field, b: SelfProof<Field, void>, c: SelfProof<Field, void>) => Promise<void>
               }
    }
  }
) {


  class MetricsPublicInput extends Struct({
    programPublicInput: Field,
    proofCount: Field
  }){ 
    constructor(x: Field);
    constructor(x: Field, m1: MetricsPublicInput, m2: MetricsPublicInput);
    constructor(x: Field, m1?: MetricsPublicInput, m2?: MetricsPublicInput) {
      if (m1 != null && m2 != null)  {
        super({ 
          programPublicInput: x,
          proofCount: m1.proofCount.add(m2.proofCount),
        });
      } else {
        super({ 
          programPublicInput: x,
          proofCount: Field(1),
        });
      }
    }
  };

  return { program: ZkProgram({
    name: config.name,
    publicInput: MetricsPublicInput,
    methods: {
      baseCase: {
        privateInputs: [ Field ],
        async method(a: MetricsPublicInput, b: Field) {
          a.proofCount.assertEquals(Field(1));
          return await config.methods.baseCase.method(a.programPublicInput, b);
        },
      },
      step: {
        privateInputs: [ SelfProof, SelfProof ],
        async method(a: MetricsPublicInput, b: SelfProof<MetricsPublicInput, void>, c: SelfProof<MetricsPublicInput, void>) {
          a.proofCount.assertEquals(b.publicInput.proofCount.add(c.publicInput.proofCount));
          const b2 = {
            verify: b.verify,
            publicInput: b.publicInput.programPublicInput,
          } as SelfProof<Field, void>
          const c2 = {
            verify: c.verify,
            publicInput: c.publicInput.programPublicInput,
          } as SelfProof<Field, void>
          return await config.methods.step.method(a.programPublicInput, b2, c2);
        },
      }
    }
  }), MetricsPublicInput: MetricsPublicInput };
}

export { ZkProgramWithMetrics }
