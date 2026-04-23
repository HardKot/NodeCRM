const { Bean, BeanBuilder } = require('../core/bean')

function BeanDSL(name, factory) {
    const builder = new BeanBuilder();
    builder.name(name).factory(factory);
    return builder;
}

module.exports = { BeanDSL };
