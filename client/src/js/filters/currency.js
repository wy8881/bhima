/* eslint-disable prefer-template */
/* eslint-disable no-useless-escape */
/**
 * BHIMA fork of angular's native currency filter.
 * Allows currency to be defined for each filter individually.
 * Currency IDs are used to fetch configuration files asynchronously from the server.
 * Completely separates locale from currency format to facilitate reliable accounting.
 * Clearly fails given an unsupported currency ID or configuration.
 *
 * @param {number} amount Value to be converted into currency
 * @param {number} currencyId ID for
 * @returns {string} Valid supported currency or error string
 */

angular.module('bhima.filters')
  .filter('currency', CurrencyFilter);

CurrencyFilter.$inject = [
  'currencyFormat', 'SessionService', '$translate',
];

function CurrencyFilter(CurrencyFormat, Session, $translate) {
  const requireCurrencyDefinition = false;

  function currencyFilter(amount, currencyId, numDecimals) {
    const amountUndefined = angular.isUndefined(amount) || angular === null;

    if (angular.isUndefined(currencyId)) {

      if (requireCurrencyDefinition) {
        return formatError('EXCHANGE.INVALID_CURRENCY_DEFINITION', amount);
      }

      // eslint-disable-next-line no-param-reassign
      currencyId = Session.enterprise.currency_id;
    }

    // Terminate early to reduce calculations for ill formed requests
    if (amountUndefined) {
      return null;
    }

    // Currency cache has not yet retrieved available currency index
    if (!CurrencyFormat.indexReady()) {
      return null;
    }

    const formatConfiguration = CurrencyFormat.request(currencyId);

    // No configuration found - definition is probably being fetched
    if (angular.isUndefined(formatConfiguration)) {
      return null;
    }

    // Currency ID did not match a currency ID or format configuration was not found
    if (!formatConfiguration.supported) {
      return formatError('EXCHANGE.CURRENCY_NOT_SUPPORTED', amount);
    }

    return formatNumber(amount,
      formatConfiguration.PATTERNS[1], formatConfiguration.GROUP_SEP, formatConfiguration.DECIMAL_SEP, numDecimals)
      .replace(/\u00A4/g, formatConfiguration.CURRENCY_SYM);
  }

  // utility methods
  function formatError(message, amount) {
    return $translate.instant(message).concat(' ', amount || '?');
  }

  // Formatting method directly from angular native filter - does not support BHIMA coding guidelines
  const DECIMAL_SEP = '.';

  /**
 * @function formatNumber
 * @number is the ammount
 * @numDecimals is the number of decimals allowed
 */
  function formatNumber(number, pattern, groupSep, decimalSep, fractionSize, numDecimals) {

    if (angular.isObject(number)) return '';

    // eslint-disable-next-line no-param-reassign
    number = Math.abs(number);

    const isInfinity = number === Infinity;
    // eslint-disable-next-line no-restricted-globals
    if (!isInfinity && !isFinite(number)) return '';

    const numStr = `${number} `;
    let formattedText = '';
    let hasExponent = false;
    const parts = [];

    // eslint-disable-next-line no-const-assign
    if (isInfinity) formattedText = '\u221e';

    if (!isInfinity && numStr.indexOf('e') !== -1) {
      const match = numStr.match(/([\d\.]+)e(-?)(\d+)/);
      if (match && match[2] === '-' && match[3] > fractionSize + 1) {
        // eslint-disable-next-line no-param-reassign
        number = 0;
      } else {
        formattedText = numStr;
        hasExponent = true;
      }
    }

    if (!isInfinity && !hasExponent) {
      const fractionLen = (numStr.split(DECIMAL_SEP)[1] || '').length;

      // determine fractionSize if it is not specified
      if (angular.isUndefined(fractionSize)) {
        // eslint-disable-next-line no-param-reassign
        fractionSize = Math.min(Math.max(pattern.minFrac, fractionLen), pattern.maxFrac);
      }

      // Just to use the number of decimals defined in the parameters
      // eslint-disable-next-line no-param-reassign
      fractionSize = numDecimals || fractionSize;

      if (number > 0.01) {
        // eslint-disable-next-line no-param-reassign
        fractionSize = Math.min(Math.max(pattern.minFrac, fractionLen), pattern.maxFrac);
      }

      // safely round numbers in JS without hitting imprecisions of floating-point arithmetics
      // inspired by:
      // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/round
      // eslint-disable-next-line no-param-reassign
      number = +(Math.round(+(number.toString() + 'e' + fractionSize)).toString() + 'e' + -fractionSize);

      let fraction = ('' + number).split(DECIMAL_SEP);
      const whole = fraction[0];
      fraction = fraction[1] || '';

      let i;
      let pos = 0;
      const lgroup = pattern.lgSize;
      const group = pattern.gSize;

      if (whole.length >= (lgroup + group)) {
        pos = whole.length - lgroup;
        for (i = 0; i < pos; i++) {
          if ((pos - i) % group === 0 && i !== 0) {
            formattedText += groupSep;
          }
          formattedText += whole.charAt(i);
        }
      }

      for (i = pos; i < whole.length; i++) {
        if ((whole.length - i) % lgroup === 0 && i !== 0) {
          formattedText += groupSep;
        }
        formattedText += whole.charAt(i);
      }

      // format fraction part.
      while (fraction.length < fractionSize) {
        fraction += '0';
      }

      if (fractionSize && fractionSize !== '0') { formattedText += decimalSep + fraction.substr(0, fractionSize); }
    } else if (fractionSize > 0 && number < 1) {
      formattedText = number.toFixed(fractionSize);
      // eslint-disable-next-line no-param-reassign
      number = parseFloat(formattedText);
    }

    const isNegative = number < 0;

    parts.push(isNegative ? pattern.negPre : pattern.posPre,
      formattedText,
      isNegative ? pattern.negSuf : pattern.posSuf);
    return parts.join('');
  }

  currencyFilter.$stateful = true;

  return currencyFilter;
}
