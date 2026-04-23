const { Optional } = require('../../libs/utils/optional.js');
describe('Optional', () => {
    it('Создание Optional с непустым значением', () => {
        const optional = Optional.of(5);
        expect(optional.isPresent()).toBe(true);
        expect(optional.get()).toBe(5);
    });
    it('Создание Optional с пустым значением', () => {
        const optional = Optional.empty();
        expect(optional.isEmpty()).toBe(true);
    });
    it('Получение значения с orElse', () => {
        const optional = Optional.ofNullable(null);
        expect(optional.orElse(10)).toBe(10);
    });
    it('Получение значения с orElseGet', () => {
        const optional = Optional.ofNullable(undefined);
        expect(optional.orElseGet(() => 20)).toBe(20);
    });
    it('Использование ifPresent', () => {
        const optional = Optional.of(15);
        let value = 0;
        optional.ifPresent(v => (value = v));
        expect(value).toBe(15);
    });
});