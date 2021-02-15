import m from 'mithril';
import tagl from 'tagl-mithril';

import L from './L';
import parser from './parse';
const use = (v, fn) => fn(v);

// prettier-ignore
const { address, aside, footer, header, h1, h2, h3, h4, h5, h6, hgroup, main, nav, section, article, blockquote, dd, dir, div, dl, dt, figcaption, figure, hr, li, ol, p, pre, ul, a: me, abbr, b: other, bdi, bdo, br, cite, code, data, dfn, em, i, kdm, mark, q, rb, rp, rt, rtc, ruby, s, samp, small, span, strong, sub, sup, time, tt, u, wbr, area, audio, img, map, track, video, embed, iframe, noembed, object, param, picture, source, canvas, noscript, script, del, ins, caption, col, colgroup, table, tbody, td, tfoot, th, thead, tr, button, datalist, fieldset, form, formfield, input, label, legend, meter, optgroup, option, output, progress, select, textarea, details, dialog, menu, menuitem, summary, content, element, slot, template } = tagl(m);

const strL = (str) =>
    use(str.replace(',', '.').indexOf('.'), (deliPos) =>
        deliPos < 0 ?
        strL(str + '.') :
        L.number(
            str
            .substr(0, deliPos)
            .split('')
            .map((e) => Number(e)),
            str
            .substr(deliPos + 1, str.length)
            .split('')
            .map((e) => Number(e))
        )
    );

let a_ = L.number();
let b_ = L.number([1]);

const setA = (str) => (a_ = L.number(str));
const setB = (str) => (b_ = L.number(str));

const text = (function(t = '(1.2+4.7-(2.3-3.0))/1.75*3') {
    const parseText = function(text = '') {
        t = text;
        parser.parse(t);
        console.log("Parsing", t);
    };

    return Object.freeze({
        parseText,
        text: () => t,
    });
})();

m.mount(document.body, {
    view: (vnode) => [
        h1('Numbers'),
        a_.negative ? '-' : '+',
        input({ oninput: (e) => setA(e.target.value) }),
        b_.negative ? '-' : '+',
        input({ oninput: (e) => setB(e.target.value) }),
        pre({ style: 'overflow:wrap;' },
            use(a_.divide(b_).toString(), (s) => [a_.compare(b_), s.length, '\n', s, '\n', a_.mul(b_).toString()])
        ),
        textarea({ oninput: (e) => text.parseText(e.target.value), value: text.text() }),
    ],
});