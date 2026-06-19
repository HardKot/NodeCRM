import { Application } from '../core/index.js';
import { beanDSL } from './beanDSL.js';
import { serverDSL, routingDSL } from './serverDSL.js';


function AppDSL(callback) {
    const app = new Application(process.stdout, process.stderr);
    

    callback({ 
        app,
        bean: (...defs) => beanDSL(defs, app),
        routingDSL: (defs) => routingDSL(defs, app)
    });


    return app;
}

export { AppDSL };
