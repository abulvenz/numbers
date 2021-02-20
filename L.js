import { block, expect } from "./test";

const { max, abs, min, trunc, random } = Math;
const { assign } = Object;
const test = false;

let log = () => null

const range = function(S, N) {
    const r = [];
    for (let i = S; i <= N; i += 1) {
        r.push(i);
    }
    return r;
};

const from = (S) =>
    assign({
        to: (N) => range(S, N),
        downTo: (N) =>
            range(N, S)
            .map((e, i) => i)
            .map((e) => S - e),
    });

const repeat = (N, o) => range(1, N).map(() => o);
const zeros = (N) => repeat(N, 0);

const leftPadZeros = (targetLength, arr) => [...zeros(targetLength - arr.length), ...arr];
const rightPadZeros = (targetLength, arr) => [...arr, ...zeros(targetLength - arr.length)];

const reversed = (arr) => arr.slice(0, arr.length).reverse();
const findIndices = (arr, cond) => arr.map((e, i) => (cond(e) ? i : undefined)).filter((e) => e !== undefined);

const use = (v, fn) => fn(v);
const leftTrim = (arr) =>
    use(
        arr.findIndex((e) => e !== 0),
        (idx) => (idx < 0 ? [] : arr.slice(idx, arr.length))
    );
const rightTrim = (arr) =>
    use(
        reversed(arr).findIndex((e) => e !== 0),
        (idx) => (idx < 0 ? [] : arr.slice(0, arr.length - idx))
    );

const firstDerivate = (arr = []) =>
    use([0, ...arr], (shifted) => [...arr, 0].map((a, i) => a - shifted[i]).splice(0, arr.length));

const period = function(arr = [], minLength = 2) {
    return {
        rest: [1],
        period: [6],
    };
};


