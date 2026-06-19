import { App } from '../libs/dsl/index.js';

App(({
    bean,
    routing,
}) => {
    bean('ad', () => null)

    routing(({ route }) => {
        route('/test2', it => {
            it.get(() => null)
            it.post(() => null)

            it.route('/<id>', item => {
                item.get(() => null)
                item.put(() => null)
                item.delete(() => null)
            })
        })

        const testRoute3 = route('/test3', it => {
            it.get(() => null)
            it.post(() => null)
        });

        testRoute3.route('/<id>', it => {
            it.get(() => null)
            it.put(() => null)
            it.delete(() => null)
        });
    })
})