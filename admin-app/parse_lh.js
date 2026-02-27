const fs = require('fs');
const data = JSON.parse(fs.readFileSync('lh-report-after.json', 'utf8'));
const lcp = data.audits['largest-contentful-paint'];
const tbt = data.audits['total-blocking-time'];
const cls = data.audits['cumulative-layout-shift'];
const perf = data.categories.performance;

console.log('--- NEW METRICS ---');
console.log('LCP:', lcp.displayValue, 'Numeric:', lcp.numericValue);
console.log('TBT:', tbt.displayValue, 'Numeric:', tbt.numericValue);
console.log('CLS:', cls.displayValue, 'Numeric:', cls.numericValue);
console.log('Performance Score:', perf.score * 100);

try {
    const oldData = JSON.parse(fs.readFileSync('../amppattaya-home-lh.json', 'utf8'));
    const oldLcp = oldData.audits['largest-contentful-paint'];
    const oldTbt = oldData.audits['total-blocking-time'];
    const oldPerf = oldData.categories.performance;
    console.log('--- OLD METRICS ---');
    console.log('OLD LCP:', oldLcp.displayValue);
    console.log('OLD TBT:', oldTbt.displayValue);
    console.log('OLD Score:', oldPerf.score * 100);
} catch (e) {
    console.log('Could not read old metrics');
}
