(() => {
  'use strict';

  const MAX_PEOPLE = 25n;
  const MIN_PEOPLE = 1n;
  const MAX_PERCENT = 25n;
  const MONEY_PATTERN = /^\d+(,\d{1,2})?$/;
  const PERCENT_PATTERN = /^\d+(,\d{1,2})?$/;

  const form = document.getElementById('split-form');
  const billInput = document.getElementById('bill');
  const peopleInput = document.getElementById('people');
  const tipInput = document.getElementById('tip-value');
  const tipLabel = document.getElementById('tip-label');
  const tipHint = document.getElementById('tip-hint');
  const tipSuffix = document.getElementById('tip-suffix');
  const clearButton = document.getElementById('clear-button');
  const result = document.getElementById('result');
  const totalAmount = document.getElementById('total-amount');
  const tipAmount = document.getElementById('tip-amount');
  const sharesList = document.getElementById('shares-list');

  const fields = {
    bill: {
      input: billInput,
      error: document.getElementById('bill-error'),
    },
    people: {
      input: peopleInput,
      error: document.getElementById('people-error'),
    },
    tip: {
      input: tipInput,
      error: document.getElementById('tip-error'),
    },
  };

  const touched = new Set();

  function currentTipMode() {
    return form.elements['tip-mode'].value;
  }

  function setFieldError(fieldName, message) {
    const field = fields[fieldName];
    field.error.textContent = message || '';
    field.error.hidden = !message;
    field.input.setAttribute('aria-invalid', message ? 'true' : 'false');
  }

  function clearAllErrors() {
    Object.keys(fields).forEach((fieldName) => setFieldError(fieldName, ''));
  }

  function parseMoney(raw, options) {
    const value = raw.trim();

    if (!value) {
      return { error: options.emptyMessage };
    }

    if (value.includes('.')) {
      return { error: 'Используйте запятую в качестве десятичного разделителя' };
    }

    if (!MONEY_PATTERN.test(value)) {
      return { error: options.invalidMessage };
    }

    const [rubles, kopecks = ''] = value.split(',');
    const cents = BigInt(rubles) * 100n + BigInt(kopecks.padEnd(2, '0') || '0');

    if (!options.allowZero && cents === 0n) {
      return { error: options.positiveMessage };
    }

    return { value: cents };
  }

  function parsePeople(raw) {
    const value = raw.trim();

    if (!value || !/^\d+$/.test(value)) {
      return { error: 'Количество человек должно быть целым числом от 1 до 25' };
    }

    const people = BigInt(value);
    if (people < MIN_PEOPLE || people > MAX_PEOPLE) {
      return { error: 'Количество человек должно быть целым числом от 1 до 25' };
    }

    return { value: Number(people) };
  }

  function parsePercent(raw) {
    const value = raw.trim();

    if (!value) {
      return { error: 'Заполните процент чаевых от 0 до 25' };
    }

    if (value.includes('.')) {
      return { error: 'Используйте запятую в качестве десятичного разделителя' };
    }

    if (!PERCENT_PATTERN.test(value)) {
      return { error: 'Введите процент от 0 до 25' };
    }

    const [whole, fraction = ''] = value.split(',');
    const scale = fraction.length;
    const digits = BigInt(whole + fraction);
    const limit = MAX_PERCENT * (10n ** BigInt(scale));

    if (digits > limit) {
      return { error: 'Введите процент от 0 до 25' };
    }

    return { value: { digits, scale } };
  }

  function parseTip(raw, mode) {
    if (mode === 'percent') {
      return parsePercent(raw);
    }

    return parseMoney(raw, {
      allowZero: true,
      emptyMessage: 'Заполните фиксированную сумму чаевых',
      invalidMessage: 'Введите корректную фиксированную сумму',
      positiveMessage: 'Введите корректную фиксированную сумму',
    });
  }

  function readForm() {
    const bill = parseMoney(billInput.value, {
      allowZero: false,
      emptyMessage: 'Введите сумму больше нуля',
      invalidMessage: 'Введите корректную сумму с запятой',
      positiveMessage: 'Введите сумму больше нуля',
    });
    const people = parsePeople(peopleInput.value.trim());
    const tip = parseTip(tipInput.value, currentTipMode());

    return {
      values: bill.value !== undefined && people.value !== undefined && tip.value !== undefined
        ? { bill: bill.value, people: people.value, tip: tip.value }
        : null,
      errors: {
        bill: bill.error || '',
        people: people.error || '',
        tip: tip.error || '',
      },
    };
  }

  function applyErrors(errors, showAll) {
    Object.keys(fields).forEach((fieldName) => {
      const shouldShow = showAll || touched.has(fieldName);
      if (shouldShow) {
        setFieldError(fieldName, errors[fieldName]);
      }
    });
  }

  function formatMoney(cents) {
    const rubles = cents / 100n;
    const kopecks = (cents % 100n).toString().padStart(2, '0');
    return `${rubles.toString()},${kopecks} ₽`;
  }

  function calculateShares(totalCents, peopleCount) {
    const count = BigInt(peopleCount);
    const baseShare = totalCents / count;
    const remainder = totalCents % count;
    const shares = [];

    for (let index = 0; index < peopleCount; index += 1) {
      shares.push(baseShare + (BigInt(index) < remainder ? 1n : 0n));
    }

    const sharesTotal = shares.reduce((sum, share) => sum + share, 0n);
    if (sharesTotal !== totalCents) {
      throw new Error('Не удалось сохранить точную сумму распределения');
    }

    return shares;
  }

  function calculateTip(billCents, tip) {
    if (currentTipMode() === 'fixed') {
      return tip;
    }

    const denominator = 100n * (10n ** BigInt(tip.scale));
    const numerator = billCents * tip.digits;
    return (numerator + denominator / 2n) / denominator;
  }

  function render(values) {
    const tipCents = calculateTip(values.bill, values.tip);
    const totalCents = values.bill + tipCents;
    const shares = calculateShares(totalCents, values.people);

    totalAmount.textContent = formatMoney(totalCents);
    tipAmount.textContent = formatMoney(tipCents);
    sharesList.replaceChildren();

    const fragment = document.createDocumentFragment();
    shares.forEach((share, index) => {
      const item = document.createElement('li');
      item.className = 'share-row';

      const participant = document.createElement('span');
      participant.textContent = `Участник ${index + 1}`;

      const amount = document.createElement('strong');
      amount.textContent = formatMoney(share);

      item.append(participant, amount);
      fragment.appendChild(item);
    });

    sharesList.appendChild(fragment);
    result.hidden = false;
  }

  function validateAndMaybeRender(showAll) {
    const parsed = readForm();
    applyErrors(parsed.errors, showAll);

    if (parsed.values) {
      render(parsed.values);
    }

    return parsed;
  }

  function updateTipUI() {
    const isPercent = currentTipMode() === 'percent';
    tipLabel.textContent = isPercent ? 'Процент чаевых' : 'Фиксированные чаевые';
    tipInput.placeholder = isPercent ? 'например, 10' : 'например, 150,00';
    tipSuffix.textContent = isPercent ? '%' : '₽';
    tipHint.textContent = isPercent
      ? 'От 0 до 25%. Можно указать дробное значение.'
      : 'Нулевая сумма допустима. Используйте рубли и копейки.';
  }

  function handleInput(fieldName) {
    touched.add(fieldName);
    validateAndMaybeRender(false);
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    Object.keys(fields).forEach((fieldName) => touched.add(fieldName));
    const parsed = validateAndMaybeRender(true);
    const firstInvalid = Object.keys(fields).find((fieldName) => parsed.errors[fieldName]);

    if (firstInvalid) {
      fields[firstInvalid].input.focus();
    }
  });

  billInput.addEventListener('input', () => handleInput('bill'));
  peopleInput.addEventListener('input', () => handleInput('people'));
  tipInput.addEventListener('input', () => handleInput('tip'));

  Array.from(form.elements['tip-mode']).forEach((radio) => {
    radio.addEventListener('change', () => {
      updateTipUI();
      setFieldError('tip', '');
      if (tipInput.value.trim()) {
        touched.add('tip');
        validateAndMaybeRender(false);
      } else {
        touched.delete('tip');
      }
    });
  });

  clearButton.addEventListener('click', () => {
    form.reset();
    touched.clear();
    updateTipUI();
    clearAllErrors();
    totalAmount.textContent = '0,00 ₽';
    tipAmount.textContent = '0,00 ₽';
    sharesList.replaceChildren();
    result.hidden = true;
    billInput.focus();
  });

  updateTipUI();
})();
