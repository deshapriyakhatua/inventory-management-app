export function numberToWords(num) {
  if (num === null || num === undefined || isNaN(num)) return "";
  if (num === 0) return "Zero Rupees Only";

  const a = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
    "Seventeen", "Eighteen", "Nineteen"
  ];
  const b = [
    "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"
  ];

  function convertGroup(n) {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + a[n % 10] : "");
    if (n < 1000) {
      return a[Math.floor(n / 100)] + " Hundred" + (n % 100 !== 0 ? " " + convertGroup(n % 100) : "");
    }
    return "";
  }

  const integerPart = Math.floor(Math.abs(num));
  const decimalPart = Math.round((Math.abs(num) - integerPart) * 100);

  let str = "";

  const crore = Math.floor(integerPart / 10000000);
  let remainder = integerPart % 10000000;

  const lakh = Math.floor(remainder / 100000);
  remainder %= 100000;

  const thousand = Math.floor(remainder / 1000);
  remainder %= 1000;

  if (crore > 0) str += convertGroup(crore) + " Crore ";
  if (lakh > 0) str += convertGroup(lakh) + " Lakh ";
  if (thousand > 0) str += convertGroup(thousand) + " Thousand ";
  if (remainder > 0) str += convertGroup(remainder) + " ";

  str = str.trim() ? str.trim() + " Rupees" : "";

  if (decimalPart > 0) {
    str += (str ? " and " : "") + convertGroup(decimalPart) + " Paise";
  }

  return str ? str + " Only" : "Zero Rupees Only";
}
