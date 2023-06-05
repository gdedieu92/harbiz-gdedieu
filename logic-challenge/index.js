
if (process.argv.length !== 3) {
    console.error('Usage: node index.js <integer>. Example: node index.js 39');
    process.exit(1);
}

const numberToConvert = parseInt(process.argv[2]);

if (isNaN(numberToConvert)) {
    console.error('Error: the param given is not a valid number');
    process.exit(1);
}

const binaryRepresentation = numberToConvert.toString(2);
let cantPositiveBits = 0;
let subSequentPositives = [];
for (let x = 0; x < binaryRepresentation.length; x++) {
    const character = parseInt(binaryRepresentation.charAt(x));
    if (character === 1) {
        cantPositiveBits++;
        subSequentPositives.push(x);
    }

}
const output = [cantPositiveBits, subSequentPositives];

console.log(`The exercise output is ${output}`);