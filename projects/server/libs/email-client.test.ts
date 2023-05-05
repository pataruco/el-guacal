import { emailApiServer } from '../tests/mocks/email-api-server';
import { createAuthHash, createTokenFromEmail } from './auth';
import {
  getMessageBody,
  getSession,
  identityQuery,
  mailboxQuery,
} from './email-client';

describe('Email client', () => {
  // Establish API mocking before all tests.

  beforeAll(() => emailApiServer.listen());

  // Reset any request handlers that we may add during the tests,

  // so they don't affect other tests.

  afterEach(() => emailApiServer.resetHandlers());

  // Clean up after the tests are finished.

  afterAll(() => emailApiServer.close());

  describe('getSession', () => {
    it('get session URL and primary account id', async () => {
      const { apiUrl, primaryAccounts } = await getSession();

      expect(apiUrl).toBe('https://api.fastmail.com/jmap/api/');
      expect(primaryAccounts).toEqual({
        'urn:ietf:params:jmap:mail': 'xxxx',
        'urn:ietf:params:jmap:submission': 'xxxx',
        'urn:ietf:params:jmap:core': 'xxxx',
      });
    });
  });

  describe('mailboxQuery', () => {
    it('gets draft mailbox Id', async () => {
      const { apiUrl, primaryAccounts } = await getSession();

      const accountId = primaryAccounts['urn:ietf:params:jmap:mail'];

      const draftId = await mailboxQuery({ apiUrl, accountId });

      expect(draftId).toBe('draft-id');
    });
  });

  describe('identityQuery', () => {
    it('gets sender email id', async () => {
      const { apiUrl, primaryAccounts } = await getSession();

      const accountId = primaryAccounts['urn:ietf:params:jmap:mail'];

      const id = await identityQuery({ apiUrl, accountId });

      expect(id).toBe('order-66');
    });
  });

  describe('getMessageBody', () => {
    it('returns email body as string', async () => {
      const email = 'test@example.com';
      const token = await createTokenFromEmail(email);
      const authHash = createAuthHash({ email, token });

      const messageBody = getMessageBody({ authHash, email });

      expect(messageBody).toContain(email);
      expect(messageBody).toContain(authHash);
    });
  });
});
