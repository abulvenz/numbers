const {keys} = Object;

const showSuccess = false;

const deepEqual = (a, b) =>
    a !== undefined && b !== undefined && a !== null && b !== null
        ? typeof a === 'number'
            ? a === b
            : typeof a === 'string'
            ? a === b
            : typeof a === 'object'
            ? keys(a).length !== keys(b).length
                ? false
                : keys(a).every((keyA) => deepEqual(a[keyA], b[keyA]))
            : a === b
        : a === b;

export const expect = (title, expected, actual) =>
    !deepEqual(expected, actual)
        ? console.error(title, ': expected', expected, 'actual', actual)
        : showSuccess
        ? console.info(title)
        : null;

export const block = (title, active, f) => (active ? f() : console.log('Not testing ', title));

export default {
    block,
    expect,
    deepEqual,
};