const L1 = function(front = [], back = [], negative = false) {

    const chunkSize = 10;
    if (typeof front === 'string') {
        let str = front;
        str = str.trim();
        negative = str[0] === '-';
        if (negative) str = str.substr(1, str.length);

        let deliPos = str.replace(',', '.').indexOf('.');

        if (deliPos < 0) {
            str = str + '.';
            deliPos = str.indexOf('.');
        }
        front = str
            .substr(0, deliPos)
            .split('')
            .map((e) => Number(e));
        back = str
            .substr(deliPos + 1, str.length)
            .split('')
            .map((e) => Number(e));
    }

    const align = (other, isMultiplication) => {
        const otherBack = other.back();
        const otherFront = other.front();

        const postcomma = max(otherBack.length, back.length);
        const precomma = max(otherFront.length, front.length);

        const a = [
            ...zeros(!isMultiplication ? 1 : postcomma + precomma),
            ...leftPadZeros(precomma, otherFront),
            ...rightPadZeros(postcomma, otherBack),
        ];
        const b = [
            ...zeros(!isMultiplication ? 1 : postcomma + precomma),
            ...leftPadZeros(precomma, front),
            ...rightPadZeros(postcomma, back),
        ];

        return { other: a, me: b, postcomma, precomma };
    };

    const add = (other_) => {
        if (negative !== other_.negative) {
            return sub(other_.invert());
        }
        const { other, me, postcomma } = align(other_);
        let carry = 0;

        let result = from(other.length - 1)
            .downTo(0)
            .map((i) => {
                const sum = other[i] + me[i] + carry;
                carry = trunc(sum / chunkSize);
                return sum % chunkSize;
            });

        const newBack = leftTrim(result.splice(0, postcomma));
        const newFront = result;

        return L(leftTrim(newFront.reverse()), newBack.reverse(), negative);
    };

    const compare = (other_, takeAbs = false) => {
        if (takeAbs) {
            if (negative && !other_.negative) return -1;
            if (!negative && other_.negative) return 1;
        }
        //        console.log("compare", toString(), other_.toString())
        const { other, me } = align(other_);
        const differentIdx = other.findIndex((e, idx) => e !== me[idx]);
        return differentIdx < 0 ?
            0 :
            !negative ?
            other[differentIdx] > me[differentIdx] ?
            -1 :
            1 :
            other[differentIdx] < me[differentIdx] ?
            -1 :
            1;
    };

    const lessThan = (other_) => compare(other_) < 0;
    const lessThanOrEqual = (other_) => compare(other_) < 1;
    const greaterThan = (other_) => compare(other_) > 0;
    const greaterThanOrEqual = (other_) => compare(other_) > -1;
    const equal = (other_) => compare(other_) === 0;

    const toString = (sep = '.') =>
        (negative ? '-' : '') +
        (front.length > 0 ? front.join('') : '0') +
        (back.length > 0 ? sep : '') +
        back.join('');

    const invert = () => L(front, back, !negative);

    const sub = (other_) => {
        let cmp = compare(other_);
        if (cmp === 0) return L([0]);
        if (negative && other_.negative) {
            return other_.invert().sub(L(front, back));
        }

        if ((!negative && other_.negative) || (negative && !other_.negative)) {
            return add(other_.invert());
        }
        const { other, me, postcomma } = align(other_);

        const a = cmp > 0 ? me : other;
        const b = cmp < 0 ? me : other;

        let carry = 0;
        let result = from(a.length - 1)
            .downTo(0)
            .map((i) => {
                const diff = chunkSize + a[i] - b[i] - carry;
                //   log(diff, a[i], b[i], carry)
                carry = diff - chunkSize < 0 ? 1 : 0;
                return abs(diff % chunkSize);
            });

        const newBack = leftTrim(result.splice(0, postcomma));
        const newFront = result;

        return L(leftTrim(newFront.reverse()), newBack.reverse(), cmp < 0 ? true : false);
    };

    const multiplySingleArray = (me, multiplier) => {
        let carry = 0;
        const num = from(me.length - 1)
            .downTo(0)
            .map((idx) => me[idx])
            .map((digit) => {
                const prod = +multiplier * digit + carry;
                carry = trunc(prod / chunkSize);
                return prod % chunkSize;
            });

        return L(num.reverse());
    };

    const mul = (other_) => {
        const { me, other, postcomma } = align(other_, false);

        const shiftsByMultipliers = other
            .map((e, i) =>
                e !== 0 ?
                assign({
                    multiplier: e,
                    shift: other.length - i - 1,
                }) :
                undefined
            )
            .filter((e) => e)
            .reduce(
                (acc, v) =>
                assign(acc, {
                    [v.multiplier]: [...(acc[v.multiplier] || []), v.shift],
                }), {}
            );

        const result_ = Object.keys(shiftsByMultipliers)
            .map((multiplier) => {
                const single = multiplySingleArray(me, +multiplier);
                return shiftsByMultipliers[multiplier]
                    .map((shift) => single.shift(shift))
                    .reduce((acc, v) => acc.add(v), L('0'));
            })
            .reduce((acc, v) => acc.add(v), L('0'));

        return use(result_.shift(-2 * postcomma), (shifted) =>
            negative !== other_.negative ? shifted.invert() : shifted
        );
    };

    const isZero = () => front.every((e) => e === 0) && back.every((e) => e === 0);

    const mostSignificentDigit = () =>
        isZero() ?
        0 :
        use(
            front.findIndex((e) => e !== 0),
            (idx) =>
            idx > -1 ?
            front.length - 1 - idx :
            use(
                back.findIndex((e) => e !== 0),
                (idx_) => (idx_ > -1 ? -idx_ - 1 : 0)
            )
        );

    const fillEmptySlots = (arr = [], def = 0) => {
        for (let i = 0; i < arr.length; i++) {
            arr[i] = arr[i] || 0;
        }
        return arr;
    };

    const divide = (other_) => {
        if (use(other_.toString(), (ostr) => ostr === '0' || ostr === '0.0')) {
            throw new Error('Division by zero');
        }

        const numByMultiplier = from(0)
            .to(9)
            .reduce(
                (acc, num) =>
                assign(acc, {
                    [num]: other_.mul(L([num])),
                }), {}
            );

        const leastNonZeroMultiplier = numByMultiplier['1'];
        const resultFront = [];
        const resultBack = [];
        let rest = L(front, back);
        let count = 0;

        const multiplierShift = leastNonZeroMultiplier.mostSignificentDigit();

        while (
            rest.greaterThan(
                L('0.00000000000000000000000000000000000000000000001')
            ) &&
            count++ < 1000
        ) {
            //  log(count, rest.toString())

            const initialShift = rest.mostSignificentDigit() - multiplierShift;
            let restDiminisher = leastNonZeroMultiplier.shift(initialShift);
            let count2 = 0;
            let shift = initialShift;
            while (restDiminisher.greaterThan(rest) && count2++ < 1000) {
                restDiminisher = leastNonZeroMultiplier.shift(--shift);
            }

            let digit = 1;
            guessDigit: for (let n = 9; n > 1; n--) {
                const guess = numByMultiplier[String(n)].shift(shift);
                if (guess.lessThanOrEqual(rest)) {
                    digit = n;
                    restDiminisher = guess;
                    break guessDigit;
                }
            }
            if (digit === 0) throw new Error('Nö');
            const resultingShift = multiplierShift - shift;
            if (shift >= 0) {
                resultFront[shift] = digit;
            } else {
                resultBack[-shift - 1] = digit;
            }
            rest = rest.sub(restDiminisher);
        }

        resultFront.reverse();
        return L(leftTrim(fillEmptySlots(resultFront)), fillEmptySlots(resultBack));
    };

    const shift = (width) => {
        // << leftshift
        if (width > 0) {
            const newBackDigits = back.length - width;
            const newBack = newBackDigits < 1 ? [] : back.slice(back.length - newBackDigits, back.length);
            const newFront = [...front, ...back.slice(0, back.length - newBackDigits), ...zeros(-newBackDigits)];
            return L(leftTrim(newFront), newBack, negative);
        }
        // >> rightshift
        else if (width < 0) {
            const newFrontDigits = front.length + width;
            const newFront = newFrontDigits < 1 ? [0] : front.slice(0, newFrontDigits);
            const newBack = [...zeros(-newFrontDigits), ...front.slice(max(0, newFrontDigits), front.length), ...back];
            return L(newFront, rightTrim(newBack), negative);
        } else if (width === 0) {
            return L(front, back, negative);
        }
    };

    const square = function() {
        return L(front, back).mul(L(front, back));
    };

    const absolute = function() {
        return L(front, back);
    };

    const round = function(p = 0) {
        return use(
            L(front, back, negative).shift(p - 1).trunc(1),
            shifted => shifted.trunc().add(L("1")).shift(-p + 1)
        );
    };

    const sqrt = function(precision = 50) {
        const innerPrec = precision + 2;
        const threshold = L([0], [...zeros(innerPrec), 1]);
        const target = L(front, back);

        let left = L("0");
        let right = target.lessThan(L("1")) ? L("1") : target;
        let diff = undefined;
        let middle = undefined;
        do {
            middle = left.add(right).mul(L(".5"));
            let middleSquare = middle.square();

            if (middleSquare.greaterThan(target)) {
                right = middle;

            } else {
                left = middle;
            }
            diff = middleSquare.sub(target).abs();
        } while (diff.greaterThanOrEqual(threshold));

        return middle.round(innerPrec).trunc(innerPrec - 2).trim();
    };

    const sqrt2 = function(precision = 1500) {
        let p = L("1");
        let q = L("1");

        for (let k = 0; k < precision; k++) {
            let op = p;
            p = op.add(q.mul(L("2")));
            q = op.add(q);
        }
        return p.divide(q);
    };

    const trim = function() {
        return L(leftTrim(front), rightTrim(back));
    };

    const backHistogram = function() {
        return back.reduce((acc, v) => assign(acc, {
            [v]: (acc[v] || 0) + 1
        }), {});
    };

    return Object.freeze({
        add,
        abs: absolute,
        sub,
        mul,
        trim,
        sqrt,
        equal,
        shift,
        round,
        trunc: (p = 0) => L(front, back.slice(0, p), negative),
        square,
        invert,
        divide,
        isZero,
        compare,
        lessThan,
        toString,
        greaterThan,
        backHistogram,
        lessThanOrEqual,
        greaterThanOrEqual,
        mostSignificentDigit,
        front: () => front.slice(0, front.length),
        back: () => back.slice(0, back.length),
        _front: front,
        _back: back,
        negative,
    });
};

