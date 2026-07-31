import { beforeEach, describe, it } from 'node:test';
import assert from 'node:assert';

import { Router } from "#routing";

describe('Routing Tests', () => {
    let router;

    beforeEach(() => {
        router = new Router();
    });

    it('success add router nodes', () => {
        const handler = () => {};
        router.add('/users', 'GET', handler);
        router.build();

        assert.equal(router.route('/users', 'GET'), handler);
    });

    it('success add dynamic router nodes', () => {
        const handler = () => {};
        router.add('/users/<id>', 'GET', handler);
        router.build();

        assert.equal(router.route('/users/123', 'GET'), handler);
    });

    it('success add multiple dynamic router nodes', () => {
        const handler = () => {};
        router.add('/users/<userId>/posts/<postId>', 'GET', handler);
        router.build();

        assert.equal(router.route('/users/123/posts/456', 'GET'), handler);
    });

    it('success extract dynamic parameters', () => { 
        const handler = ({ params }) => params;
        router.add('/users/<id>', 'GET', handler);
        router.build();

        const result = router.route('/users/123', 'GET')({  });
        assert.deepEqual(result, { id: '123' });
    });

    it('success handle not found', () => {
        const notFoundHandler = () => 'Not Found';
        router.add("*", notFoundHandler);
        router.build();

        const result = router.route('/nonexistent', 'GET')({ });
        assert.equal(result, 'Not Found');
    });

    it('success handle method not allowed', () => {
        const handler = () => {};
        router.add('/users', 'GET', handler);
        router.build();

        const result = router.route('/users', 'POST');
        assert.equal(result, null);
    });
});