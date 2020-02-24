const { startServer, stopServer } = require('../../lib/server.js');
const { request } = require('../scripts/helpers');
const generator = require('../scripts/generator');

describe('Memberships list', () => {
    beforeAll(async () => {
        await startServer();
    });

    afterAll(async () => {
        await stopServer();
    });

    afterEach(async () => {
        await generator.clearAll();
    });

    test('should succeed when everything is okay', async () => {
        const user = await generator.createUser({ password: 'test', mail_confirmed_at: new Date() });
        const token = await generator.createAccessToken({}, user);

        const body = await generator.createBody();
        const membership = await generator.createBodyMembership(body, user);

        const res = await request({
            uri: '/bodies/' + body.id + '/members',
            method: 'GET',
            headers: { 'X-Auth-Token': token.value }
        });

        expect(res.statusCode).toEqual(200);
        expect(res.body.success).toEqual(true);
        expect(res.body).toHaveProperty('data');
        expect(res.body).not.toHaveProperty('errors');

        expect(res.body.data.length).toEqual(1);
        expect(res.body.data[0].id).toEqual(membership.id);
    });

    test('should respect limit and offset', async () => {
        const user = await generator.createUser({ password: 'test', mail_confirmed_at: new Date() });
        const token = await generator.createAccessToken({}, user);
        const body = await generator.createBody();

        const firstUser = await generator.createUser();
        await generator.createBodyMembership(body, firstUser);

        const membership = await generator.createBodyMembership(body, user);

        const thirdUser = await generator.createUser();
        await generator.createBodyMembership(body, thirdUser);

        const res = await request({
            uri: '/bodies/' + body.id + '/members?limit=1&offset=1', // second one should be returned
            method: 'GET',
            headers: { 'X-Auth-Token': token.value }
        });

        expect(res.statusCode).toEqual(200);
        expect(res.body.success).toEqual(true);
        expect(res.body).toHaveProperty('data');
        expect(res.body).toHaveProperty('meta');
        expect(res.body).not.toHaveProperty('errors');

        expect(res.body.data.length).toEqual(1);
        expect(res.body.data[0].id).toEqual(membership.id);

        expect(res.body.meta.count).toEqual(3);
    });

    test('should respect sorting', async () => {
        const user = await generator.createUser({ password: 'test', mail_confirmed_at: new Date() });
        const token = await generator.createAccessToken({}, user);
        const body = await generator.createBody();

        const firstUser = await generator.createUser();
        const firstMembership = await generator.createBodyMembership(body, firstUser);

        const secondUser = await generator.createUser();
        const secondMembership = await generator.createBodyMembership(body, secondUser);

        const res = await request({
            uri: '/bodies/' + body.id + '/members?sort=id&direction=desc', // second one should be returned
            method: 'GET',
            headers: { 'X-Auth-Token': token.value }
        });

        expect(res.statusCode).toEqual(200);
        expect(res.body.success).toEqual(true);
        expect(res.body).toHaveProperty('data');
        expect(res.body).toHaveProperty('meta');
        expect(res.body).not.toHaveProperty('errors');

        expect(res.body.data.length).toEqual(2);
        expect(res.body.data[0].id).toEqual(secondMembership.id);
        expect(res.body.data[1].id).toEqual(firstMembership.id);
    });
});
