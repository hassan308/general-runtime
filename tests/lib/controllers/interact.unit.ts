import { expect } from 'chai';
import sinon from 'sinon';

import Interact from '@/lib/controllers/interact';

describe('interact controller unit tests', () => {
  const versionID = 'some-version-id';
  const authorization = 'VF.ABCD.efgh';

  describe('state', () => {
    it('works', async () => {
      const output = { foo: 'bar' };
      const services = { interact: { state: sinon.stub().resolves(output) } };
      const controller = new Interact(services as any, {} as any);

      const req = {
        headers: { versionID, authorization },
        params: {},
        body: {},
      };
      expect(await controller.state(req as any)).to.eql(output);
      expect(services.interact.state.args[0]).to.eql([versionID, authorization]);
    });
  });

  describe('handler', () => {
    it('works', async () => {
      const output = { foo: 'bar' };
      const services = { interact: { handler: sinon.stub().resolves(output) } };
      const controller = new Interact(services as any, {} as any);

      const req = { headers: {}, params: {}, body: {} };
      expect(await controller.handler(req as any)).to.eql(output);
      expect(services.interact.handler.args).to.eql([[req]]);
    });
  });
});
