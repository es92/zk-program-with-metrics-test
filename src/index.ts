import { ZkProgramWithMetrics } from './ZkProgramWithMetrics.js';

import { SelfProof, Field, ZkProgram, verify } from 'o1js';

const { program: RollupAdd, MetricsPublicInput } = ZkProgramWithMetrics({
  name: "rollup-add-example",
  publicInput: Field,

  methods: {
    baseCase: {
      privateInputs: [ Field ],
      async method(publicInput: Field, x: Field) {
        publicInput.assertEquals(x);
      },
    },

    step: {
      privateInputs: [SelfProof, SelfProof],

      async method(
        publicInput: Field,
        left: SelfProof<Field, void>,
        right: SelfProof<Field, void>
      ) {
        left.verify();
        right.verify();
        left.publicInput.add(right.publicInput).assertEquals(publicInput);
      },
    },
  },
});

console.log('compiling program');
const { verificationKey } = await RollupAdd.compile();

console.log('making proof A');
const proofA = await RollupAdd.baseCase(new MetricsPublicInput(Field(3)), Field(3));

console.log('making proof B');
const proofB = await RollupAdd.baseCase(new MetricsPublicInput(Field(4)), Field(4));

console.log('making proof Sum');
const proofSum = await RollupAdd.step(new MetricsPublicInput(Field(7), proofA.publicInput, proofB.publicInput), proofA, proofB);

console.log(proofSum)


console.log('test');
