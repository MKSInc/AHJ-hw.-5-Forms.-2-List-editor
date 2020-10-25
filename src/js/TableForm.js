/* eslint-disable max-len,object-curly-newline */
import tableForm from '../html/tableForm.html';

export default class TableForm {
  constructor(parentEl) {
    this.parentEl = parentEl;
    this.els = {
      tableForm: null,
      fields: {
        name: null,
        cost: null,
      },
      errorsMessages: {
        name: null,
        cost: null,
      },
      btns: {
        save: null,
        cancel: null,
      },
    };

    this.selectors = {
      tableForm: '[data-modal-id="table-form"]',
      fields: {
        name: '[data-field="name"]',
        cost: '[data-field="cost"]',
      },
      errorsMessages: {
        name: '[data-error-massage="name"]',
        cost: '[data-error-massage="cost"]',
      },
      btns: {
        save: '[data-btn="save"]',
        cancel: '[data-btn="cancel"]',
      },
    };
    // Объекты handlers (обработчики) и listeners (слушатели).
    // handler - обработчик события, это сама функция. Он может быть назначен к нескольким слушателям,
    // т.е быть привязанным к разным элементам или даже к слушателям с разным типом события.
    // Так как функция забиндена в одном месте, то событие при необходимости можно удалить,
    // но в данном проекте это не нужно.
    this.handlers = {
      onInput: this.onInput.bind(this),
      onSave: this.onSave.bind(this),
      onCancel: this.onCancel.bind(this),
    };

    // listener - слушатель. Связывает элемент с обработчиком и типом события.
    // Одному элементу можно назначить несколько слушателей.
    // Или разным элементам назначить слушатели с одинаковым обработчиком (как для name и cost).
    this.listeners = {
      fields: {
        name: [{ eventType: 'input', handler: this.handlers.onInput },
          { eventType: 'keydown', handler: this.handlers.onCancel },
        ],
        cost: [{ eventType: 'input', handler: this.handlers.onInput },
          { eventType: 'keydown', handler: this.handlers.onCancel },
        ],
      },

      btns: {
        save: [{ eventType: 'click', handler: this.handlers.onSave },
          { eventType: 'keydown', handler: this.handlers.onCancel },
        ],
        cancel: [{ eventType: 'click', handler: this.handlers.onCancel },
          { eventType: 'keydown', handler: this.handlers.onCancel },
        ],
      },
    };

    this.errorsMessages = {
      name: {
        valueMissing: 'Введите название',
      },
      cost: {
        valueMissing: 'Введите стоимость',
        badInput: 'Вводите только цифры',
        stepMismatch: 'Число должно быть целым',
        customError: null,
      },
    };

    this.resolve = null;
    this.result = {
      status: null,
      value: {
        name: null,
        cost: null,
      },
    };
  }

  init() {
    this.parentEl.insertAdjacentHTML('beforeend', tableForm);

    // initEl() связывает элемент с DOM-деревом и вешает на него слушатели событий,
    // если такие за ним закреплены в this.listeners
    function initEl(param) {
      const { els, selectors, listeners, el } = param;
      els[el] = this.parentEl.querySelector(selectors[el]);
      if (!listeners) return;
      if (Object.prototype.hasOwnProperty.call(listeners, el)) {
        listeners[el].forEach((listener) => {
          els[el].addEventListener(listener.eventType, listener.handler);
        });
      }
    }

    // initEls() С помощью рекурсии проходит по списку элементов любой вложенности
    // (дальше второго уровня не проверял, но должно работать) и для каждого элемента запускает initEl()
    // Функция преребирает элементы в els, если элемент === null, тогда запускает для него initEl(),
    // в противном случае это не элемент а список, тогда функция запускает саму себя для этого списка.
    function initEls(param) {
      const { els, selectors, listeners } = param;
      Object.keys(els).forEach((el) => {
        if (els[el] === null) initEl.call(this, { els, selectors, listeners, el });
        else initEls.call(this, { els: els[el], selectors: selectors[el], listeners: listeners[el] });
      });
    }

    initEls.call(this, { els: this.els, selectors: this.selectors, listeners: this.listeners });
  }

  show(modalTop, rowData) {
    this.els.tableForm.reset();
    this.hideErrors();
    if (rowData) {
      this.els.fields.name.value = rowData.name;
      this.els.fields.cost.value = rowData.cost;
    }
    this.els.tableForm.style.top = modalTop;
    this.els.tableForm.classList.remove('hidden');
    this.els.fields.name.focus();
  }

  hide() {
    this.els.tableForm.classList.add('hidden');
  }

  onSave(event) {
    event.preventDefault();
    if (!this.validateForm()) return;

    this.result.status = 'save';
    this.result.value.name = this.els.fields.name.value;
    this.result.value.cost = parseInt(this.els.fields.cost.value, 10);
    this.resolve(this.result);
  }

  validateForm() {
    // Добавление кастомной ошибки для случая, когда стоимость меньше или рана нулю.
    this.els.fields.cost.setCustomValidity(''); // Обнулить кастомную ошибку.
    const parsedCost = parseInt(this.els.fields.cost.value, 10);
    if (!Number.isNaN(parsedCost)) {
      if (parsedCost <= 0) {
        this.els.fields.cost.setCustomValidity('Число должно быть больше нуля');
        this.errorsMessages.cost.customError = this.els.fields.cost.validationMessage;
      }
    }

    const isValid = this.els.tableForm.checkValidity();
    if (isValid) return true;

    let isFocused = false;
    for (const field in this.els.fields) {
      if (Object.prototype.hasOwnProperty.call(this.els.fields, field)) {
        if (!this.els.fields[field].validity.valid) {
          const errorType = Object.keys(ValidityState.prototype)
            .find((type) => this.els.fields[field].validity[type]);
          this.showError(field, errorType);
          // Установить фокус в первое невалидное поле
          if (!isFocused) {
            isFocused = true;
            this.els.fields[field].focus();
          }
        }
      }
    }
    return false;
  }

  onCancel(event) {
    if (event.type === 'keydown') {
      if (event.code !== 'Escape') return;
    }
    if (event.type === 'click') event.preventDefault();
    this.result.status = 'cancel';
    this.resolve(this.result);
  }

  showError(field, errorType) {
    this.els.errorsMessages[field].dataset.errorText = this.errorsMessages[field][errorType];
    this.els.errorsMessages[field].classList.remove('error-hidden');
  }

  hideError(field) {
    this.els.errorsMessages[field].classList.add('error-hidden');
  }

  hideErrors() {
    Object.keys(this.errorsMessages).forEach((errorMessage) => {
      this.hideError(errorMessage);
    });
  }

  onInput(event) {
    this.hideError(event.target.dataset.field);
  }

  getResult() {
    return new Promise((resolve) => {
      this.resolve = resolve;
    });
  }
}
