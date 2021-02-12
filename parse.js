import L from './L';
const {freeze, keys} = Object;

const parseNumbers = function (str) {
    const regex = /([0-9]\.|[0-9]*)\.[0-9]*/gm;
    let m;
    let varCount = 0;
    const vars = [];

    while ((m = regex.exec(str)) !== null) {
        // This is necessary to avoid infinite loops with zero-width matches
        if (m.index === regex.lastIndex) {
            regex.lastIndex++;
        }

        const name = `@v${++varCount}`;

        str = str.replace(m[0], name);

        vars.push({
            number: L.number(m[0]),
            name,
        });

        // The result can be accessed through the `m`-variable.
        m.forEach((match, groupIndex) => {
            console.log(`Found match, group ${groupIndex}: ${match}`);
        });
    }

    return freeze({
        str,
        vars,
    });
};

const parse = (t) => {
    console.log(parseNumbers(t));
};

export default freeze({
    parse,
});
