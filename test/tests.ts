import { FirebaseConfig, makeFirebaseAPI } from '../src';

const firebaseConfig = new FirebaseConfig({
  apiKey: 'AIzaSyCnFgFqO3d7RbJDcNAp_eO21KSOISCP9IU',
  projectID: 'fidb-unit-test',
});
const firebaseAPI = makeFirebaseAPI({
  config: firebaseConfig,
  tokenSource: async () => {
    return undefined;
  },
});

QUnit.test('get yoda', async (assert) => {
  const yodaID = 'ZogMMcXdX9FhPFgnnJ0n';
  const yoda = (await firebaseAPI('get', `/people/${yodaID}`)) as {
    fields: {
      name: {
        stringValue: string;
      };
      age: {
        integerValue: string;
      };
    };
  };
  assert.deepEqual(yoda.fields.name.stringValue, 'yoda', 'expect name yoda');
  assert.deepEqual(yoda.fields.age.integerValue, '900', 'expect age 900');
});
