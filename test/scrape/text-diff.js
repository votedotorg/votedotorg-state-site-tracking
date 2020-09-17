const assert = require('assert');
const { cleanText, diffText } = require('../../src/scraper/text');

describe('Text Diffing', function () {
    describe('#cleanTree', function () {
        [
            { name: 'Well formated → noop', input: `Hello world`, output: `Hello world` },
            { name: 'Collapse space runs', input: `  Hello   world    `, output: `Hello world` },
            { name: 'Space following periods', input: `Hello.world..foo`, output: `Hello. world. . foo` },
            { name: 'Space following exclamation', input: `Hello!world!!foo`, output: `Hello! world! ! foo` },
            { name: 'Space following question', input: `Hello?world??foo`, output: `Hello? world? ? foo` },
            {
                name: 'Collapse runs of newlines', input: `Hello 



            world`,
                output: `Hello
 world`
            },
            {
                name: 'Example text',
                input: `Thank you for your interest in registering to vote. We are glad to be of assistance.Please note that the voter
registration application may be used to register or to update your registration information.You may follow the steps
below to register or update.

You may download theState of Alabama Mail-In Voter Registration Formfrom this page. Then, just print it, fill it out,
and mail it in to your local board of registrars! Any individual registering to vote must send the completed application
with his/her original signature to the county'sBoard of Registrars
[http://sos.alabama.gov/alabama-votes/board-of-registrars-all-counties]in which he/she resides.`,
                output: `Thank you for your interest in registering to vote. We are glad to be of assistance. Please note that the voter
registration application may be used to register or to update your registration information. You may follow the steps
below to register or update.
You may download theState of Alabama Mail-In Voter Registration Formfrom this page. Then, just print it, fill it out,
and mail it in to your local board of registrars! Any individual registering to vote must send the completed application
with his/her original signature to the county'sBoard of Registrars
[http://sos.alabama.gov/alabama-votes/board-of-registrars-all-counties]in which he/she resides.`
            },
        ].map(testCase => it(testCase.name, function () {
            const cleaned = cleanText(testCase.input);
            assert.equal(cleaned, testCase.output, testCase.name);
        }))
    });

    describe('#diffText', function () {
        [
            { name: 'Empty string', prev: '', curr: '', expected: [] },
            { name: 'Same string', prev: 'Hello world', curr: 'Hello world', expected: [] },
            { name: 'Add at front', prev: 'Five. Six.', curr: 'Four. Five. Six.', expected: [{ pre: '', prior: '', current: 'Four.', post: 'Five.' }] },
            { name: 'Add in middle', prev: 'Four. Six.', curr: 'Four. Five. Six.', expected: [{ pre: 'Four.', prior: '', current: 'Five.', post: 'Six.' }] },
            { name: 'Add at end', prev: 'Five. Six.', curr: 'Five. Six. Seven.', expected: [{ pre: 'Six.', prior: '', current: 'Seven.', post: '' }] },
            { name: 'Remove at front', prev: 'Four. Five. Six.', curr: 'Five. Six.', expected: [{ pre: '', prior: 'Four.', current: '', post: 'Five.' }] },
            { name: 'Remove in middle', prev: 'Four. Five. Six.', curr: 'Four. Six.', expected: [{ pre: 'Four.', prior: 'Five.', current: '', post: 'Six.' }] },
            { name: 'Remove at end', prev: 'Five. Six.', curr: 'Five.', expected: [{ pre: 'Five.', prior: 'Six.', current: '', post: '' }] },
            { name: 'Change at front', prev: 'Four. Five. Six.', curr: 'Three. Five. Six.', expected: [{ pre: '', prior: 'Four.', current: 'Three.', post: 'Five.' }] },
            { name: 'Change in middle', prev: 'Four. Five. Six.', curr: 'Four. Five and half. Six.', expected: [{ pre: 'Four.', prior: 'Five.', current: 'Five and half.', post: 'Six.' }] },
            { name: 'Change at end', prev: 'Four. Five. Six.', curr: 'Four. Five. Seven.', expected: [{ pre: 'Five.', prior: 'Six.', current: 'Seven.', post: '' }] },
            { 
                name: 'Two additions', 
                prev: 'One. Three. Five. Seven. Nine.', 
                curr: 'One. Two. Three. Four. Five. Seven. Nine.', 
                expected: [
                    {pre: 'One.', prior: '', current: 'Two.', post: 'Three.'},
                    {pre: 'Three.', prior: '', current: 'Four.', post: 'Five.'},
                ] 
            },
            { 
                name: 'Two deletions', 
                prev: 'One. Three. Five. Seven. Nine.', 
                curr: 'One. Five. Nine.', 
                expected: [
                    {pre: 'One.', prior: 'Three.', current: '', post: 'Five.'},
                    {pre: 'Five.', prior: 'Seven.', current: '', post: 'Nine.'},
                ] 
            },
            { 
                name: 'Two changes', 
                prev: 'One. Three. Five. Seven. Nine.', 
                curr: 'One. Two. Five. Six. Nine.', 
                expected: [
                    {pre: 'One.', prior: 'Three.', current: 'Two.', post: 'Five.'},
                    {pre: 'Five.', prior: 'Seven.', current: 'Six.', post: 'Nine.'},
                ] 
            },
            { 
                name: 'A lot of diffs', 
                prev: 'One. Three. Five. Seven. Nine. Eleven. Thirteen.', 
                curr: 'One. Two. Five. Nine. Ten. Eleven.', 
                expected: [
                    {pre: 'One.', prior: 'Three.', current: 'Two.', post: 'Five.'},
                    {pre: 'Five.', prior: 'Seven.', current: '', post: 'Nine.'},
                    {pre: 'Nine.', prior: '', current: 'Ten.', post: 'Eleven.'},
                    {pre: 'Eleven.', prior: 'Thirteen.', current: '', post: ''},
                ] 
            },
            { 
                name: 'Actual text', 
                prev: `Thank you for your interest in registering to vote. We are glad to be of assistance.Please note that the voter
registration application may be used to register or to update your registration information.You may follow the steps`, 
                curr: `Thank you for your interest in registering to vote. We are happy to be of assistance.Please note that the voter
registration application may be used to register or to update your registration information.You may follow the steps`, 
                expected: [{ 
                    pre: 'Thank you for your interest in registering to vote.',
                    prior: 'We are glad to be of assistance.', 
                    current: 'We are happy to be of assistance.',
                    post: 'Please note that the voter\nregistration application may be used to register or to update your registration information.'
                }] 
            },
        ].map(testCase => it(testCase.name, function () {
            const diffs = diffText(testCase.prev, testCase.curr);
            assert.deepEqual(diffs, testCase.expected, testCase.name);
        }))

    })
});
