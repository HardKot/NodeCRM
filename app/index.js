import { Application } from '#core';

Application.default(({ }) => { });

App(({ bean, routing }) => {
  bean('ad', () => null);

  routing(({ route }) => {
    route('/test2', test => {
      test.get(() => null);
      test.post(() => null);

      test.route('/<id>', id => {
        id.get(() => null);
        id.put(() => null);
        id.delete(() => null);
      });
    });
  });
});
