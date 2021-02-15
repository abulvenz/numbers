import L from './L';
const { freeze, keys } = Object;

const use = (v, fn) => fn(v);

const createParseState = function(str) {
    let varCount = 0;
    const variables = [];
    const nextVarName = (p = "v") => `@${p}${varCount += 1}`;
    return Object.freeze({
        str: (s = str) => str = s,
        addVariable: (str_) => use(nextVarName(), (name) => variables.push({
            str: str_,
            name
        }) && name),
        toString: () => str + " # " + JSON.stringify(variables)
    });
};

// const c = createParseState("1.0 + (3123.+3312*(3-8)+ 0.5)*((3.0*1)-3)");
// console.log(c.toString());

const replace = function(state, regex, replacement = (e) => e) {
    console.log("parsing", state.str(), regex.toString())

    let m;
    let found = 0;
    const vars = [];

    while ((m = regex.exec(state.str())) !== null && found < 10) {
        if (m.index === regex.lastIndex) {
            regex.lastIndex++;
        }
        found += 1;
        const name = state.addVariable(m[1]);
        const rrr = replacement(m[1]);
        state.str(state.str().replace(rrr, name));
    }
    return found > 0;
};

const parse_ = function(str) {
    const state = createParseState(str);

    while (replace(state, /([0-9]*\.[0-9]*|[0-9]+)/g));
    while (replace(state, /\(([^\(|\)]*)\)/, e => `(${e})`));

    console.log(state.toString())
};


const parseNumbers = function(str) {
    const regex = /[^v]([0-9]*\.[0-9]*|[0-9]+)/gm;
    let m;
    let varCount = 0;
    const vars = [];

    while ((m = regex.exec(str)) !== null && varCount < 10) {
        // This is necessary to avoid infinite loops with zero-width matches
        if (m.index === regex.lastIndex) {
            regex.lastIndex++;
        }

        console.log("Matching", m[1], m[0])
        const name = `@v${++varCount}`;
        str = str.replace(m[1], name);

        vars.push({
            number: L.number(m[1]),
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


const parseParens = function(str_) {
    const regex = /\(([^\(|\)]*)\)/gm;
    let m = 1;
    let str = str_;
    let varCount = 0;
    const vars = [];

    while ((m !== null) && (varCount < 10)) {
        m = regex.exec(str);

        if (m === null) {
            console.log("Nix geht mehr", str)
            break;
        }
        // This is necessary to avoid infinite loops with zero-width matches
        if (m.index === regex.lastIndex) {
            regex.lastIndex++;
        }
        console.log("Matching", m[1])
        const name = `@p${++varCount}`;
        str = str.replace("(" + m[1] + ")", name);
        console.log("st", str, m[0], m[1])

        vars.push({
            subexp: m[1],
            name,
        });

        // The result can be accessed through the `m`-variable.
        m.forEach((match, groupIndex) => {
            console.log(`Found match, group ${groupIndex}: ${match}`);
        });
    }

    console.log(regex.exec(str), varCount)

    return freeze({
        str,
        vars,
    });
};


const parse = (t) => {
    parse_(t);

    //  console.log(parseParens(parseNumbers(t).str))
};

export default freeze({
    parse,
});