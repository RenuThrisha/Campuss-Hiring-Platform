/**
 * Parses salary strings into numerical values (annual).
 * Handles: "12 LPA", "70,000", "50k", "1,200,000", etc.
 */
function parseSalary(salaryStr) {
    if (!salaryStr) return 0;

    let str = salaryStr.toLowerCase().replace(/,/g, '').trim();

    // Handle LPA (Lakhs Per Annum)
    if (str.includes('lpa')) {
        let val = parseFloat(str.replace('lpa', '').trim());
        return isNaN(val) ? 0 : val * 100000;
    }

    // Handle 'k' (Thousands)
    if (str.endsWith('k')) {
        let val = parseFloat(str.slice(0, -1).trim());
        return isNaN(val) ? 0 : val * 1000;
    }

    // Handle plain numbers
    let val = parseFloat(str);
    return isNaN(val) ? 0 : val;
}

module.exports = { parseSalary };