const L = L1;


if (test) {


    block('Range', test, () => {
        expect('range(1,3) === [1,2,3]', [1, 2, 3], range(1, 3));
        expect('from(3).downTo(1) === [3,2,1]', [3, 2, 1], from(3).downTo(1));
        expect('range(0,3) === [0,1,2,3]', [0, 1, 2, 3], range(0, 3));
        expect('from(0).to(3) === [0,1,2,3]', [0, 1, 2, 3], from(0).to(3));
        expect('from(3).downTo(0) === [3,2,1,0]', [3, 2, 1, 0], from(3).downTo(0));
        expect('from(9).downTo(1) === [9,8,7,6,5,4,3,2,1]', [9, 8, 7, 6, 5, 4, 3, 2, 1], from(9).downTo(1));
    });

    block('Zeros', test, () => {
        expect('Zeros 3', [0, 0, 0], zeros(3));
        expect('Zeros 6', [0, 0, 0, 0, 0, 0], zeros(6));
        expect('Zeros 0', [], zeros(0));
    });

    block('Repeat', test, () => {
        expect('repeat', [{ a: 1 }, { a: 1 }], repeat(2, { a: 1 }));
    });

    block('firstDerivate', test, () => {
        expect(
            'firstDerivate', [0, 1, 5],
            firstDerivate([0, 1, 6], (e) => e === 0)
        );
    });

    block('findIndices', test, () => {
        expect(
            'findIndices', [0, 1, 5],
            findIndices([0, 0, 3, 3, 3, 0, 45124, 124, 43, undefined], (e) => e === 0)
        );
    });

    block('leftPadZeros', test, () => {
        expect('leftPadZeros [1]', [0, 0, 1], leftPadZeros(3, [1]));
        expect('leftPadZeros [1, 3, 1, 0, 0]', [0, 0, 1, 3, 1, 0, 0], leftPadZeros(7, [1, 3, 1, 0, 0]));
        expect('leftPadZeros [0, 1, 3, 1, 0, 0]', [0, 0, 1, 3, 1, 0, 0], leftPadZeros(7, [0, 1, 3, 1, 0, 0]));
        expect('leftPadZeros [1]', [1], leftPadZeros(0, [1]));
        expect('leftPadZeros [1, 1, 1, 1]', [1, 1, 1, 1], leftPadZeros(3, [1, 1, 1, 1]));
    });

    block('rightPadZeros', test, () => {
        expect('rightPadZeros [1]', [1, 0, 0], rightPadZeros(3, [1]));
        expect('rightPadZeros [1, 3, 1, 0, 0]', [1, 3, 1, 0, 0, 0, 0], rightPadZeros(7, [1, 3, 1, 0, 0]));
        expect('rightPadZeros [0, 1, 3, 1, 0, 0]', [0, 1, 3, 1, 0, 0, 0], rightPadZeros(7, [0, 1, 3, 1, 0, 0]));
        expect('rightPadZeros [1]', [1], rightPadZeros(0, [1]));
        expect('rightPadZeros [1, 1, 1, 1]', [1, 1, 1, 1], rightPadZeros(3, [1, 1, 1, 1]));
    });

    block('Trim', test, () => {
        expect('leftTrim', [1, 2, 3], leftTrim([0, 1, 2, 3]));
        expect('leftTrim', [], leftTrim([0, 0, 0, 0]));
        expect('rightTrim', [1, 2, 3], rightTrim([1, 2, 3, 0, 0]));
        expect('rightTrim', [0, 0, 1, 2, 3], rightTrim([0, 0, 1, 2, 3, 0, 0]));
        expect('rightTrim', [], rightTrim([0, 0, 0, 0]));
    });

    block('Period', test, () => {
        expect('', { rest: [], period: [] }, period([]));
        expect('0.166666 = 0.1_6', { rest: [1], period: [6] }, period([1, 6, 6, 6, 6, 6]));
        expect('0.166 = 0.1_6', { rest: [1], period: [6] }, period([1, 6, 6, 6, 6, 6]));

        expect(
            `000000040017115180428265180428265180428265180428265180428265180428265180428265180428265180428265180428 
            = 00000004001711 | 518042826
            `, {
                rest: '00000004001711'.split('').map(Number),
                period: '518042826'.split('').map(Number),
            },
            period(
                '000000040017115180428265180428265180428265180428265180428265180428265180428265180428265180428265180428'
                .split('')
                .map(Number)
            )
        );

        // 4.44634612671235 / 111111111 = 0.000000040017115180428265180428265180428265180428265180428265180428265180428265180428265180428265180428
    });
}

if (test) {
    block('Subtraction', test, () => {
        expect('Sub 4 - 1 = 3', '3', L('4').sub(L('1')).toString());

        expect('Sub 1.1 - 1.1 = 0', '0', L('1.1').sub(L('1.1')).toString());
        expect('Sub 1.2 - 1.1 = 0.1', '0.1', L('1.2').sub(L('1.1')).toString());
        expect('Sub 1.1 - 1.2 = -0.1', '-0.1', L('1.1').sub(L('1.2')).toString());
        expect('Sub -5 - -7 = 2', '2', L('-5').sub(L('-7')).toString());
        expect('Sub -5 - -4 = -1', '-1', L('-5').sub(L('-4')).toString());
        expect('Sub  5 - -7 = 12', '12', L('5').sub(L('-7')).toString());
        expect('Sub  5 - 7 = -2', '-2', L('5').sub(L('7')).toString());
        expect('Sub  7 - 5 = 2', '2', L('7').sub(L('5')).toString());
        expect('Sub  0 - 5 = -5', '-5', L('0').sub(L('5')).toString());
        expect('Sub -5 - 7 = -12', '-12', L('-5').sub(L('7')).toString());
        expect('Sub  0.3 - 5 = -4.7', '-4.7', L('0.3').sub(L('5')).toString());

        expect('Sub  1.999999 - .999999 = 1', '1', L('1.999999').sub(L('.999999')).toString());
        expect('Sub  0.999999 - 1 = -0.000001', '-0.000001', L('0.999999').sub(L('1')).toString());

    });

    block('Square', test, () => {
        expect("2² = 4", "4", L("2").square().toString());
        expect("2² - 1 = 3", "3", L("4").sub(L("1")).toString())
    });

    expect("1 to string is OK", "1", L("1").toString());

    block('Square-Root with limited precision', test, () => {
        expect("sqrt(25) = 5", "5", L("25").sqrt(10).toString())
        expect("sqrt(1) = 1", "1", L("1.0").sqrt().toString())
        expect("sqrt(6.25) = 2.5", "2.5", L("6.25").sqrt().toString())
        expect("sqrt(2,8) = 1.41421356", "1.41421356", L("2").sqrt(8).toString())
        expect("sqrt(24,7) = 4.8989794", "4.8989794", L("24").sqrt(7).toString())
        expect("sqrt(0.25) = 0.5", "0.5", L("0.25").sqrt().toString())

        expect("sqrt(2) = 1.41421356237309504880168872420969807856967187537694", "1.41421356237309504880168872420969807856967187537694", L("2").sqrt().toString())
    });

    log = console.log;
    // Test the normality of distribution of numbers in sqrt2
    //    console.log(L("1.4142135623730950488016887242096980785696718753769480731766797379907324784621070388503875343276415727").backHistogram())



    log = () => null;

    block('Right shift', test, () => {
        expect('6>>1 = .6', '0.6', L('6').shift(-1).toString());
        expect('6>>2 = .06', '0.06', L('6').shift(-2).toString());
        expect('6>>3 = .006', '0.006', L('6').shift(-3).toString());
        expect('6>>4 = .0006', '0.0006', L('6').shift(-4).toString());
        expect('6>>5 = .00006', '0.00006', L('6').shift(-5).toString());

        expect('543>>1 = 54.3', '54.3', L('543').shift(-1).toString());
        expect('543>>2 = 5.43', '5.43', L('543').shift(-2).toString());
        expect('543>>3 = 0.543', '0.543', L('543').shift(-3).toString());
        expect('543>>4 = 0.0543', '0.0543', L('543').shift(-4).toString());
        expect('543>>5 = 0.00543', '0.00543', L('543').shift(-5).toString());
        expect('543>>6 = 0.000543', '0.000543', L('543').shift(-6).toString());
        expect('543>>0 = 543', '543', L('543').shift(-0).toString());

        expect('54.3>>1 = 543', '543', L('54.3').shift(1).toString());
        expect('5.43>>2 = 543', '543', L('5.43').shift(2).toString());
        expect('0.543>>3 = 543', '543', L('0.543').shift(3).toString());
        expect('0.0543>>4 = 543', '543', L('0.0543').shift(4).toString());
        expect('Right Shifting 1>>2 = 0.01', '0.01', L('1').shift(-2).toString());
        expect('Right Shifting 1>>1 = 0.1', '0.1', L('1').shift(-1).toString());
        expect('Right Shifting 123>>2 = 1.23', '1.23', L('123').shift(-2).toString());
        expect('Right Shifting 123.4>>2 = 1.234', '1.234', L('123.4').shift(-2).toString());

        expect('Right Shifting 100>>2 = 1', '1', L('100').shift(-2).toString());

        expect('Right Shifting 100>>2 = 1', '1', L('100').shift(-2).toString());
        expect('Right Shifting 10000>>4 = 1', '1', L('10000').shift(-4).toString());

        expect('Right Shifting 1001>>3 = 1.001', '1.001', L('1001').shift(-3).toString());
    });

    block('Left shift', test, () => {

        expect('0.00543<<5 = 543', '543', L('0.00543').shift(5).toString());
        expect('543<<0 = 543', '543', L('543').shift(0).toString());
        expect('Left Shifting 0.01234<<2 = 1.234', '1.234', L('0.01234').shift(2).toString());
        expect('Left Shifting 1.01<<2 = 101', '101', L('1.01').shift(2).toString());
        expect('Left Shifting 1.01<<3 = 1010', '1010', L('1.01').shift(3).toString());
        expect('Left Shifting 1.01<<1 = 10.1', '10.1', L('1.01').shift(1).toString());
        expect('Left Shifting -1.01<<1 = -10.1', '-10.1', L('-1.01').shift(1).toString());

        expect('Left Shifting 0.01<<2 = 1', '1', L('0.01').shift(2).toString());
        expect('Left Shifting 1<<2 = 100', '100', L('1').shift(2).toString());
        expect('Left Shifting 1<<4 = 10000', '10000', L('1').shift(4).toString());

    });

    block('isZero', test, () => {
        expect('isZero 100 = false', false, L('100').isZero());
        expect('isZero 0 = true', true, L('0').isZero());
    });

    block('Most significant digit', test, () => {
        expect('MostSignificantDigit 100 = 2', 2, L('100').mostSignificentDigit());
        expect('MostSignificantDigit 1000 = 3', 3, L('1000').mostSignificentDigit());
        expect('MostSignificantDigit 0 = 0', 0, L('0').mostSignificentDigit());
        expect('MostSignificantDigit 0.1 = -1', -1, L('0.1').mostSignificentDigit());
        expect('MostSignificantDigit 3.1 = 0', 0, L('3.1').mostSignificentDigit());
        expect('MostSignificantDigit 0.01 = -2', -2, L('0.01').mostSignificentDigit());
        expect('MostSignificantDigit -0.001 = -3', -3, L('-0.001').mostSignificentDigit());
    });

    block('Division', test, () => {

        expect('Division 20 / 4 = 5', '5', L('20').divide(L('4')).toString());

        expect('Division 100 / 10 = 10', '10', L('100').divide(L('10')).toString());
        expect('Division 1 / 10 = 0.1', '0.1', L('1').divide(L('10')).toString());
        expect('Division 1 / 0.01 = 100', '100', L('1').divide(L('0.01')).toString());
        expect('Division 1 / 1000 = 0.001', '0.001', L('1').divide(L('1000')).toString());

        expect('Division 10 / 10 = 1', '1', L('10').divide(L('10')).toString());
        expect('Division 0.1 / 0.1 = 1', '1', L('0.1').divide(L('0.1')).toString());
        expect('Division 0.01 / 0.01 = 1', '1', L('0.01').divide(L('0.01')).toString());
        expect('Division 0.01 / 0.02 = 0.5', '0.5', L('0.01').divide(L('0.02')).toString());
        expect('Division 0.02 / 0.01 = 2', '2', L('0.02').divide(L('0.01')).toString());

        expect('Division 1 / 6 = 1', '0.16_6', L('1').divide(L('6')).toString());
        // throw new Error("Stop")

        // log = console.log
        expect("Division 3/2 = 1.5", "1.5", L("3").divide(L("2")).toString());
        log = () => null

        expect("Division 121/11 = 11", "11", L("121").divide(L("11")).toString());
        expect("Division 121/10 = 12.1", "12.1", L("121").divide(L("10")).toString());
        expect("Division 121/100 = 1.21", "1.21", L("121").divide(L("100")).toString());

        expect('Javascript to be wrong.', 15241578750190520, 123456789 * 123456789);

    });

    block('Plutimikation', test, () => {

        expect(
            'Multiplication 123456789*123456789 = 15241578750190521',
            '15241578750190521',
            L('123456789').mul(L('123456789')).toString()
        );

        expect(
            'Multiplication 123456789*123456789 = 15241578750190521',
            '152415787501905.21',
            L('12345678.9').mul(L('12345678.9')).toString()
        );

        expect('Multiplication 0.1*10=1', '1', L('0.1').mul(L('10')).toString());

        expect('Multiplication 1.3*0.12 = 0.156', '0.156', L('1.3').mul(L('0.12')).toString());
        expect('Multiplication 1.3*1.2 = 1.56', '1.56', L('1.3').mul(L('1.2')).toString());
        expect('Multiplication 1.3*1.2 = 1.56', '1.56', L('1.3').mul(L('1.2')).toString());
        expect('Multiplication 1.3*1.3 = 1.69', '1.69', L('1.3').mul(L('1.3')).toString());
        expect('Multiplication 0.1*0.1 = 0.01', '0.01', L('0.1').mul(L('0.1')).toString());
        expect('Multiplication 1*-1 = -1', '-1', L('1').mul(L('-1')).toString());

        expect('Multiplication (123*1.23)*100 = 15129', '15129', L('123').mul(L('1.23')).mul(L('100')).toString());

        expect('Multiplication with 0 is always zero', '0', L('1').mul(L('0')).toString());
        expect('Multiplication with 100 shifts by two zeros', '100', L('1').mul(L('100')).toString());
        expect('Multiplication with 100 shifts by two zeros and vice versa', '100', L('100').mul(L('1')).toString());
    });

    block('ToString', test, () => {

        expect('To string with one digit', '0.1', L([0], [1]).toString());
        expect('To string with four digits', '0.1234', L([0], [1, 2, 3, 4]).toString());

        expect('To string with one digit', '-0.1', L([0], [1], true).toString());
    });

    block('Data-access', test, () => {

        expect('Front is returned', [1, 2, 3], L([1, 2, 3], [4, 5, 6]).front());
        expect('Back is returned', [4, 5, 6], L([1, 2, 3], [4, 5, 6]).back());
    });


    block('Addition', test, () => {

        expect(
            '1 Adding two front-only', [3, 5, 7],
            L([1, 2, 3])
            .add(L([2, 3, 4]))
            .front()
        );
        expect(
            '2 Adding two front-only', [],
            L([1, 2, 3])
            .add(L([2, 3, 5]))
            .back()
        );
        expect(
            '2 Adding two front-only', [3, 5, 8],
            L([1, 2, 3])
            .add(L([2, 3, 5]))
            .front()
        );

        expect(
            'Adding 0.1 and 0.9',
            '1',
            L([], [1])
            .add(L([], [9]))
            .toString()
        );

        expect(
            'Adding 0.1 and 0.2',
            '0.3',
            L([], [1])
            .add(L([], [2]))
            .toString()
        );
        expect(
            'Adding 0.09 and 0.02',
            '0.11',
            L([], [0, 9])
            .add(L([], [0, 2]))
            .toString()
        );
        expect(
            'Adding 0.09 and 0.2',
            '0.29',
            L([], [0, 9])
            .add(L([], [2]))
            .toString()
        );

        expect(
            'Adding 0.9 and 0.2',
            '1.1',
            L([], [9])
            .add(L([], [2]))
            .toString()
        );

        expect(
            'Adding 987654 + 987654 = 1975308',
            '1975308',
            L([9, 8, 7, 6, 5, 4])
            .add(L([9, 8, 7, 6, 5, 4]))
            .toString()
        );

        expect(
            'Adding 9876540000000000 + 9876540000000000 = 19753080000000000',
            '19753080000000000',
            L([9, 8, 7, 6, 5, 4, ...zeros(10)])
            .add(L([9, 8, 7, 6, 5, 4, ...zeros(10)]))
            .toString()
        );

        expect(
            'Adding 12345.6789 + 12345.6789 = 24691.3578',
            '24691,3578',
            L([1, 2, 3, 4, 5], [6, 7, 8, 9])
            .add(L([1, 2, 3, 4, 5], [6, 7, 8, 9]))
            .toString(',')
        );

        expect(
            'Adding 123 + 1 = 124',
            '124',
            L([1, 2, 3], [])
            .add(L([1], []))
            .toString(',')
        );

        expect(
            'Adding twice 123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789',
            '246913578246913578246913578246913578246913578246913578246913578246913578246913578246913578246913578246913578246913578246913578246913578',
            L([
                ...
                '123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789'
                .split('')
                .map((e) => Number(e)),
            ])
            .add(
                L([
                    ...
                    '123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789123456789'
                    .split('')
                    .map((e) => Number(e)),
                ])
            )
            .toString()
        );

        expect('Add -1 + 1 = 0', '0', L('-1').add(L('1')).toString());
        expect('Add -1 + -1 = -2', '-2', L('-1').add(L('-1')).toString());
        expect('Add 5 + -7 = -2', '-2', L('5').add(L('-7')).toString());
        expect('Add -5 + -7 = -12', '-12', L('-5').add(L('-7')).toString());

    });

    block('Comparison', test, () => {
        expect('Compare 1.1 to 1.2 = -1', -1, L('1.1').compare(L('1.2')));
        expect('Compare 11 to 1.2 = 1', 1, L('11').compare(L('1.2')));

        expect('Compare -1 to -2 = 1', 1, L('-1').compare(L('-2')));
        expect('Compare -2 to -1 = -1', -1, L('-2').compare(L('-1')));
        expect('Compare -1 to -1 = 0', 0, L('-1').compare(L('-1')));

        expect('Compare 0.0 to 0.0 = 0 ', 0, L('.0').compare(L('0.')));
    });

    block('Parsinf from string', test, () => {
        expect('Parsing when front is string', '12.3', L('12,3').toString());
        expect('Parsing when front is string', '12.3', L('12.3').toString());
        expect('Parsing when front is string', '12', L('12.').toString());
        expect('Parsing when front is string', '0', L('.').toString());
        expect('Parsing when front is string', '0.3', L('.3').toString());
    });

    console.info('Done testing');
}

export default {
    number: L
}